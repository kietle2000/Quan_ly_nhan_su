const payload = {
  apiKey: "NhanPhuHrmSecretApiKey_2026",
  path: "employee", // dummy path
  method: "GET",
  query: {},
  body: {},
  userId: "admin-uuid-0000-000000000000",
  userRole: "Admin"
};

// We will change path to run a custom search if needed, or query all tables one by one.
// Let's write a script that calls a custom search block or fetches all sheets.
// Actually, let's query the `report/daily` table without date filters, and `crm/lead` table to see where the file is.

async function searchAll() {
  const tables = ['report/daily', 'crm/lead'];
  for (const table of tables) {
    try {
      const res = await fetch('https://script.google.com/macros/s/AKfycbxuRiWuBOYUKgQyZRyrjyvgGRRKHDywJb29rxhXQbysLsZmHAGQc_z2zSlSf7M-jKKqww/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          path: table,
          query: {} // no date filter
        })
      });
      const data = await res.json();
      console.log(`=== Table: ${table} ===`);
      console.log(JSON.stringify(data, null, 2).substring(0, 3000));
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
    }
  }
}

searchAll();
