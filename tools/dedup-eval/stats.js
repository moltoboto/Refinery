const XLSX = require('xlsx');
const path = require('path');
const wb = XLSX.readFile(path.join(__dirname, '..', '..', 'dedup_articles.xlsx'));

// Full "How to use" text
console.log('=== HOW TO USE ===');
XLSX.utils.sheet_to_json(wb.Sheets['How to use'], { defval: '' })
  .forEach(r => console.log('  ' + Object.values(r)[0]));

const rows = XLSX.utils.sheet_to_json(wb.Sheets['Articles'], { defval: '' });
const labeled = rows.filter(r => String(r['Group #']).trim() !== '');

// group -> rows
const groups = {};
labeled.forEach(r => {
  const g = String(r['Group #']).trim();
  (groups[g] = groups[g] || []).push(r);
});

const roleCount = {};
labeled.forEach(r => { const role = String(r['Role']).trim() || '(blank)'; roleCount[role] = (roleCount[role]||0)+1; });

console.log('\n=== LABELED DATA ===');
console.log('total rows:', rows.length);
console.log('labeled rows (have Group #):', labeled.length);
console.log('distinct groups:', Object.keys(groups).length);
console.log('role distribution:', JSON.stringify(roleCount));

const sizes = Object.values(groups).map(g => g.length);
console.log('group sizes: min', Math.min(...sizes), 'max', Math.max(...sizes), 'avg', (sizes.reduce((a,b)=>a+b,0)/sizes.length).toFixed(2));

// show a few sample groups
console.log('\n=== SAMPLE GROUPS ===');
Object.keys(groups).slice(0, 4).forEach(g => {
  console.log('\nGroup', g, '(' + groups[g].length + ' rows):');
  groups[g].forEach(r => console.log('   [' + (r['Role']||'?') + '] (' + r['Source / Feed'] + ') ' + String(r['Article Title']).slice(0,70) + '  id=' + r.id));
});
