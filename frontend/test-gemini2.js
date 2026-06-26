const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    
    console.log(`Testing gemini-embedding-001 with 768 dimensions...`);
    // Pass outputDimensionality to getGenerativeModel
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-embedding-001'
    });
    // Wait, the parameter might be in taskType or something, but let's see if the SDK supports it.
    // In SDK v0.24, it's typically passed in the model config? Or maybe just in the call? Let's try:
    try {
      const modelWithDim = genAI.getGenerativeModel({ model: 'gemini-embedding-001' }, { apiVersion: 'v1beta' });
      // If we pass outputDimensionality? No, wait, let's just create a new Pinecone index if it's 3072.
      // Let's check if we can pass outputDimensionality:
      const model2 = genAI.getGenerativeModel({ model: 'text-embedding-004' });
      // Let's also check if "models/text-embedding-004" works
    } catch(e) {}
  } catch(e) {}
}

test();
