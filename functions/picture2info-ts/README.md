# Picture2Info TypeScript

This is the TypeScript version of the picture2info Firebase Cloud Function.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `GOOGLE_CLOUD_PROJECT`: Your Google Cloud project ID (default: estudaqui-f849d)
   - `RESULT_COLLECTION`: Datastore collection name (default: test)

3. Build the project:
```bash
npm run build
```

## Development

- `npm run build`: Build the TypeScript code
- `npm run build:watch`: Build in watch mode
- `npm run serve`: Start the Firebase emulator
- `npm run deploy`: Deploy to Firebase

## Functionality

This function processes images uploaded to the `estudaqui-pdf-images` Firebase Storage bucket. It:

1. Extracts questions from exam images using OpenAI's GPT-4 Vision API
2. Stores the extracted data in Google Cloud Datastore
3. Handles retry logic for API failures
4. Supports exponential backoff for rate limiting

## Migration from Python

This TypeScript version maintains the same functionality as the Python version but with:
- Better type safety
- Native Firebase Functions v2 integration
- Improved error handling
- More efficient async operations
