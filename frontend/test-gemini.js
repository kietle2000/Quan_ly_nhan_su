const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("No API key");
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const models = [
      'text-embedding-004',
      'embedding-001',
      'gemini-embedding-001'
    ];

    for (const m of models) {
      try {
        console.log(`Testing ${m}...`);
        const model = genAI.getGenerativeModel({ model: m });
        const res = await model.embedContent("Hello world");
        console.log(`Success with ${m}! Dimensions: ${res.embedding.values.length}`);
      } catch (e) {
        console.error(`Failed ${m}:`, e.message);
      }
    }
  } catch (e) {
    console.error("Global error:", e);
  }
}

test();
