const { getZaloProfile } = require('./src/lib/zalo');

async function test() {
  const profile = await getZaloProfile('12345'); // Need to use real senderId
  console.log(profile);
}
test();
