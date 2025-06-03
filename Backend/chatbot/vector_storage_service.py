import os
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration details
SEARCH_SERVICE_ENDPOINT = os.getenv("AZURE_SEARCH_ENDPOINT")
SEARCH_SERVICE_API_KEY = os.getenv("AZURE_SEARCH_API_KEY")
INDEX_NAME = os.getenv("AZURE_SEARCH_INDEX_NAME")

# Initialize the Search Client
credential = AzureKeyCredential(SEARCH_SERVICE_API_KEY)
search_client = SearchClient(
    endpoint=SEARCH_SERVICE_ENDPOINT,
    index_name=INDEX_NAME,
    credential=credential
)

def store_document_embeddings(document_data):
    """
    Store document embeddings and metadata in Azure Cognitive Search.
    
    Parameters:
        document_data (dict): Document data including ID, content, embeddings and URL
    """
    try:
        # Prepare document for indexing
        search_document = {
            "id": document_data["id"],
            "document_type": document_data.get("document_type", "unknown"),
            "confidence": document_data.get("confidence", 0.0),
            "content": document_data.get("content", ""),
            "content_vector": document_data.get("content_vector", []),
            "document_url": document_data.get("document_url", "")
        }
        
        # Upload document to the search index
        result = search_client.upload_documents(documents=[search_document])
        
        print(f"Document {document_data['id']} indexed with status: {result[0].succeeded}")
        return result[0].succeeded
        
    except Exception as e:
        print(f"Error storing document embeddings: {e}")
        return False

def search_similar_documents(query_embedding, top_k=3):
    """
    Search for similar documents using vector similarity.
    
    Parameters:
        query_embedding (list): The embedding vector for the query
        top_k (int): Number of results to return
        
    Returns:
        list: List of similar documents
    """
    try:
        # Create vector query
        vector_query = {
            "vector": query_embedding,
            "fields": "content_vector",
            "k": top_k
        }
        
        # Execute the search
        results = search_client.search(
            search_text=None,
            vector_queries=[vector_query],
            select=["id", "content", "document_url", "document_type"],
            top=top_k
        )
        
        # Process and return results
        similar_docs = []
        for result in results:
            similar_docs.append({
                "id": result["id"],
                "content": result["content"],
                "url": result["document_url"],
                "type": result["document_type"]
            })
            
        return similar_docs
        
    except Exception as e:
        print(f"Error searching similar documents: {e}")
        return []