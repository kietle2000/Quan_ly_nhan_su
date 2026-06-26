const { Pinecone } = require('@pinecone-database/pinecone');

async function test() {
  const pc = new Pinecone({ apiKey: 'dummy' });
  const index = pc.Index('dummy');
  console.log("upsert type:", typeof index.upsert);
  console.log("upsert string:", index.upsert.toString());
}
test();
