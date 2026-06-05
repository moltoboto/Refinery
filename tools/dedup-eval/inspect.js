// Inspect the structure of dedup_articles.xlsx so we know how the 117 labeled
// duplicate groups are encoded before building the eval harness.
const XLSX = require('xlsx');
const path = require('path');

const file = path.join(__dirname, '..', '..', 'dedup_articles.xlsx');
const wb = XLSX.readFile(file);

console.log('Sheets:', wb.SheetNames);
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  console.log('\n=== sheet:', name, '| rows:', rows.length, '===');
  if (rows.length) {
    console.log('columns:', Object.keys(rows[0]));
    console.log('--- first 5 rows ---');
    rows.slice(0, 5).forEach((r, i) => console.log(i, JSON.stringify(r).slice(0, 400)));
  }
}
