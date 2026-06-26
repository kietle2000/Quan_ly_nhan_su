const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    
    console.log(`Testing gemini-embedding-001 with outputDimensionality: 768`);
    // Pass outputDimensionality to getGenerativeModel? Actually, it's not in the ModelParams signature for older SDKs, maybe it's in the SDK v0.24.1. Let's try passing it inside the model config:
    // Some docs say we should pass it to getGenerativeModel or directly to embedContent?
    // Let's test passing it to getGenerativeModel.
    // However, if the SDK doesn't support it, we can just tell the user to recreate the Pinecone index with 3072 dimensions! That is much easier and safer!
    
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    // wait, I also want to test 'text-embedding-004' again just in case it works with something else.
  } catch(e) {}
}

test();
