const { Pinecone } = require('@pinecone-database/pinecone');

async function test() {
  try {
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pc.Index(process.env.PINECONE_INDEX_NAME);
    
    console.log("Upserting 1 vector with values undefined...");
    const vectors = [{
      id: "test-id-1",
      values: undefined,
      metadata: { text: "hello" }
    }];
    
    await index.upsert(vectors);
    console.log("Upsert successful!");
    
  } catch (e) {
    console.error("Global error:", e.message);
  }
}

test();
