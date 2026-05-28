import fs from 'fs';

const content = fs.readFileSync('BMM Convention.svg', 'utf8');

// Extract all top-level groups with their full transform
// Look for groups at depth 2 (inside main svg > g) that have translate transforms
// Each letter glyph typically has: <g transform="translate(x,y)"><g transform="matrix(...)"><path d="..."/></g></g>

// Find all groups containing a matrix transform (inner glyph transform)
const innerMatrices = [...content.matchAll(/<g transform="(matrix\([^"]+\))">/g)];
console.log('Inner matrix transforms (first 10):');
innerMatrices.slice(0, 10).forEach((m, i) => {
  console.log(`  ${i}: ${m[1]}`);
});

// More complete: find each translate group and what's inside it
const translateGroups = [...content.matchAll(/<g transform="translate\(([^)]+)\)">([\s\S]*?)<\/g>/g)];
console.log('\nTranslate groups (first 5) with inner content:');
translateGroups.slice(0, 5).forEach((m, i) => {
  const translate = m[1];
  const inner = m[2].substring(0, 300);
  console.log(`\n--- Group ${i}: translate(${translate}) ---`);
  console.log(inner);
});
