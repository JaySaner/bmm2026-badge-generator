const startAngle = 45 * Math.PI / 180;
const endAngle = -35 * Math.PI / 180;
const isClockwise = true;
const text = 'Seattle 2026';

const chars = text.split('');
const numChars = chars.length;

for (let i = 0; i < numChars; i++) {
  let charAngle;
  if (numChars > 1) {
    const fraction = i / (numChars - 1);
    if (isClockwise) {
      charAngle = startAngle + fraction * (endAngle - startAngle);
    } else {
      charAngle = endAngle - fraction * (endAngle - startAngle);
    }
  } else {
    charAngle = (startAngle + endAngle) / 2;
  }
  
  console.log(`Char ${chars[i]} at angle ${(charAngle * 180 / Math.PI).toFixed(1)}`);
}
