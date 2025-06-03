# cosmos/session_manager.py

import uuid
from datetime import datetime, timedelta
from azure.identity import DefaultAzureCredential
from azure.cosmos import CosmosClient, exceptions
import os
from dotenv import load_dotenv
from typing import Optional, Dict, Any

# Load environment variables
load_dotenv()

# Cosmos DB configuration
COSMOS_DB_URL = os.getenv("COSMOS_DB_URL")
COSMOS_DB_DATABASE_NAME = os.getenv("COSMOS_DB_DATABASE_NAME")
COSMOS_DB_CONTAINER_NAME = os.getenv("COSMOS_DB_CONTAINER_NAME")
SESSION_EXPIRATION_HOURS = 24  # Configure as needed

# Initialize Cosmos DB client
credential = DefaultAzureCredential()
client = CosmosClient(COSMOS_DB_URL, credential=credential)
database = client.get_database_client(COSMOS_DB_DATABASE_NAME)
container = database.get_container_client(COSMOS_DB_CONTAINER_NAME)

def is_session_valid(session: Optional[Dict[str, Any]]) -> bool:
    """
    Check if a session is valid and not expired.
    
    Parameters:
        session (Optional[Dict[str, Any]]): The session to validate
        
    Returns:
        bool: True if session is valid and not expired, False otherwise
    """
    if not session:
        return False
    
    last_interaction = datetime.fromisoformat(session['last_interaction_time'])
    expiration_time = timedelta(hours=SESSION_EXPIRATION_HOURS)
    return datetime.utcnow() - last_interaction < expiration_time

def get_session(user_id: str, session_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Retrieve a session for the given user_id and optional session_id.
    
    Parameters:
        user_id (str): The unique identifier for the user
        session_id (Optional[str]): The specific session ID to retrieve
        
    Returns:
        Optional[Dict[str, Any]]: The session if found and valid, None otherwise
    """
    try:
        if session_id:
            query = f"SELECT * FROM c WHERE c.session_id = '{session_id}' AND c.user_id = '{user_id}'"
        else:
            query = f"SELECT * FROM c WHERE c.user_id = '{user_id}' ORDER BY c._ts DESC"
        
        items = list(container.query_items(query=query, enable_cross_partition_query=True))
        
        if not items:
            return None
            
        session = items[0]
        return session if is_session_valid(session) else None
        
    except exceptions.CosmosHttpResponseError as e:
        print(f"Error fetching session: {str(e)}")
        return None

def create_session(user_id: str) -> Dict[str, Any]:
    """
    Create a new session for the user.
    
    Parameters:
        user_id (str): The unique identifier for the user
        
    Returns:
        Dict[str, Any]: The newly created session object
    """
    session_id = str(uuid.uuid4())
    current_time = datetime.utcnow().isoformat()
    
    session = {
        "id": session_id,
        "session_id": session_id,
        "user_id": user_id,
        "start_time": current_time,
        "last_interaction_time": current_time,
        "chat_history": []
    }
    
    try:
        container.create_item(body=session)
        return session
    except exceptions.CosmosHttpResponseError as e:
        raise Exception(f"Error creating session: {e}")

def update_session_timestamp(session_id: str) -> None:
    """
    Update the last interaction time of the session.
    
    Parameters:
        session_id (str): The session identifier
    """
    try:
        session = container.read_item(item=session_id, partition_key=session_id)
        session["last_interaction_time"] = datetime.utcnow().isoformat()
        container.upsert_item(session)
    except exceptions.CosmosHttpResponseError as e:
        print(f"Error updating session timestamp: {str(e)}")

def save_chat_message(session_id: str, user_message: str, bot_response: str, references: list = None) -> None:
    """
    Save a chat message to an existing session.
    
    Parameters:
        session_id (str): The session identifier
        user_message (str): The message from the user
        bot_response (str): The response from the bot
        references (list, optional): List of reference URLs
    """
    try:
        session = container.read_item(item=session_id, partition_key=session_id)
        
        chat_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_message": user_message,
            "bot_response": bot_response,
            "references": references or []
        }
        
        session["chat_history"].append(chat_entry)
        session["last_interaction_time"] = datetime.utcnow().isoformat()
        
        container.upsert_item(session)
    except exceptions.CosmosHttpResponseError as e:
        print(f"Error saving chat message: {str(e)}")

def get_chat_history(session_id: str) -> list:
    """
    Retrieve the chat history for a session.
    
    Parameters:
        session_id (str): The session identifier
    
    Returns:
        list: A list of chat entries for the session
    """
    try:
        session = container.read_item(item=session_id, partition_key=session_id)
        return session.get("chat_history", [])
    except exceptions.CosmosHttpResponseError as e:
        print(f"Error retrieving chat history: {str(e)}")
        return []

def get_all_chat_histories() -> list:
    """
    Retrieve all chat histories from all sessions.
    
    Returns:
        list: A list of all session documents with their chat histories
    """
    try:
        query = "SELECT * FROM c ORDER BY c._ts DESC"
        items = list(container.query_items(
            query=query, 
            enable_cross_partition_query=True
        ))
        print(f"Total sessions found: {len(items)}")
        return items
    except exceptions.CosmosHttpResponseError as e:
        print(f"Error fetching all chat histories: {str(e)}")
        return []
