"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImageUpload = void 0;
const storage_1 = require("firebase-functions/v2/storage");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const openai_1 = __importDefault(require("openai"));
admin.initializeApp();
//admin.initializeApp()
// Initialize Firestore
const db = admin.firestore();
// Configuration
const MAX_RETRIES = 6;
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000, 32000]; // Exponential backoff in ms
const RESULT_COLLECTION = process.env.RESULT_COLLECTION || 'test';
const openAIKey = (0, params_1.defineSecret)('OPENAI_API_KEY');
let openai;
const systemPrompt = `
You are a professional exam parser.

Your task is to extract all questions from the **provided document only**. Do not use any external knowledge or make assumptions beyond the content shown.  
Return the results in **strict, valid JSON** with the following structure (no comments, no trailing commas):

\`{  "questions":  [  {  "questionNumber":  "string",  "question":  "string",  "supplementalContent":  "string",  "questionType":  "openEnded" | "multipleChoice" | "prompt" | "other",  "responses":  ["string", ...] | null,  "correctResponses":  ["string", ...] | null,  "imgCount": number }  ]  }\` 

### Rules:

1.  Use **only** the content from the input document. **Do not infer, invent, or supplement** information.
    
2.  For each question:
    
    -   Set the \`questionNumber\` field to the **exact question number or identifier** as shown (e.g., "1", "Q1", "Pergunta 3", etc.).
    -   Set the \`question\` field to the **exact question text** as written.
    -   Set the \`supplementalContent\` field to include **all directly attached content necessary to understand the question**, such as:
        -   Code snippets
        -   Text excerpts
        -   Definitions
        -   Instructions
            
    -   **Do not reference external content** (e.g., do not write "Leia o excerto..."). If an excerpt or context is present, copy it in full.
    -   Set \`imgCount\` to the number of images directly attached to the question, or 0 if none are present.
        
3.  Set \`questionType\` as follows:
    -   \`"openEnded"\`: requires a free-text response
    -   \`"multipleChoice"\`: includes predefined options
    -   \`"prompt"\`: **not a question** but a context or instruction block, typically to introduce a group of questions or content (e.g., diagrams, figures, setups). It is not meant to be answered.
    -   \`"other"\`: any other format
        
4.  Set \`responses\` to:
    -   An array of response options (in exact order and formatting)
    -   Otherwise \`null\` if none are present
        
5.  Set \`correctResponses\` to:
    -   An array of correct answers, **only if clearly marked** in the document
    -   Otherwise, set to \`null\`
        
6.  **Escape all necessary characters** to ensure valid JSON (e.g., quotes, newlines).
7.  **Preserve original wording, formatting, and order** exactly as shown in the document.
8.  **Do not include explanations, commentary, or any output other than the JSON.**

### Formatting Rules:

-   Use \`$...$\` for inline mathematical expressions.
-   Use \`$$...$$\` or \`\\[\\]\` for block mathematical expressions.
-   Do not use \`\\\\[...\\\\]\` or any other math delimiters.
-   Do not include images, HTML, or unsupported Markdown features.

### Output:

Return **only the JSON object** as described above. Do not include any other text, commentary, or formatting (such as code fences).
`;
// Initialize OpenAI client
// Utility function for exponential backoff
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
// Random jitter for retry delays
const getRandomDelay = (baseDelay) => {
    return baseDelay + Math.random() * 500;
};
// Retry wrapper with exponential backoff
async function withRetry(operation, maxRetries = MAX_RETRIES, operationName = 'operation') {
    var _a, _b, _c;
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            // Check if we should retry
            const shouldRetry = error.status === 429 || // Rate limit
                error.status === 500 ||
                error.status === 502 ||
                error.status === 503 ||
                error.status === 504 ||
                error.code === 'ECONNRESET' ||
                error.code === 'ETIMEDOUT' ||
                ((_a = error.message) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes('connection')) ||
                ((_b = error.message) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes('timeout')) ||
                ((_c = error.message) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes('network'));
            if (!shouldRetry || attempt === maxRetries) {
                console.error(`${operationName} failed after ${attempt + 1} attempts:`, error);
                throw error;
            }
            const delay = getRandomDelay(RETRY_DELAYS[Math.min(attempt, RETRY_DELAYS.length - 1)]);
            console.warn(`${operationName} attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
            await sleep(delay);
        }
    }
    throw lastError;
}
// OpenAI API call with retry logic
async function processImageGPT(imageLink, fileName, model = 'gpt-4.1-mini') {
    const startTime = Date.now();
    if (!openai) {
        openai = new openai_1.default({ apiKey: openAIKey.value() });
    }
    const response = await withRetry(async () => {
        return await openai.responses.create({
            model,
            input: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "input_image",
                            image_url: imageLink,
                            detail: 'high'
                        },
                    ],
                }
            ],
            temperature: 0.15,
        });
    }, MAX_RETRIES, 'OpenAI API call');
    const endTime = Date.now();
    console.log(`OpenAI API call for file ${fileName} took ${endTime - startTime}ms`);
    // Extract content from response
    let content = response.output_text;
    if (!content) {
        throw new Error('No content received from OpenAI');
    }
    // Handle content if it's already a parsed object
    if (typeof content === 'object' && content !== null) {
        return content;
    }
    if (typeof content !== 'string') {
        throw new Error('Received content of unexpected type');
    }
    // Validate JSON format
    try {
        const contentJson = JSON.parse(content);
        return contentJson;
    }
    catch (error) {
        console.error(`Error decoding JSON for file ${fileName}:`, error);
        console.error(`Raw content: ${content}`);
        // Try to clean up common JSON formatting issues
        try {
            let cleanContent = content;
            // Remove markdown code blocks
            if (cleanContent.includes('```json')) {
                const jsonMatch = cleanContent.match(/```json\s*\n?(.*?)\n?```/s);
                if (jsonMatch) {
                    cleanContent = jsonMatch[1].trim();
                }
            }
            else if (cleanContent.includes('```')) {
                const codeMatch = cleanContent.match(/```[^\\n]*\n?(.*?)\n?```/s);
                if (codeMatch) {
                    cleanContent = codeMatch[1].trim();
                }
            }
            return JSON.parse(cleanContent);
        }
        catch (cleanupError) {
            console.error('Failed to clean up JSON content:', cleanupError);
            throw error; // Re-throw the original error
        }
    }
}
// Deep merge function for nested objects
function deepMerge(existing, newData) {
    if (!existing || typeof existing !== 'object' || !newData || typeof newData !== 'object') {
        return newData;
    }
    if (Array.isArray(existing) || Array.isArray(newData)) {
        return newData;
    }
    const result = { ...existing };
    for (const [key, value] of Object.entries(newData)) {
        if (key in result && typeof result[key] === 'object' && typeof value === 'object' &&
            !Array.isArray(result[key]) && !Array.isArray(value)) {
            result[key] = deepMerge(result[key], value);
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
// Update Firestore document with retry logic
async function updateFirestoreDocument(collection, documentId, body) {
    await withRetry(async () => {
        const docRef = db.collection(collection).doc(documentId);
        // Use a transaction to ensure atomic updates
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef);
            let mergedData;
            if (doc.exists) {
                // Deep merge with existing data
                console.log(`Merging with existing document ${documentId}`);
                const existingData = doc.data() || {};
                mergedData = deepMerge(existingData, body);
            }
            else {
                // New document
                console.log(`Creating new document ${documentId}`);
                mergedData = body;
            }
            // Update the document
            transaction.set(docRef, mergedData, { merge: true });
        });
        console.log(`Successfully updated document ${documentId} in collection ${collection}`);
    }, 5, // Fewer retries for Firestore operations
    `Firestore update for ${documentId}`);
}
// Main processing function
async function processImage(imageLink, fileName, pageNumber, examName, metadata) {
    try {
        const result = await processImageGPT(imageLink, fileName);
        console.log(JSON.stringify(result, null, 2));
        const questions = result.questions;
        // Create questions object with question number as keys
        const questionsResults = {};
        const figureCount = (metadata === null || metadata === void 0 ? void 0 : metadata.figureCount) || 0;
        for (const question of questions) {
            questionsResults[question.questionNumber] = {
                question: question.question,
                questionNumber: question.questionNumber,
                supplementalContent: question.supplementalContent || '',
                questionType: question.questionType,
                responses: question.responses || null,
                correctResponses: question.correctResponses || null,
                imgCount: question.imgCount || 0,
            };
        }
        const body = {
            pages: {
                [pageNumber]: { ...questionsResults, "figureCount": figureCount }
            }
        };
        console.log(`Body being sent to Firestore for page ${pageNumber}:`, JSON.stringify(body, null, 2));
        await updateFirestoreDocument(RESULT_COLLECTION, examName, body);
        return result;
    }
    catch (error) {
        console.error(`Error processing image ${fileName}, page ${pageNumber}:`, error);
        throw error;
    }
}
// Process with timeout wrapper
async function processWithTimeout(fileLink, fileName, pageNumber, examName, metadata, timeoutMs = 150000) {
    return new Promise(async (resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error(`Processing timed out for ${fileName}, page ${pageNumber}`));
        }, timeoutMs);
        try {
            const result = await processImage(fileLink, fileName, pageNumber, examName, metadata);
            clearTimeout(timeoutId);
            resolve(result);
        }
        catch (error) {
            clearTimeout(timeoutId);
            console.error(`Error processing ${fileName}, page ${pageNumber}:`, error);
            resolve(null); // Return null instead of rejecting to allow graceful handling
        }
    });
}
// Firebase Cloud Function
exports.processImageUpload = (0, storage_1.onObjectFinalized)({
    bucket: 'estudaqui-pdf-images',
    region: 'us-west1',
    secrets: [openAIKey],
    timeoutSeconds: 540,
    memory: '1GiB',
    maxInstances: 20,
}, async (event) => {
    var _a;
    const bucketName = event.data.bucket;
    const filePath = event.data.name;
    if (!filePath) {
        console.log('No file path in event');
        return null;
    }
    const fileName = ((_a = filePath.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('_')[1]) || 'unknown';
    if (bucketName !== 'estudaqui-pdf-images') {
        console.log(`Ignoring file upload in bucket: ${bucketName}`);
        return null;
    }
    // URL encode the file path
    const encodedFilePath = filePath.replace(/\//g, '%2F');
    // Extract exam name from path: pdf%2F<exam_name>%2Fimages%2F...
    let examName = 'unknown';
    if (encodedFilePath.includes('pdf%2F') && encodedFilePath.includes('%2Fimages%2F')) {
        try {
            const startMarker = 'pdf%2F';
            const endMarker = '%2Fimages%2F';
            const startIdx = encodedFilePath.indexOf(startMarker) + startMarker.length;
            const endIdx = encodedFilePath.indexOf(endMarker);
            if (startIdx > startMarker.length - 1 && endIdx > startIdx) {
                examName = encodedFilePath.substring(startIdx, endIdx);
            }
        }
        catch (error) {
            console.error(`Error extracting exam name from path ${encodedFilePath}:`, error);
        }
    }
    // Generate the file link
    const fileLink = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedFilePath}?alt=media`;
    console.log(`Using URL: ${fileLink}`);
    const fileMetadata = await admin.storage().bucket(bucketName).file(filePath).getMetadata();
    if (!fileMetadata || !fileMetadata[0]) {
        console.error(`No metadata found for file ${filePath}`);
        return null;
    }
    const metadata = fileMetadata[0].metadata;
    console.log(`File metadata for ${filePath}:`, metadata);
    // Extract page number
    const pageNumberMatch = filePath.match(/_(\d+)\./);
    const pageNumber = pageNumberMatch ? pageNumberMatch[1] : 'unknown';
    if (!pageNumberMatch || !pageNumber || !pageNumber.match(/^\d+$/)) {
        console.error(`Invalid page number in file path: ${filePath}`);
        return null;
    }
    console.log(`Processing new file: ${filePath} in bucket: ${bucketName} (page ${pageNumber})`);
    try {
        const result = await processWithTimeout(fileLink, fileName, pageNumber, examName, metadata, 150000);
        if (result) {
            console.log(`Successfully processed file ${filePath}, page ${pageNumber}`);
            return { success: true, questionsFound: result.questions.length };
        }
        else {
            console.error(`Failed to process file ${filePath}, page ${pageNumber}`);
            return { success: false, error: 'Processing failed or timed out' };
        }
    }
    catch (error) {
        console.error(`Critical error processing file ${filePath}:`, error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
});
/*

//try locally
if (require.main === module) {
  

  console.log('Running local test for processImageUpload function...');
  // Test the function locally
  const testEvent: StorageEvent = {
    data: {
      bucket: 'estudaqui-pdf-images',
      name: 'pdf/ex/images/page_1.jpg',
    },
  } as any; // Cast to StorageEvent for local testing
  
  processImageUpload(testEvent).then((result: any) => {
    console.log('Test result:', result);
  }).catch((error: any) => {
    console.error('Test error:', error);
  });
}
*/ 
//# sourceMappingURL=index.js.map