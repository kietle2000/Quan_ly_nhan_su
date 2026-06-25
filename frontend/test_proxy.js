const https = require('https');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAHiL9n7wG7rSA9DIneQwCfh6lvXKjGofI",
  authDomain: "hrm-nhan-phu.firebaseapp.com",
  projectId: "hrm-nhan-phu",
  storageBucket: "hrm-nhan-phu.appspot.com",
  messagingSenderId: "623974736852",
  appId: "1:623974736852:web:007f7f29b885ccd958ac41",
};

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } 
        catch(e) { resolve({ raw: body }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function test() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  const tokenDoc = await getDoc(doc(db, 'settings', 'zalo_token'));
  if (!tokenDoc.exists()) {
    console.log("NO TOKEN IN FIRESTORE!");
    process.exit(1);
  }
  
  const tokenData = tokenDoc.data();
  const token = tokenData.access_token;
  console.log("Token OK, expires:", new Date(tokenData.expires_at).toISOString());
  console.log("Now:", new Date().toISOString());
  console.log("Expired?", Date.now() > tokenData.expires_at);
  
  const userId = "5476209251506486961";
  
  // Test PHP proxy
  console.log("\n=== TEST PHP PROXY ===");
  const proxyUrl = `https://nhanphuphuyen.edu.vn/zalo_proxy.php?user_id=${userId}&token=${encodeURIComponent(token)}`;
  try {
    const result = await httpsGet(proxyUrl);
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch(e) {
    console.log("ERROR:", e.message);
  }
  
  // Test Zalo directly (IP limitation expected)
  console.log("\n=== TEST ZALO V3 DIRECT ===");
  const dataParam = encodeURIComponent(JSON.stringify({ user_id: userId }));
  const zaloUrl = `https://openapi.zalo.me/v3.0/oa/user/detail?data=${dataParam}`;
  try {
    const result = await httpsGet(zaloUrl, { 'access_token': token });
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch(e) {
    console.log("ERROR:", e.message);
  }
  
  process.exit(0);
}

test().catch(e => { console.error(e); process.exit(1); });
