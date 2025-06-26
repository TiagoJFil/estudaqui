import { onObjectFinalized, StorageEvent } from 'firebase-functions/v2/storage';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';

admin.initializeApp();

//admin.initializeApp()
// Initialize Firestore
const db = admin.firestore();

// Types
interface Question {
  questionNumber: string;
  question: string;
  supplementalContent: string;
  questionType: 'openEnded' | 'multipleChoice' | 'prompt' | 'other';
  responses: string[] | null;
  correctResponses: string[] | null;
  imgCount: number;
}

interface ProcessImageResult {
  questions: Question[];
}

interface QuestionResult {
  question: string;
  questionNumber: string;
  supplementalContent: string;
  questionType: string;
  responses: string[] | null;
  correctResponses: string[] | null;
  imgCount: number;
}

// Configuration
const MAX_RETRIES = 6;
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000, 32000]; // Exponential backoff in ms
const RESULT_COLLECTION = process.env.RESULT_COLLECTION || 'test';
const openAIKey = defineSecret('OPENAI_API_KEY');
let openai: OpenAI;





  const systemPrompt = `
You are a professional exam parser.

Extract all questions from the **input document only. Do not use outside knowledge or make assumptions.**  
Return valid JSON (no comments, no trailing commas) in this format:

\`{  "questions":  [  {  "questionNumber":  "string",  "question":  "string",  "supplementalContent":  "string",  "questionType":  "openEnded" | "multipleChoice" | "prompt" | "other",  "responses":  ["string", ...] | null,  "correctResponses":  ["string", ...] | null,  "imgCount": number }  ]  }\` 

### Rules:

1.  Use **only** what’s shown. Don’t guess, infer, or supplement.
    
2.  For each question, set:
    -   \`questionNumber\` field to the **exact question number or identifier** as shown (e.g., "1", "Q1", "Pergunta 3", etc.).
    -   \`question\` field to the **exact question text** as written.
    -   \`supplementalContent\` directly attached content like code, excerpts, or definitions. Leave empty if none.
    -   \`imgCount\` number of images directly tied to the question (or\`0\`)
3.  Set \`questionType\`:
    -   \`"openEnded"\`: free-text answer required
    -   \`"multipleChoice"\`: predefined answer options
    -   \`"prompt"\` context block not meant to be answered
    -   \`"other"\`: any other format
4.  Set \`responses\` to:
    -   Array of options, if present
    -   \`null\` if not
5.  Set \`correctResponses\` to:
    -   Only if clearly marked
    -   Otherwise,\`null\`
6.  **Escape characters** to ensure valid JSON (\`\n\`, \`\"\`,etc.).
7.  Preserve exact wording and order.
8.  Output **only** the JSON — no comments, markdown, or explanations.

### Math Formatting:

-   Use \`$...$\` for inline math.
-   Use \`$$...$$\` or \`\\[\\]\` for block math.
-   Do not use \`\\\\[...\\\\]\` or any other math delimiters.
-   No HTML, images, or unsupported Markdown

### Output:

Return **only the JSON object** as described above. Do not include any other text, commentary, or formatting (such as code fences).
`;

// Initialize OpenAI client

// Utility function for exponential backoff
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Random jitter for retry delays
const getRandomDelay = (baseDelay: number): number => {
  return baseDelay + Math.random() * 500;
};

