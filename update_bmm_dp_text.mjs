import fs from 'fs';

const sourcePath = 'BMM Convention.svg';
const outputPath = 'BMM Convention-updated.svg';

const source = fs.readFileSync(sourcePath, 'utf8');

const withoutOutlinedText = source.replace(
  /<g fill="#ecaa20" fill-opacity="1"><g transform="translate\([^)]*\)"><g(?:\/|>[\s\S]*?<\/g>)<\/g><\/g>/g,
  ''
);

const arcText = `
<g id="updated-readable-ring-text" fill="#ecaa20" font-family="Montserrat, Poppins, Arial, sans-serif" font-weight="800" text-rendering="geometricPrecision">
  <defs>
    <path id="bmmTextTopArc" d="M 392.9 392.9 A 505 505 0 0 1 1107.1 392.9"/>
    <path id="bmmTextLeftArc" d="M 275.6 572.1 A 507 507 0 0 0 505.6 1184.4"/>
    <path id="bmmTextRightArc" d="M 1007.1 1193.7 A 507 507 0 0 0 1255.0 706.1"/>
  </defs>
  <text font-size="68" letter-spacing="5.5" stroke="#ffffff" stroke-width="2.2" paint-order="stroke fill" dominant-baseline="middle">
    <textPath href="#bmmTextTopArc" startOffset="50%" text-anchor="middle">I AM ATTENDING</textPath>
  </text>
  <text font-size="66" letter-spacing="3.8" stroke="#ffffff" stroke-width="2.2" paint-order="stroke fill" dominant-baseline="middle">
    <textPath href="#bmmTextLeftArc" startOffset="50%" text-anchor="middle">BMM CONVENTION</textPath>
  </text>
  <text font-size="58" letter-spacing="3.2" stroke="#ffffff" stroke-width="2" paint-order="stroke fill" dominant-baseline="middle">
    <textPath href="#bmmTextRightArc" startOffset="50%" text-anchor="middle">SEATTLE 2026</textPath>
  </text>
</g>`;

const updated = withoutOutlinedText.replace('</svg>', `${arcText}</svg>`);

fs.writeFileSync(outputPath, updated);

const removed = (source.match(/<g fill="#ecaa20" fill-opacity="1"><g transform="translate\([^)]*\)"><g(?:\/|>[\s\S]*?<\/g>)<\/g><\/g>/g) || []).length;
console.log(`Removed ${removed} outlined text glyph groups.`);
console.log(`Wrote ${outputPath}.`);
