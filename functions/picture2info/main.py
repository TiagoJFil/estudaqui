# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`
import asyncio
import json
import os
from firebase_functions import  storage_fn, params
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app
from openai import AsyncOpenAI
from firebase_functions.options import MemoryOption
from gcloud.aio.datastore import Datastore
from gcloud.aio.datastore import Key
from gcloud.aio.datastore import PathElement
from tenacity import (
    retry,
    stop_after_attempt,
    wait_random_exponential,
    retry_if_exception
)  # for exponential backoff
from openai import RateLimitError , APITimeoutError, APIConnectionError
from gcloud.aio.datastore import Datastore, Key, Entity, Value, Operation
from aiohttp.client_exceptions import ClientResponseError
from typing import TypedDict, List, Optional, Literal

class Question(TypedDict):
    questionNumber: str
    question: str
    supplementalContent: str
    questionType: Literal["openEnded", "multipleChoice", "prompt", "other"]
    responses: Optional[List[str]]
    correctResponses: Optional[List[str]]
    imgCount: int

class ProcessImageResult(TypedDict):
    questions: List[Question]

set_global_options(
    max_instances=20,  # Increased instances for better scalability
    region="us-west1", 
    memory=MemoryOption.GB_1,
    timeout_sec=540,  # Increased timeout for larger PDFs
    cpu=1,
    concurrency=20,
    secrets=["OPENAI_API_KEY"]  # Use Firebase Secret Manager for sensitive data
)

MAX_CONCURRENT_OPERATIONS = int(os.environ.get("THREADS", "8"))

initialize_app()

# Get the OpenAI API key from Firebase Secret Manager
openai_api_key = params.SecretParam("OPENAI_API_KEY")
openai_client = AsyncOpenAI(api_key=openai_api_key.value)
project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "estudaqui-f849d")
result_collection = os.environ.get("RESULT_COLLECTION", "test")

@retry(
        wait=wait_random_exponential(min=1, max=60),
        stop=stop_after_attempt(6),
        retry=(lambda e: isinstance(e, (RateLimitError, APITimeoutError, APIConnectionError)) or 
               hasattr(e, 'status_code') and e.status_code in [429, 500, 502, 503, 504] or
               'connection' in str(e).lower() or 'timeout' in str(e).lower() or
               'network' in str(e).lower())
    )
async def openai_response_with_backoff(**kwargs):
    """
    Retry the function with exponential backoff in case of rate limits or other transient errors.
    """
    try:
        return await openai_client.responses.create(**kwargs)
    except Exception as e:
        print(f"OpenAI API error: {str(e)}")
        print(f"Error type: {type(e)}")
        # Log more details about connection errors
        if hasattr(e, '__dict__'):
            print(f"Error details: {e.__dict__}")
        raise

