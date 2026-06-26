const { Pinecone } = require('@pinecone-database/pinecone');

async function test() {
  try {
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pc.Index(process.env.PINECONE_INDEX_NAME);
    
    console.log("Upserting 1 vector...");
    const vectors = [{
      id: "test-id-1",
      values: new Array(3072).fill(0.1),
      metadata: { text: "hello" }
    }];
    
    await index.upsert(vectors);
    console.log("Upsert successful!");
    
    console.log("Upserting empty array...");
    try {
      await index.upsert([]);
    } catch (e) {
      console.error("Empty array error:", e.message);
    }
  } catch (e) {
    console.error("Global error:", e.message);
  }
}

test();
