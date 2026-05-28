import fs from 'fs';

const svg = fs.readFileSync('BMM Convention.svg', 'utf8');

console.log('text', (svg.match(/<text/g) || []).length);
console.log('path', (svg.match(/<path/g) || []).length);
console.log('image', (svg.match(/<image/g) || []).length);

const translateGroups = [...svg.matchAll(/<g transform="translate\(([^)]*)\)">/g)]
  .map((match) => match[1]);

console.log('translate groups', translateGroups.length);
console.log(translateGroups.slice(-90).map((item, index) => {
  const offset = translateGroups.length - 90 + index;
  return `${offset}: ${item}`;
}).join('\n'));

const fills = [...svg.matchAll(/fill="([^"]+)"/g)]
  .map((match) => match[1])
  .reduce((acc, fill) => {
    acc[fill] = (acc[fill] || 0) + 1;
    return acc;
  }, {});

console.log('fills', fills);

for (const needle of [
  '<g transform="translate(234.926772',
  '<g transform="translate(457.241256',
]) {
  const index = svg.indexOf(needle);
  console.log(`\n--- snippet for ${needle} at ${index} ---`);
  console.log(svg.slice(Math.max(0, index - 500), index + 1200));
}