async def process_image_gpt(image_link: str, file_name: str, model: str = "gpt-4.1-mini") -> ProcessImageResult:
    """
    Send a single page-image to OpenAI and return its JSON payload.
    """
    # construct messages
    messages = [
        {
            "role": "system",
            "content": (
"""

You are a professional exam parser.

Your task is to extract all questions from the **provided document only**. Do not use any external knowledge or make assumptions beyond the content shown.  
Return the results in **strict, valid JSON** with the following structure (no comments, no trailing commas):

`{  "questions":  [  {  "questionNumber":  "string",  "question":  "string",  "supplementalContent":  "string",  "questionType":  "openEnded" | "multipleChoice" | "prompt" | "other",  "responses":  ["string", ...] | null,  "correctResponses":  ["string", ...] | null,  "imgCount": number }  ]  }` 

### Rules:

1.  Use **only** the content from the input document. **Do not infer, invent, or supplement** information.
    
2.  For each question:
    
    -   Set the `questionNumber` field to the **exact question number or identifier** as shown (e.g., "1", "Q1", "Pergunta 3", etc.).
    -   Set the `question` field to the **exact question text** as written.
    -   Set the `supplementalContent` field to include **all directly attached content necessary to understand the question**, such as:
        -   Code snippets
        -   Text excerpts
        -   Definitions
        -   Instructions
            
    -   **Do not reference external content** (e.g., do not write "Leia o excerto..."). If an excerpt or context is present, copy it in full.
    -   Set `imgCount` to the number of images directly attached to the question, or 0 if none are present.
        
3.  Set `questionType` as follows:
    -   `"openEnded"`: requires a free-text response
    -   `"multipleChoice"`: includes predefined options
    -   `"prompt"`: **not a question** but a context or instruction block, typically to introduce a group of questions or content (e.g., diagrams, figures, setups). It is not meant to be answered.
    -   `"other"`: any other format
        
4.  Set `responses` to:
    -   An array of response options (in exact order and formatting)
    -   Otherwise `null` if none are present
        
5.  Set `correctResponses` to:
    -   An array of correct answers, **only if clearly marked** in the document
    -   Otherwise, set to `null`
        
6.  **Escape all necessary characters** to ensure valid JSON (e.g., quotes, newlines).
7.  **Preserve original wording, formatting, and order** exactly as shown in the document.
8.  **Do not include explanations, commentary, or any output other than the JSON.**

### Formatting Rules:

-   Use `$...$` for inline mathematical expressions.
-   Use `$$...$$` or `\[\]` for block mathematical expressions.
-   Do not use `\\[...\\]` or any other math delimiters.
-   Do not include images, HTML, or unsupported Markdown features.

### Output:

Return **only the JSON object** as described above. Do not include any other text, commentary, or formatting (such as code fences). """)
        },
        { "role": "user",
          "content": [
                {
                    "type": "input_image",
                    "image_url": image_link,
                    "detail": "high"
                },
            ],
        }
    ]
    # call OpenAI without file attachments
    startTime = asyncio.get_event_loop().time()
    resp = await openai_response_with_backoff(
        model=model,
        input=messages,
        temperature=0.15
    )
    endTime = asyncio.get_event_loop().time()
    print(f"Processed image \"{file_name}\" in {endTime - startTime:.2f} seconds with model {model}.")
    # assume the assistant’s reply content is the JSON text
    content = resp.output_text.strip()

    # validate JSON format
    try:
        content_json: ProcessImageResult = json.loads(content)
        return content_json
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON for file {file_name}: {str(e)}")
        print(f"Raw content: {content}")  # Print first 200 chars for debugging
        
        # Try to clean up common JSON formatting issues
        try:
            # Sometimes GPT-4 adds markdown formatting or extra text
            if content.startswith("```json"):
                # Extract just the JSON part
                json_content = content.split("```json", 1)[1].split("```", 1)[0].strip()
                return json.loads(json_content)  # type: ignore
            elif "```" in content:
                # Try to extract any code block
                json_content = content.split("```", 2)[1]
                if json_content.startswith("json"):
                    json_content = json_content[4:].strip()
                return json.loads(json_content)  # type: ignore
        except Exception:
            pass  # If cleanup attempt fails, continue with original error
        
        raise  # Re-raise the original exception if cleanup failed

def convert_to_datastore_entity(key: Key, data: dict) -> dict:
    """Convert Python dict to raw Datastore JSON repr using Value.to_repr"""
    from gcloud.aio.datastore import Value
    def convert(v):
        # Nested dict -> entityValue
        if isinstance(v, dict):
            props = {k: convert(val) for k, val in v.items()}
            return {'entityValue': {'properties': props}, 'excludeFromIndexes': True}
        # List -> arrayValue
        if isinstance(v, list):
            vals = [convert(item) for item in v]
            return {'arrayValue': {'values': vals}}
        # Primitive or supported type
        return Value(v).to_repr()
    # Build and return JSON-ready properties
    return {k: convert(v) for k, v in data.items()}