// Retry wrapper with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  operationName: string = 'operation'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if we should retry
      const shouldRetry = 
        error.status === 429 || // Rate limit
        error.status === 500 || 
        error.status === 502 || 
        error.status === 503 || 
        error.status === 504 || 
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.toLowerCase().includes('connection') ||
        error.message?.toLowerCase().includes('timeout') ||
        error.message?.toLowerCase().includes('network');
      
      if (!shouldRetry || attempt === maxRetries) {
        console.error(`${operationName} failed after ${attempt + 1} attempts:`, error);
        throw error;
      }
      
      const delay = getRandomDelay(RETRY_DELAYS[Math.min(attempt, RETRY_DELAYS.length - 1)]);
      console.warn(`${operationName} attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}
// OpenAI API call with retry logic
async function processImageGPT(
  imageLink: string,
  fileName: string,
  model: string = 'gpt-4.1-mini'
): Promise<ProcessImageResult> {
  const startTime = Date.now();

  if (!openai) {
    openai = new OpenAI({ apiKey: openAIKey.value() });
  }

  const response = await withRetry(
    async () => {
      return await openai.responses.create({
        model,
        input: [
          {
            role: "system",
            content: systemPrompt,
          }
          ,{
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: imageLink,
              detail: 'high' as const
            },
          ],
        }],
        temperature: 0.15,
      });
    },
    MAX_RETRIES,
    'OpenAI API call'
  );
  const endTime = Date.now();
  console.log(`OpenAI API call for file ${fileName} took ${endTime - startTime}ms`);

  // Extract content from response
  let content = response.output_text
  if (!content) {
    throw new Error('No content received from OpenAI');
  }

  // Handle content if it's already a parsed object
  if (typeof content === 'object' && content !== null) {
    return content as ProcessImageResult;
  }

  if (typeof content !== 'string') {
    throw new Error('Received content of unexpected type');
  }

  // Validate JSON format
  try {
    const contentJson: ProcessImageResult = JSON.parse(content);
    return contentJson;
  } catch (error) {
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
      } else if (cleanContent.includes('```')) {
        const codeMatch = cleanContent.match(/```[^\\n]*\n?(.*?)\n?```/s);
        if (codeMatch) {
          cleanContent = codeMatch[1].trim();
        }
      }
      
      return JSON.parse(cleanContent);
    } catch (cleanupError) {
      console.error('Failed to clean up JSON content:', cleanupError);
      throw error; // Re-throw the original error
    }
  }
}



// Update Firestore document with retry logic
async function updateFirestoreDocument(
  collection: string, 
  documentId: string, 
  body: Record<string, any>
): Promise<void> {
  await withRetry(
    async () => {
      const docRef = db.collection(collection).doc(documentId);
      
      // Use set with merge to avoid transaction contention from multiple pages of the same exam being processed at once.
      await docRef.set(body, { merge: true });
      
      console.log(`Successfully updated document ${documentId} in collection ${collection}`);
    },
    5, // Fewer retries for Firestore operations
    `Firestore update for ${documentId}`
  );
}

// Main processing function
async function processImage(
  imageLink: string, 
  fileName: string, 
  pageNumber: string, 
  examName: string,
  metadata: any
): Promise<ProcessImageResult | null> {
  try {
    const result = await processImageGPT(imageLink, fileName);
    console.log(JSON.stringify(result, null, 2));
    const questions = result.questions;
    
    // Create questions object with question number as keys
    const questionsResults: Record<string, QuestionResult> = {};
    const figureCount = metadata?.figureCount || 0;
    
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
        [pageNumber]: {...questionsResults, "figureCount": figureCount}
      }
    };
    
    console.log(`Body being sent to Firestore for page ${pageNumber}:`, JSON.stringify(body, null, 2));
    
    await updateFirestoreDocument(RESULT_COLLECTION, examName, body);
    
    return result;
  } catch (error) {
    console.error(`Error processing image ${fileName}, page ${pageNumber}:`, error);
    throw error;
  }
}

// Process with timeout wrapper
async function processWithTimeout(
  fileLink: string, 
  fileName: string, 
  pageNumber: string, 
  examName: string, 
  metadata : any,
  timeoutMs: number = 150000
): Promise<ProcessImageResult | null> {
  return new Promise(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Processing timed out for ${fileName}, page ${pageNumber}`));
    }, timeoutMs);
    
    try {
      const result = await processImage(fileLink, fileName, pageNumber, examName,metadata);
      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`Error processing ${fileName}, page ${pageNumber}:`, error);
      resolve(null); // Return null instead of rejecting to allow graceful handling
    }
  });
}

// Firebase Cloud Function
export const processImageUpload = onObjectFinalized(
  {
    bucket: 'estudaqui-pdf-images',
    region: 'us-west1',
    secrets: [openAIKey],
    timeoutSeconds: 540,
    memory: '1GiB',
    maxInstances: 20,
    concurrency: 300
  },
  async (event: StorageEvent) => {
    const bucketName = event.data.bucket;
    const filePath = event.data.name;
    
    if (!filePath) {
      console.log('No file path in event');
      return null;
    }
    
    const fileName = filePath.split('/').pop()?.split('_')[1] || 'unknown';
    
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
      } catch (error) {
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
      const result = await processWithTimeout(fileLink, fileName, pageNumber, examName,metadata, 150000);
      
      if (result) {
        console.log(`Successfully processed file ${filePath}, page ${pageNumber}`);
        return { success: true, questionsFound: result.questions.length };
      } else {
        console.error(`Failed to process file ${filePath}, page ${pageNumber}`);
        return { success: false, error: 'Processing failed or timed out' };
      }
    } catch (error) {
      console.error(`Critical error processing file ${filePath}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
);

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