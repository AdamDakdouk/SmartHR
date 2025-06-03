import os
import re
import json
from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer import DocumentAnalysisClient
from dotenv import load_dotenv
from openai_logic import generate_embeddings
from vector_storage_service import store_document_embeddings
from urllib.parse import urlparse

load_dotenv()


FORM_RECOGNIZER_ENDPOINT = os.getenv("AZURE_FORM_RECOGNIZER_ENDPOINT")
FORM_RECOGNIZER_KEY = os.getenv("AZURE_FORM_RECOGNIZER_KEY")
CUSTOM_MODEL_ID = os.getenv("AZURE_FORM_RECOGNIZER_MODEL_ID")

# Initialize Form Recognizer client
document_analysis_client = DocumentAnalysisClient(
    endpoint=FORM_RECOGNIZER_ENDPOINT,
    credential=AzureKeyCredential(FORM_RECOGNIZER_KEY)
)

def sanitize_id(input_id: str) -> str:
    """Sanitize the document ID to be compatible with Azure services."""
    return re.sub(r'[^a-zA-Z0-9_\-=]', '_', input_id)

def get_document_name(document_url: str) -> str:
    """Extract the document name from the URL."""
    path = urlparse(document_url).path
    return os.path.basename(path)

def analyze_document_from_url(document_url: str):
    """
    Analyze a document from a URL using Azure Form Recognizer.
    
    Parameters:
        document_url (str): The URL of the document to analyze
        
    Returns:
        str: JSON string containing the analysis results
    """
    try:
        poller = document_analysis_client.begin_analyze_document_from_url(
            model_id=CUSTOM_MODEL_ID,
            document_url=document_url
        )
        result = poller.result()

        analyzed_data = []
        document_name = get_document_name(document_url)

        for document in result.documents:
            document_text = " ".join([
                f"{name}: {field.value}" 
                for name, field in document.fields.items() 
                if field and field.value
            ])
            if document_text:
                embedding = generate_embeddings(document_text)
                raw_id = f"{document_name}_{document.doc_type}_{document.confidence}"
                sanitized_id = sanitize_id(raw_id)

                document_data = {
                    "id": sanitized_id,
                    "document_type": document.doc_type,
                    "confidence": document.confidence,
                    "content": document_text,
                    "content_vector": embedding,
                    "document_url": document_url
                }

                analyzed_data.append(document_data)
                
                # Store the document in vector storage
                store_document_embeddings(document_data)

        return json.dumps({"status": "success", "data": analyzed_data})

    except Exception as e:
        raise Exception(f"Document analysis failed: {e}")