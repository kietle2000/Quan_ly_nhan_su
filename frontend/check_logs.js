const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAHiL9n7wG7rSA9DIneQwCfh6lvXKjGofI",
  authDomain: "hrm-nhan-phu.firebaseapp.com",
  projectId: "hrm-nhan-phu",
  storageBucket: "hrm-nhan-phu.appspot.com",
  messagingSenderId: "623974736852",
  appId: "1:623974736852:web:007f7f29b885ccd958ac41",
  measurementId: "G-5ZP5B4H3KK"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkLogs() {
  const q = query(collection(db, 'debug_logs'), orderBy('createdAt', 'desc'), limit(5));
  const snap = await getDocs(q);
  if (snap.empty) {
    console.log("No debug logs found.");
  } else {
    snap.forEach(doc => {
      console.log(doc.id, JSON.stringify(doc.data(), null, 2));
    });
  }
}

checkLogs().catch(console.error);