@retry(
    retry=retry_if_exception(lambda e: isinstance(e, ClientResponseError) and e.status == 409),
    wait=wait_random_exponential(min=1, max=3),
    stop=stop_after_attempt(5)
)
async def update_datastore_document_v2_missing_merge(collection: str, document_id: str, body: dict) -> None:
    print(f"Updating document {document_id} in collection {collection} with body: {body}")
    try:
        async with Datastore(project_id) as ds:
            # Create a key for the document to update
            key = Key(project_id, [PathElement(kind=collection, name=document_id)])
            
            # Begin a transaction
            txn = await ds.beginTransaction()
            
            try:
                # Convert body to raw Datastore property representations
                props = convert_to_datastore_entity(key, body)
                # Build entity representation for upsert
                entity_repr = {
                    'key': key.to_repr(),
                    'properties': props
                }
                mutation = {'upsert': entity_repr}
                # Commit the transaction with manual mutation
                await ds.commit([mutation], transaction=txn)
                print(f"Successfully updated document {document_id} in collection {collection}")
                
            except Exception as e:
                await ds.rollback(txn)
                raise e
                
    except Exception as e:
        print(f"Error updating document {document_id} in collection {collection}: {str(e)}")
        raise e


@retry(
    retry=retry_if_exception(lambda e: isinstance(e, ClientResponseError) and e.status == 409),
    wait=wait_random_exponential(min=1, max=3),
    stop=stop_after_attempt(5)
)
async def update_datastore_document(collection: str, document_id: str, body: dict) -> None:
    """
    Updates a document in Datastore asynchronously using transactions.
    
    Args:
        collection: The collection name
        document_id: The document ID to update
        body: The document body/content to update with
    
    Returns:
        None
    """
    try:
        print(f"Updating document {document_id} in collection {collection} with body: {body}")
        async with Datastore(project_id) as ds:
            
            # Create a key for the document to update
            key = Key(project_id, [PathElement(kind=collection, name=document_id)])
            
            # Begin a transaction
            txn = await ds.beginTransaction()
            
            try:
                # Check if the document exists
                lookup_result = await ds.lookup([key], transaction=txn)

                # print(f"Lookup result for {document_id} in {collection}: {lookup_result}")

                properties = {}
                # Handle the lookup result properly - lookup_result is a dictionary
                # print(f"lookup_result is dict: {isinstance(lookup_result, dict)}")
                # print(f"lookup_result has 'found' key: {'found' in lookup_result}")
                if isinstance(lookup_result, dict) and 'found' in lookup_result and lookup_result['found']:
                    # print("Found entities, processing first one...")
                    # Get the first found entity
                    entity_result = lookup_result['found'][0]
                    # print(f"entity_result: {entity_result}")
                    # print(f"entity_result type: {type(entity_result)}")
                    # print(f"entity_result is dict: {isinstance(entity_result, dict)}")
                    
                    # Handle both dictionary and object cases
                    if isinstance(entity_result, dict) and 'entity' in entity_result:
                        entity = entity_result['entity']
                    elif hasattr(entity_result, 'entity'):
                        entity = entity_result.entity
                    else:
                        # print("Could not find entity in entity_result")
                        entity = None
                    
                    if entity:
                        # print(f"entity: {entity}")
                        # print(f"entity type: {type(entity)}")
                        # print(f"entity is dict: {isinstance(entity, dict)}")
                        
                        # Handle both dictionary and object cases for entity
                        if isinstance(entity, dict) and 'properties' in entity and entity['properties']:
                            entity_properties = entity['properties']
                        elif hasattr(entity, 'properties') and entity.properties:
                            entity_properties = entity.properties
                        else:
                            # print("Could not find properties in entity")
                            entity_properties = None
                        
                        if entity_properties:
                            # print(f"Entity has {len(entity_properties)} properties")
                            # Extract values from Datastore format and convert to plain Python objects
                            for prop_key, prop_value in entity_properties.items():
                                # Handle different Datastore value types
                                # print(f"Processing property {prop_key} with value {prop_value}")
                                # print(f"prop_value type: {type(prop_value)}")
                                
                                # Convert Datastore format back to plain Python objects
                                def convert_datastore_to_python(ds_value):
                                    """Convert Datastore format back to plain Python objects"""
                                    # Handle gcloud.aio.datastore Entity objects
                                    if hasattr(ds_value, '__class__') and 'Entity' in str(ds_value.__class__):
                                        # This is a gcloud.aio.datastore Entity object
                                        result = {}
                                        # Try to get properties from the Entity object
                                        if hasattr(ds_value, 'properties') and ds_value.properties:
                                            for k, v in ds_value.properties.items():
                                                result[k] = convert_datastore_to_python(v)
                                        # Also try direct attribute access (Entity objects can be accessed like dicts)
                                        elif hasattr(ds_value, '__dict__'):
                                            for k, v in ds_value.__dict__.items():
                                                if not k.startswith('_'):  # Skip private attributes
                                                    result[k] = convert_datastore_to_python(v)
                                        # Try to iterate over the Entity like a dictionary
                                        else:
                                            try:
                                                for k in ds_value:
                                                    result[k] = convert_datastore_to_python(ds_value[k])
                                            except (TypeError, AttributeError):
                                                # If we can't iterate, just return the object as-is
                                                return ds_value
                                        return result
                                    
                                    if isinstance(ds_value, dict):
                                        if 'entityValue' in ds_value and 'properties' in ds_value['entityValue']:
                                            # Nested entity - recursively convert
                                            result = {}
                                            for k, v in ds_value['entityValue']['properties'].items():
                                                result[k] = convert_datastore_to_python(v)
                                            return result
                                        elif 'arrayValue' in ds_value and 'values' in ds_value['arrayValue']:
                                            # Array - convert each item
                                            result = []
                                            for item in ds_value['arrayValue']['values']:
                                                result.append(convert_datastore_to_python(item))
                                            return result
                                        elif 'stringValue' in ds_value:
                                            return ds_value['stringValue']
                                        elif 'integerValue' in ds_value:
                                            return int(ds_value['integerValue'])
                                        elif 'doubleValue' in ds_value:
                                            return float(ds_value['doubleValue'])
                                        elif 'booleanValue' in ds_value:
                                            return ds_value['booleanValue']
                                        elif 'nullValue' in ds_value:
                                            return None
                                    
                                    # If it's already a plain Python object (from gcloud.aio.datastore auto-conversion)
                                    return ds_value
                                
                                # Convert the property value from Datastore format to Python
                                converted_value = convert_datastore_to_python(prop_value)
                                properties[prop_key] = converted_value
                                
                # print(f"Extracted properties for {document_id}: {properties}")

                # Convert body to proper format and merge with existing properties
                def deep_merge_dicts(existing, new):
                    """Recursively merge two dictionaries, with new values taking precedence"""
                    print(f"  deep_merge_dicts called - existing: {existing}, new: {new}")
                    if not isinstance(existing, dict) or not isinstance(new, dict):
                        print(f"  One of the values is not a dict, returning new: {new}")
                        return new
                    
                    result = existing.copy()
                    for key, value in new.items():
                        print(f"  Processing merge key '{key}' - existing: {result.get(key)}, new: {value}")
                        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                            print(f"  Recursively merging nested dictionaries for key '{key}'")
                            # Recursively merge nested dictionaries
                            result[key] = deep_merge_dicts(result[key], value)
                        else:
                            print(f"  Overwriting/adding key '{key}' with value: {value}")
                            # Overwrite or add new key
                            result[key] = value
                    print(f"  deep_merge_dicts returning: {result}")
                    return result
                
                # Debug: Print existing properties before merge
                print(f"Existing properties before merge: {json.dumps(properties, indent=2)}")
                
                # Debug: Print new body
                print(f"New body to merge: {json.dumps(body, indent=2)}")
                
                # Merge new data with existing properties
                for k, v in body.items():
                    print(f"Merging key '{k}' - existing type: {type(properties.get(k))}, new type: {type(v)}")
                    if k in properties and isinstance(properties[k], dict) and isinstance(v, dict):
                        print(f"Deep merging dictionaries for key '{k}'")
                        # Deep merge nested dictionaries (like questions with page numbers)
                        properties[k] = deep_merge_dicts(properties[k], v)
                        print(f"Result after deep merge for '{k}': {properties[k]}")
                    else:
                        print(f"Direct assignment for key '{k}': {v}")
                        # Direct assignment for new keys or non-dict values
                        properties[k] = v
                
                # Debug: Print final properties after merge
                print(f"Final properties after merge: {json.dumps(properties, indent=2)}")
                
                # Create updated entity - convert properties to proper Datastore format
                # print(f"Creating entity with key: {key}")
                # print(f"Key type: {type(key)}")
                # print(f"Creating entity with raw properties: {list(properties.keys())}")
                # print(f"Properties content: {properties}")
                
                # Convert properties to Datastore format for Entity constructor
                datastore_properties = {}
                for prop_key, prop_value in properties.items():
                    # print(f"Converting property {prop_key} with value {prop_value} (type: {type(prop_value)})")
                    try:
                        # Convert to Datastore format using Value
                        # For complex nested dictionaries, keep as nested structure
                        if isinstance(prop_value, dict):
                            print(f"Processing dict property '{prop_key}' with {len(prop_value)} items: {prop_value}")
                            # Handle empty dictionaries specially to preserve them as empty objects
                            if len(prop_value) == 0:
                                print(f"Found empty dictionary for property '{prop_key}' - creating empty entityValue")
                                # For empty dictionaries at the top level, create an empty entityValue
                                datastore_properties[prop_key] = {
                                    'entityValue': {
                                        'properties': {}
                                    },
                                    'excludeFromIndexes': True
                                }
                                print(f"Created empty entityValue for '{prop_key}': {datastore_properties[prop_key]}")
                            else:
                                print(f"Processing non-empty dictionary for property '{prop_key}'")
                                # Recursively convert nested dictionary to Datastore format
                                def convert_dict_to_datastore(d):
                                    print(f"  convert_dict_to_datastore called with: {d}")
                                    result = {}
                                    for k, v in d.items():
                                        print(f"  Processing nested key '{k}' with value: {v} (type: {type(v)})")
                                        if isinstance(v, dict):
                                            # Handle empty dictionaries specially to preserve them as empty objects
                                            if len(v) == 0:
                                                print(f"  Found empty nested dictionary for key '{k}' - creating empty entityValue")
                                                # For empty dictionaries, create an empty entityValue
                                                result[k] = {
                                                    'entityValue': {
                                                        'properties': {}
                                                    },
                                                    'excludeFromIndexes': True
                                                }
                                                print(f"  Created empty entityValue for nested key '{k}': {result[k]}")
                                            else:
                                                print(f"  Recursively processing non-empty dictionary for key '{k}'")
                                                # Nested dictionary - recursively convert
                                                nested_dict = convert_dict_to_datastore(v)
                                                # Create an entity-like structure for nested objects
                                                result[k] = {
                                                    'entityValue': {
                                                        'properties': nested_dict
                                                    },
                                                    'excludeFromIndexes': True
                                                }
                                                print(f"  Created entityValue for nested key '{k}': {result[k]}")
                                        elif isinstance(v, list):
                                            print(f"  Processing list for key '{k}' with {len(v)} items")
                                            # Handle arrays
                                            array_values = []
                                            for item in v:
                                                if isinstance(item, dict):
                                                    print(f"    Processing dict item in array: {item}")
                                                    # Array of objects
                                                    nested_dict = convert_dict_to_datastore(item)
                                                    array_values.append({
                                                        'entityValue': {
                                                            'properties': nested_dict
                                                        }
                                                        # Note: No excludeFromIndexes on array items - only on individual properties
                                                    })
                                                else:
                                                    print(f"    Processing primitive item in array: {item}")
                                                    # Array of primitives
                                                    val_obj = Value(item)
                                                    val_repr = val_obj.to_repr()
                                                    # Mark large text fields as non-indexed
                                                    if isinstance(item, str) and len(item.encode('utf-8')) > 1500:
                                                        val_repr['excludeFromIndexes'] = True
                                                    array_values.append(val_repr)
                                            result[k] = {
                                                'arrayValue': {
                                                    'values': array_values
                                                }
                                                # Note: No excludeFromIndexes on array containers
                                            }
                                            print(f"  Created arrayValue for key '{k}': {result[k]}")
                                        else:
                                            print(f"  Processing primitive value for key '{k}': {v}")
                                            # Primitive value
                                            val_obj = Value(v)
                                            val_repr = val_obj.to_repr()
                                            # Mark large text fields as non-indexed
                                            if isinstance(v, str) and len(v.encode('utf-8')) > 1500:
                                                val_repr['excludeFromIndexes'] = True
                                            result[k] = val_repr
                                            print(f"  Created primitive value for key '{k}': {result[k]}")
                                    print(f"  convert_dict_to_datastore returning: {result}")
                                    return result
                                
                                datastore_properties[prop_key] = {
                                    'entityValue': {
                                        'properties': convert_dict_to_datastore(prop_value)
                                    },
                                    'excludeFromIndexes': True
                                }
                                print(f"Final datastore property for '{prop_key}': {datastore_properties[prop_key]}")
                                # print(f"Converted nested dict for property {prop_key} to Datastore map structure")
                        else:
                            # Check if string is too large for indexing (1500 bytes limit)
                            if isinstance(prop_value, str) and len(prop_value.encode('utf-8')) > 1500:
                                value_obj = Value(prop_value, exclude_from_indexes=True)
                                value_repr = value_obj.to_repr()
                                # Double-check and force the excludeFromIndexes flag
                                if 'excludeFromIndexes' in value_repr:
                                    value_repr['excludeFromIndexes'] = True
                                datastore_properties[prop_key] = value_repr
                                # print(f"Large string property {prop_key} marked as exclude_from_indexes=True")
                            else:
                                value_obj = Value(prop_value)
                                datastore_properties[prop_key] = value_obj.to_repr()
                        
                        # print(f"Successfully converted property {prop_key}")
                    except Exception as conversion_error:
                        print(f"Error converting property {prop_key}: {conversion_error}")
                        raise conversion_error
                
                try:
                    # Instead of using Entity constructor, manually build the entity representation
                    # to preserve excludeFromIndexes settings
                    entity_repr = {
                        'key': key.to_repr(),
                        'properties': datastore_properties
                    }
                    # print(f"Successfully created entity representation: {entity_repr}")
                    
                    # Create mutation for upsert operation directly with the manual representation
                    mutation = {
                        'upsert': entity_repr
                    }
                    
                    # Commit the transaction with the updated entity
                    # print("Attempting to commit transaction...")
                    await ds.commit([mutation], transaction=txn)
                    # print("Successfully committed transaction")
                    
                except Exception as commit_error:
                    print(f"Error during commit: {commit_error}")
                    print(f"Error type: {type(commit_error)}")
                    raise commit_error
                
                # print(f"Successfully updated document {document_id} in collection {collection}")
                return True
                
            except Exception as e:
                # Roll back the transaction on error
                await ds.rollback(txn)
                raise e
            
    except Exception as e:
        print(f"Error updating document {document_id} in collection {collection}: {str(e)}")
        return False
    finally:
        # Don't release the datastore client here - let it be managed globally
        pass


