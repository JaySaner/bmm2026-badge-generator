// Trace through drawTextAlongArc logic for all 3 text segments
// to see where each character actually gets placed

function traceText(label, text, startDeg, endDeg, isClockwise, outward) {
  const startAngle = startDeg * Math.PI / 180;
  const endAngle = endDeg * Math.PI / 180;
  const chars = text.split('');
  const numChars = chars.length;
  const cx = 400, cy = 400, r = 275; // approximate canvas values

  console.log(`\n=== ${label}: "${text}" ===`);
  console.log(`  start=${startDeg}°, end=${endDeg}°, clockwise=${isClockwise}, outward=${outward}`);
  
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

    const x = cx + r * Math.cos(charAngle);
    const y = cy + r * Math.sin(charAngle);
    const angleDeg = (charAngle * 180 / Math.PI).toFixed(1);
    
    // Determine clock position
    let clockPos;
    const normAngle = ((charAngle * 180 / Math.PI) % 360 + 360) % 360;
    if (normAngle >= 247.5 && normAngle < 292.5) clockPos = "12 o'clock (TOP)";
    else if (normAngle >= 292.5 && normAngle < 337.5) clockPos = "1-2 o'clock (TOP-RIGHT)";
    else if (normAngle >= 337.5 || normAngle < 22.5) clockPos = "3 o'clock (RIGHT)";
    else if (normAngle >= 22.5 && normAngle < 67.5) clockPos = "4-5 o'clock (BOTTOM-RIGHT)";
    else if (normAngle >= 67.5 && normAngle < 112.5) clockPos = "6 o'clock (BOTTOM)";
    else if (normAngle >= 112.5 && normAngle < 157.5) clockPos = "7-8 o'clock (BOTTOM-LEFT)";
    else if (normAngle >= 157.5 && normAngle < 202.5) clockPos = "9 o'clock (LEFT)";
    else if (normAngle >= 202.5 && normAngle < 247.5) clockPos = "10-11 o'clock (TOP-LEFT)";
    
    console.log(`  '${chars[i]}' → ${angleDeg}° → ${clockPos}`);
  }
}

console.log("====== CURRENT CODE (BROKEN) ======");
traceText("Top", "I am Attending", -127, -59, true, true);
traceText("Left", "BMM Convention", -160, 115, true, true);
traceText("Right", "Seattle 2026", 69.5, 10, false, true);

console.log("\n\n====== PROPOSED FIX ======");
traceText("Top", "I am Attending", 233, 307, true, true);
traceText("Left", "BMM Convention", 200, 130, true, true);
traceText("Right", "Seattle 2026", -20, 50, true, true);
