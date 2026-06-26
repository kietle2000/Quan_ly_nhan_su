const { Pinecone } = require('@pinecone-database/pinecone');

async function test() {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pc.Index(process.env.PINECONE_INDEX_NAME);
  
  const v = { id: "test", values: new Array(3072).fill(0.1) };
  
  try {
    console.log("Trying array...");
    await index.upsert([v]);
    console.log("Array succeeded!");
    return;
  } catch(e) { console.error("Array failed:", e.message); }

  try {
    console.log("Trying { records: [...] }...");
    await index.upsert({ records: [v] });
    console.log("{ records } succeeded!");
    return;
  } catch(e) { console.error("{ records } failed:", e.message); }

  try {
    console.log("Trying { vectors: [...] }...");
    await index.upsert({ vectors: [v] });
    console.log("{ vectors } succeeded!");
    return;
  } catch(e) { console.error("{ vectors } failed:", e.message); }

  try {
    console.log("Trying ...vectors...");
    await index.upsert(v);
    console.log("...vectors succeeded!");
    return;
  } catch(e) { console.error("...vectors failed:", e.message); }

}

test();