async def process_image(image_link, file_name, page_number,exam_name) -> dict:
    result = await process_image_gpt(image_link, file_name)

    questions = result["questions"]  # List[Question]
    
    # make an object with question number as keys and the rest as values
    questions_results = {
        question["questionNumber"]: {
            "question": question["question"],
            "questionNumber": question["questionNumber"],
            "supplementalContent": question.get("supplementalContent", ""),
            "questionType": question["questionType"],
            "responses": question.get("responses", None),
            "correctResponses": question.get("correctResponses", None),
            "imgCount": question.get("imgCount", 0)
        } for question in questions
    }
    
    body = {
        "pages": {
            str(page_number): questions_results
        }
    }
    print(f"Body being sent to datastore for page {page_number}: {json.dumps(body, indent=2)}")
    
    await update_datastore_document(
        collection=result_collection,
        document_id=exam_name,
        body=body
    )
    return result

# Helper function for the async processing with proper error handling
async def process_with_timeout(file_link, file_name, page_number,exam_name, timeout=300):
    try:
        return await asyncio.wait_for(process_image(file_link, file_name, page_number,exam_name), timeout=timeout)
    except asyncio.TimeoutError:
        print(f"Processing timed out for {file_name}, page {page_number}")
        return None
    except Exception as e:
        print(f"Error processing {file_name}, page {page_number}: {str(e)}")
        return None

