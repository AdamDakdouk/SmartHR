import azure.functions as func
import logging
import json
import uuid
import io
from datetime import datetime
from typing import Dict, Any
from doc_analysis import analyze_document_from_url
from openai_logic import generate_chat_completion_stream
import os
def process_completion_chunk(chunk: Dict[str, Any]) -> Dict[str, Any]:
    """Process a completion chunk and return a properly formatted message."""
    return {
        "type": "chunk",
        "content": chunk.get("content", ""),
        "timestamp": datetime.utcnow().isoformat()
    }

def format_sse_message(data: Dict[str, Any]) -> str:
    """Format a dictionary as a Server-Sent Events message."""
    return f"data: {json.dumps(data)}\n\n"

def generate_stream(user_message: str):
    """Generator function for streaming response with improved chunking."""
    try:
        buffer = []
        word_count = 0
        
        for chunk in generate_chat_completion_stream(user_message):
            content = chunk.get("content", "")
            buffer.append(content)
            word_count += len(content.split())
            
            # Send chunks when we have accumulated enough words or hit punctuation
            if word_count >= 5 or any(p in content for p in ['.', '!', '?', '\n']):
                response_chunk = {
                    "type": "chunk",
                    "content": "".join(buffer),
                    "timestamp": datetime.utcnow().isoformat()
                }
                yield format_sse_message(response_chunk)
                buffer = []
                word_count = 0
        
        # Send any remaining content in the buffer
        if buffer:
            response_chunk = {
                "type": "chunk",
                "content": "".join(buffer),
                "timestamp": datetime.utcnow().isoformat()
            }
            yield format_sse_message(response_chunk)
        
        # Send completion message
        yield format_sse_message({
            "type": "done",
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        yield format_sse_message({
            "type": "error",
            "content": str(e),
            "timestamp": datetime.utcnow().isoformat()
        })
        yield format_sse_message({
            "type": "done",
            "timestamp": datetime.utcnow().isoformat()
        })

app = func.FunctionApp()

@app.function_name(name="chatbot")
@app.route(route="chatbot", methods=["POST"])
@app.cosmos_db_output(
    connection="CosmosDBConnection",
    database_name="Chatbot",
    container_name="chatbot",
    create_if_not_exists=True,
    partition_key="/session_id",
    arg_name="outputDoc"
)
def chatbot_endpoint(req: func.HttpRequest, outputDoc: func.Out[func.Document]) -> func.HttpResponse:
    try:
        # Parse the request body
        req_body = req.get_json()
        logging.info(f"Received request body: {json.dumps(req_body)}")

        user_id = req_body.get('user_id')
        user_message = req_body.get('message')
        session_id = req_body.get('session_id')

        logging.info(f"Parsed values - user_id: {user_id}, session_id: {session_id}, message length: {len(user_message) if user_message else 0}")

        # Validate required fields
        if not user_id or not user_message:
            return func.HttpResponse(
                json.dumps({
                    "type": "error",
                    "message": "Both 'user_id' and 'message' are required fields.",
                    "timestamp": datetime.utcnow().isoformat()
                }),
                mimetype="application/json",
                status_code=400
            )

        # Initialize the record variable
        record = None

        # Handle session management
        if session_id:
            logging.info(f"Checking for existing session: {session_id}")
            
            try:
                import azure.cosmos as cosmos
                client = cosmos.CosmosClient.from_connection_string(
                    conn_str=os.environ["CosmosDBConnection"]
                )
                database = client.get_database_client("chatbot")
                container = database.get_container_client("main")
                
                query = f"SELECT * FROM c WHERE c.session_id = '{session_id}'"
                items = list(container.query_items(
                    query=query,
                    enable_cross_partition_query=True
                ))
                
                if items:
                    record = items[0]
                    logging.info(f"Found existing session record: {json.dumps(record)}")
                    
                    if record['user_id'] != user_id:
                        return func.HttpResponse(
                            json.dumps({
                                "type": "error",
                                "message": "User ID does not match session owner",
                                "timestamp": datetime.utcnow().isoformat()
                            }),
                            mimetype="application/json",
                            status_code=403
                        )
                # No else block here - will create a new session if not found
            except Exception as e:
                logging.error(f"Error querying CosmosDB: {str(e)}")
                # Continue execution instead of returning an error
                logging.info("Proceeding to create a new session due to database error")

        # Create new session if needed
        if not record:
            # Use the provided session_id if it exists, otherwise generate a new one
            if not session_id:
                session_id = str(uuid.uuid4())
                
            record = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "session_id": session_id,
                "chat_history": [],
                "references": [],
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            logging.info(f"Created new session record: {json.dumps(record)}")

        # Add user message to chat history
        record['chat_history'].append({
            "id": str(uuid.uuid4()),
            "role": "user",
            "content": user_message,
            "timestamp": datetime.utcnow().isoformat()
        })

        # Create a streaming response with better chunking
        response_stream = io.StringIO()
        
        # Send initial message with the session ID
        initial_message = {
            "type": "info",
            "content": "Message received, generating response...",
            "session_id": session_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        response_stream.write(format_sse_message(initial_message))

        # Collect the full response while streaming
        full_response = []
        
        # Stream the response with improved chunking
        for chunk in generate_stream(user_message):
            response_stream.write(chunk)
            
            # Extract content from chunk for full response
            try:
                data = json.loads(chunk.split("data: ")[1])
                if data["type"] == "chunk":
                    full_response.append(data["content"])
            except (json.JSONDecodeError, IndexError):
                continue

        # Append the assistant's response
        record['chat_history'].append({
            "id": str(uuid.uuid4()),
            "role": "assistant",
            "content": "".join(full_response),
            "timestamp": datetime.utcnow().isoformat()
        })
        record['updated_at'] = datetime.utcnow().isoformat()

        # Save to Cosmos DB
        outputDoc.set(func.Document.from_dict(record))

        # Return the streaming response
        return func.HttpResponse(
            body=response_stream.getvalue(),
            mimetype="text/event-stream",
            status_code=200
        )
        
    except Exception as e:
        logging.error(f"Error in chatbot endpoint: {str(e)}")
        return func.HttpResponse(
            json.dumps({
                "type": "error",
                "message": f"Unexpected error: {str(e)}",
                "timestamp": datetime.utcnow().isoformat()
            }),
            mimetype="application/json",
            status_code=500
        )

@app.function_name(name="getchathistorybysession")
@app.route(route="getchathistorybysession", methods=["POST"])
@app.cosmos_db_input(
    connection="CosmosDBConnection",
    arg_name="documents",
    database_name="chatbot",
    container_name="main",
    sql_query="SELECT * FROM c WHERE c.session_id = {session_id}"
)
def get_chat_history_endpoint(req: func.HttpRequest, documents: func.DocumentList) -> func.HttpResponse:
    try:
        req_body = req.get_json()
        session_id = req_body.get('session_id')
        
        if not session_id:
            return func.HttpResponse("Session ID is required", status_code=400)
        
        if documents:
            session = list(documents)[0]
            return func.HttpResponse(
                json.dumps(session.get("chat_history", [])), 
                mimetype="application/json",
                status_code=200
            )
        return func.HttpResponse(
            json.dumps([]),
            mimetype="application/json",
            status_code=200
        )
    except Exception as e:
        return func.HttpResponse(f"Failed to retrieve chat history: {e}", status_code=500)

@app.function_name(name="getchathistory")
@app.route(route="getchathistory", methods=["GET"])
@app.cosmos_db_input(
    connection="CosmosDBConnection",
    arg_name="documents",
    database_name="chatbot",
    container_name="main",
    sql_query="SELECT * FROM c ORDER BY c._ts DESC"
)
def get_all_chat_histories_endpoint(req: func.HttpRequest, documents: func.DocumentList) -> func.HttpResponse:
    try:
        histories = []
        for doc in documents:
            try:
                history_dict = doc.to_dict()
                if isinstance(history_dict, dict):
                    histories.append(history_dict)
            except Exception as doc_error:
                print(f"Error processing document: {str(doc_error)}")
                continue

        return func.HttpResponse(
            json.dumps({
                "status": "success",
                "count": len(histories),
                "histories": histories
            }),
            mimetype="application/json",
            status_code=200
        )
    except Exception as e:
        return func.HttpResponse(
            json.dumps({
                "status": "error",
                "error": str(e),
                "details": "Failed to retrieve chat histories"
            }),
            status_code=500,
            mimetype="application/json"
        )

@app.function_name(name="AnalyzeDocument")
@app.route(route="AnalyzeDocument", methods=["POST"], auth_level=func.AuthLevel.FUNCTION)
def analyze_document(req: func.HttpRequest) -> func.HttpResponse:
    try:
        req_body = req.get_json()
        document_url = req_body.get('document_url')
        if not document_url:
            return func.HttpResponse("Missing document URL", status_code=400)
    except ValueError:
        return func.HttpResponse("Invalid JSON", status_code=400)

    try:
        result = analyze_document_from_url(document_url)
    except Exception as e:
        return func.HttpResponse(f"Document analysis failed: {e}", status_code=500)

    return func.HttpResponse(result, mimetype="application/json", status_code=200)