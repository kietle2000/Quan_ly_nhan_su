/**
 * Script cap nhat ten va avatar cho tat ca Zalo User chua co thong tin that
 * Chay: node update_zalo_profiles.js
 */
const https = require('https');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAHiL9n7wG7rSA9DIneQwCfh6lvXKjGofI",
  authDomain: "hrm-nhan-phu.firebaseapp.com",
  projectId: "hrm-nhan-phu",
  storageBucket: "hrm-nhan-phu.appspot.com",
  messagingSenderId: "623974736852",
  appId: "1:623974736852:web:007f7f29b885ccd958ac41",
};

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch(e) { resolve({ raw: body, error: -1 }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function updateAllZaloProfiles() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Lay tat ca cuoc hoi thoai Zalo chua co ten that
  const convSnap = await getDocs(collection(db, 'conversations'));
  
  const toUpdate = [];
  convSnap.forEach(d => {
    const data = d.data();
    // Chi lay Zalo va ten dang la "Zalo User..."
    if (data.platform === 'Zalo' && data.customerName && data.customerName.startsWith('Zalo User')) {
      toUpdate.push({ id: d.id, ...data });
    }
  });

  console.log(`Tim thay ${toUpdate.length} Zalo User can cap nhat...`);

  for (const conv of toUpdate) {
    const userId = conv.id; // conversation ID = Zalo user ID
    console.log(`\nDang cap nhat: ${conv.customerName} (ID: ${userId})`);
    
    try {
      const proxyUrl = `https://nhanphuphuyen.edu.vn/zalo_proxy.php?user_id=${userId}`;
      const result = await httpsGet(proxyUrl);
      
      if (result.error === 0 && result.data) {
        const newName = result.data.display_name || conv.customerName;
        const newAvatar = result.data.avatar || '';
        
        // Cap nhat vao Firestore
        await updateDoc(doc(db, 'conversations', userId), {
          customerName: newName,
          customerAvatar: newAvatar
        });
        
        console.log(`  ✅ Thanh cong: ${conv.customerName} => ${newName}`);
      } else {
        console.log(`  ❌ Loi lay profile:`, JSON.stringify(result));
      }
    } catch (e) {
      console.log(`  ❌ Loi:`, e.message);
    }
    
    // Cho 500ms giua moi request de tranh spam API
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n=== HOAN THANH ===');
  process.exit(0);
}

updateAllZaloProfiles().catch(e => { console.error(e); process.exit(1); });