@storage_fn.on_object_finalized(bucket="estudaqui-pdf-images")
def process_image_upload(event: storage_fn.CloudEvent) -> None:
    """
    Triggers when a new file is uploaded to the estudaqui-pdf-images bucket.
    Processes the image through the OpenAI pipeline and stores the results.
    
    Args:
        event: The Cloud Storage event
    """
    print(f"Received event: {event.data}")
    bucket_name = event.data.bucket
    file_path = event.data.name
    file_name = file_path.split("/")[-1] if file_path else "unknown"
    file_name = file_name.split("_")[1]
    if bucket_name != "estudaqui-pdf-images":
        print(f"Ignoring file upload in bucket: {bucket_name}")
        return
    
    # encode the file path to be URL safe
    file_path = file_path.replace("/", "%2F")

    # Extract exam name from path: pdf%2F<exam_name>%2Fimages%2F...
    exam_name = "unknown"
    if "pdf%2F" in file_path and "%2Fimages%2F" in file_path:
        try:
            # Find the exam name between pdf%2F and %2Fimages%2F
            start_marker = "pdf%2F"
            end_marker = "%2Fimages%2F"
            start_idx = file_path.find(start_marker) + len(start_marker)
            end_idx = file_path.find(end_marker)
            if start_idx > len(start_marker) - 1 and end_idx > start_idx:
                exam_name = file_path[start_idx:end_idx]
                print(f"Extracted exam name: {exam_name}")
        except Exception as e:
            print(f"Error extracting exam name from path {file_path}: {e}")

    # get the link for the file
    file_link = f"https://firebasestorage.googleapis.com/v0/b/{bucket_name}/o/{file_path}?alt=media"

    print(f"Using URL: {file_link}")
    page_number = file_path.split("_")[-1].split(".")[0] if "_" in file_path else "unknown"
    if not page_number.isdigit():
        print(f"Invalid page number in file path: {file_path}")
        return
    print(f"Processing new file: {file_path} in bucket: {bucket_name} (page {page_number})")
    
    try:
        # Use the existing event loop instead of creating a new one
        # Cloud Functions already runs within an event loop context
        result = asyncio.run(process_with_timeout(file_link, file_name, page_number,exam_name, timeout=150))
        
        if result:
            print(f"Successfully processed file {file_path}, page {page_number}")
        else:
            print(f"Failed to process file {file_path}, page {page_number}")
            
    except Exception as e:
        print(f"Critical error processing file {file_path}: {str(e)}")




