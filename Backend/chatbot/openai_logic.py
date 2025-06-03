import os
import requests
from dotenv import load_dotenv
from openai import AzureOpenAI
from typing import Iterator, Dict, List, Union, Any

load_dotenv()

# Load OpenAI configurations
EMBEDDING_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
EMBEDDING_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT_CHATBOT")
EMBEDDING_DEPLOYMENT_NAME = os.getenv("AZURE_EMBEDDING_DEPLOYMENT")
CHATBOT_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
CHATBOT_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT_CHATBOT")
CHATBOT_DEPLOYMENT_NAME = os.getenv("AZURE_CHATBOT_DEPLOYMENT")
AZURE_SEARCH_ENDPOINT = os.getenv("AZURE_SEARCH_ENDPOINT")
AZURE_SEARCH_KEY = os.getenv("AZURE_SEARCH_API_KEY")
AZURE_SEARCH_INDEX = os.getenv("AZURE_SEARCH_INDEX_NAME")

# Initialize Azure OpenAI clients
embedding_client = AzureOpenAI(
    azure_endpoint=EMBEDDING_ENDPOINT,
    api_key=EMBEDDING_API_KEY,
    api_version="2023-05-15"
)

chatbot_client = AzureOpenAI(
    azure_endpoint=CHATBOT_ENDPOINT,
    api_key=CHATBOT_API_KEY,
    api_version="2024-08-01-preview"
)

def perform_search(query: str):
    """
    Perform a semantic search in Azure Cognitive Search.
    
    Parameters:
        query (str): The search query
        
    Returns:
        list: List of reference documents
    """
    # Check if search is configured
    if not all([AZURE_SEARCH_ENDPOINT, AZURE_SEARCH_KEY, AZURE_SEARCH_INDEX]):
        print("Azure Search not configured, skipping search")
        return []
        
    search_url = f"{AZURE_SEARCH_ENDPOINT}/indexes/{AZURE_SEARCH_INDEX}/docs/search?api-version=2023-11-01"
    headers = {
        "Content-Type": "application/json",
        "api-key": AZURE_SEARCH_KEY
    }
    search_payload = {"search": query, "top": 3}
    
    try:
        response = requests.post(search_url, headers=headers, json=search_payload)
        response.raise_for_status()
        search_results = response.json()
        references = [
            {
                "id": doc.get("id", "unknown"),
                "content": doc.get("content", ""),
                "url": doc.get("document_url", "N/A")
            }
            for doc in search_results.get("value", [])
        ]
        return references
    except Exception as e:
        print(f"Search query failed: {e}")
        # Return empty list on error instead of raising an exception
        return []

def generate_chat_completion_stream(user_message: str) -> Iterator[Dict[str, Union[str, List[str]]]]:
    """
    Generate a streaming chat completion.
    
    Parameters:
        user_message (str): The user's message
        
    Returns:
        Iterator[Dict[str, Union[str, List[str]]]]: Stream of completion chunks
    """
    try:
        # Try to perform search but don't let it break the whole function
        try:
            search_context = perform_search(user_message)
            context_content = "\n".join([doc["content"] for doc in search_context])
        except Exception as search_error:
            print(f"Error in search, continuing without search results: {str(search_error)}")
            search_context = []
            context_content = ""
        
        # Default system message if search fails or isn't configured
        if not context_content:
            system_message = """
            You are a helpful assistant. Please provide your response in a natural conversational style.
            """
        else:
            system_message = """
            You are a helpful assistant. Please provide your response with references embedded naturally within the text.
            When you reference a source, use a numbered citation style [1], [2], etc.
            At the end of your response, include a "References" section listing all cited sources.
            
            Context: {context}
            """.format(context=context_content)
        
        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message}
        ]
        
        # Create streaming response
        stream = chatbot_client.chat.completions.create(
            model=CHATBOT_DEPLOYMENT_NAME,
            messages=messages,
            stream=True
        )
        
        # Get valid references
        valid_refs = [doc["url"] for doc in search_context if doc["url"] != "N/A"]
        
        # Process the stream with safer chunk handling
        for chunk in stream:
            # Check if the chunk and its properties exist
            if (hasattr(chunk, 'choices') and 
                len(chunk.choices) > 0 and 
                hasattr(chunk.choices[0], 'delta') and 
                hasattr(chunk.choices[0].delta, 'content') and 
                chunk.choices[0].delta.content is not None):
                
                yield {
                    "type": "content",
                    "content": chunk.choices[0].delta.content,
                    "references": valid_refs
                }
                
        # Send references as final chunk
        if valid_refs:
            references_section = "\n\nReferences:\n"
            for i, ref in enumerate(valid_refs, 1):
                references_section += f"[{i}] {ref}\n"
            yield {
                "type": "references",
                "content": references_section,
                "references": valid_refs
            }
            
    except Exception as e:
        # Log the full error for debugging
        print(f"Error in generate_chat_completion_stream: {str(e)}")
        yield {
            "type": "error",
            "content": f"An error occurred while processing your request: {str(e)}",
            "references": []
        }

def generate_embeddings(text: str):
    """
    Generate embeddings for the given text.
    
    Parameters:
        text (str): The text to embed
        
    Returns:
        list: The embedding vector
    """
    try:
        # Make sure text is not empty
        if not text or not text.strip():
            raise ValueError("Cannot generate embeddings for empty text")
            
        response = embedding_client.embeddings.create(
            input=text,  # Make sure the parameter is named 'input'
            model=EMBEDDING_DEPLOYMENT_NAME
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Embedding generation failed: {e}")
        raise Exception(f"Embedding generation failed: {e}")