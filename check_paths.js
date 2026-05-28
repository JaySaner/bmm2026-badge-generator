import fs from 'fs';
import { parseSVG, makeAbsolute } from 'svg-path-parser';

const content = fs.readFileSync('BMM Convention.svg', 'utf8');
const pathMatches = content.match(/<path[^>]*d="([^"]+)"[^>]*>/g);

if (!pathMatches) {
  console.log('No paths found with d attribute.');
  process.exit(0);
}

// Very simple bounding box calculator for paths
function getBoundingBox(d) {
  // Extract all coordinates from the path
  const matches = d.match(/[+-]?\d*\.?\d+(?:[eE][+-]?\d+)?/g);
  if (!matches) return null;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  for (let i = 0; i < matches.length; i += 2) {
    // This is a naive approach that just looks at all numbers, assuming alternating x, y
    // It's not perfectly accurate for all SVG commands (like A) but good enough for a rough bounding box
    // To be safer, we just use a regex to find all coordinates in M, L, C, etc.
  }
}
