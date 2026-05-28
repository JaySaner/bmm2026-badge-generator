import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Upload, User, MapPin, Briefcase, Share2, ArrowLeft, LayoutDashboard, Trash2, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AdminLogin from './pages/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';

// Helper to remove solid background color of the logo dynamically (chroma-keying the top-left pixel)
const removeLogoBackground = (img) => {
  if (!img || img.width === 0) return img;
  
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imgData.data;

  // Sample top-left corner pixel as background color
  const bgR = data[0];
  const bgG = data[1];
  const bgB = data[2];
  const bgA = data[3];

  // If corner is already transparent, no need to key it out
  if (bgA < 10) return img;

  // Tolerance for keying out similar colors
  const tolerance = 45;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Check Euclidean distance in RGB color space
    const dist = Math.sqrt(
      (r - bgR) ** 2 +
      (g - bgG) ** 2 +
      (b - bgB) ** 2
    );

    if (dist < tolerance) {
      data[i + 3] = 0; // Make transparent
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
};

// Helper to draw measured text along a circular path.
const drawTextAlongArc = (ctx, text, cx, cy, r, startAngle, endAngle, isClockwise, outward, font, color, letterSpacing = 0) => {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const chars = [...text];
  const widths = chars.map((char) => ctx.measureText(char).width);
  const totalWidth = widths.reduce((sum, width) => sum + width, 0) + letterSpacing * Math.max(chars.length - 1, 0);
  const arcAngle = Math.abs(endAngle - startAngle);
  const textAngle = Math.min(totalWidth / r, arcAngle * 0.92);
  const midAngle = (startAngle + endAngle) / 2;
  const direction = isClockwise ? 1 : -1;
  let angle = midAngle - direction * textAngle / 2;

  chars.forEach((char, index) => {
    const charAngleSize = widths[index] / r;
    angle += direction * charAngleSize / 2;

    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    ctx.save();
    ctx.translate(x, y);
    const rotationAngle = angle + (outward ? Math.PI / 2 : -Math.PI / 2);
    ctx.rotate(rotationAngle);
    ctx.fillText(char, 0, 0);
    ctx.restore();

    angle += direction * (charAngleSize / 2 + letterSpacing / r);
  });
  ctx.restore();
};

// Helper to draw a beautifully shaded and layered gold octagon badge at the bottom-center
const drawGoldOctagonBadge = (ctx, bx, by, br, logoImg, useWhiteLogoBg = false) => {
  ctx.save();
  // Drop shadow for depth
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;

  // 1. Draw outer gold octagon border
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + Math.PI / 8;
    const x = bx + (br + 4) * Math.cos(angle);
    const y = by + (br + 4) * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#d4af37'; // antique gold
  ctx.fill();

  // 2. Draw outer thin white border
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + Math.PI / 8;
    const x = bx + (br + 1) * Math.cos(angle);
    const y = by + (br + 1) * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 3. Draw inner filled octagon
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + Math.PI / 8;
    const x = bx + br * Math.cos(angle);
    const y = by + br * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  
  if (useWhiteLogoBg) {
    ctx.fillStyle = '#ffffff';
  } else {
    const badgeGrad = ctx.createLinearGradient(bx - br, by - br, bx + br, by + br);
    badgeGrad.addColorStop(0, '#fff4b8'); // bright gold
    badgeGrad.addColorStop(0.3, '#fbc02d'); // yellow-orange gold
    badgeGrad.addColorStop(0.7, '#f57f17'); // amber gold
    badgeGrad.addColorStop(1, '#a85000'); // deep burnt gold
    ctx.fillStyle = badgeGrad;
  }
  ctx.fill();

  // 4. Draw inner thin white accent stroke
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + Math.PI / 8;
    const x = bx + (br - 6) * Math.cos(angle);
    const y = by + (br - 6) * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore(); // remove shadow for inner drawings

  // 5. Draw logo image inside the badge
  if (logoImg && logoImg.width > 0) {
    const processedLogo = removeLogoBackground(logoImg);
    const lw = br * 1.15; // logo width inside the badge
    const lh = lw * (logoImg.height / logoImg.width);
    const lx = bx - lw / 2;
    const ly = by - lh / 2 - 10; // offset slightly up for text
    ctx.drawImage(processedLogo, lx, ly, lw, lh);
  }

  // 6. Draw BMM2026 text at the bottom inside the badge
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#051036'; // dark navy blue
  ctx.font = '900 13px Inter, sans-serif';
  ctx.fillText('BMM2026', bx, by + br * 0.65);
  ctx.restore();
};

// ─── Group Collage Canvas Renderer ────────────────────────────────────────────
const GroupCollageCanvas = ({ photos, memberCount, groupName, city, canvasRef }) => {
  useEffect(() => {
    if (!photos || photos.filter(p => p).length === 0 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const SIZE = 800;
    canvas.width = SIZE;
    canvas.height = SIZE;

    // Load member images
    const loadedImages = [];
    const logoImg = new Image();
    const photosToLoad = photos.slice(0, memberCount);
    const totalImagesToLoad = photosToLoad.filter(p => p).length;

    let imagesLoaded = 0;
    const checkAllLoaded = () => {
      imagesLoaded++;
      if (imagesLoaded === totalImagesToLoad + 1) {
        document.fonts.ready.then(() => {
          draw();
        });
      }
    };

    photosToLoad.forEach((photoData, index) => {
      if (!photoData) {
        loadedImages[index] = null;
        checkAllLoaded();
        return;
      }
      const img = new Image();
      img.onload = () => {
        loadedImages[index] = img;
        checkAllLoaded();
      };
      img.onerror = () => {
        loadedImages[index] = null;
        checkAllLoaded();
      };
      img.src = photoData;
    });

    logoImg.onload = checkAllLoaded;
    logoImg.onerror = checkAllLoaded;
    logoImg.src = '/logo.png';

    const draw = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      
      // 1. Fill entire canvas with orange background
      ctx.fillStyle = '#f37021';
      ctx.fillRect(0, 0, SIZE, SIZE);

      const cx = SIZE / 2;
      const cy = SIZE / 2;
      const r_outer = 320;
      const r_inner = 230;

      // 2. Draw white ring outer fill
      ctx.beginPath();
      ctx.arc(cx, cy, r_outer, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // 3. Draw outer gold accent thin border line
      ctx.beginPath();
      ctx.arc(cx, cy, r_outer - 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#e59a18';
      ctx.lineWidth = 4;
      ctx.stroke();

      // 4. Draw curved text segments on the white ring
      const textRadius = (r_outer + r_inner) / 2;
      const textColor = '#e59a18';

      // Top arc
      drawTextAlongArc(
        ctx,
        'We are Attending',
        cx, cy, textRadius,
        -128 * Math.PI / 180,
        -52 * Math.PI / 180,
        true,
        true,
        'bold 32px "Poppins", "Inter", sans-serif',
        textColor,
        2.2
      );

      // Left arc
      drawTextAlongArc(
        ctx,
        'BMM Convention',
        cx, cy, textRadius,
        222 * Math.PI / 180,
        138 * Math.PI / 180,
        false,
        false,
        'bold 34px "Poppins", "Inter", sans-serif',
        textColor,
        1.4
      );

      // Right arc
      drawTextAlongArc(
        ctx,
        'Seattle 2026',
        cx, cy, textRadius,
        -42 * Math.PI / 180,
        42 * Math.PI / 180,
        true,
        true,
        'bold 34px "Poppins", "Inter", sans-serif',
        textColor,
        1.4
      );

      // ─── 5. DRAW COLLAGE PHOTOS (Clipped to inner circle) ───
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r_inner, 0, Math.PI * 2);
      ctx.clip();

      const drawCenterCropped = (img, tx, ty, tw, th) => {
        if (!img) {
          ctx.fillStyle = '#FFF3E8';
          ctx.fillRect(tx, ty, tw, th);
          return;
        }
        const imgRatio = img.width / img.height;
        const targetRatio = tw / th;
        let sx, sy, sw, sh;

        if (imgRatio > targetRatio) {
          sh = img.height;
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
          sy = 0;
        } else {
          sw = img.width;
          sh = img.width / targetRatio;
          sx = 0;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, tx, ty, tw, th);
      };

      // Since the photo collage was originally designed for a larger circle,
      // we draw it centered in the 800x800 canvas size which perfectly scales inside r_inner!
      if (memberCount === 2) {
        // 2 Members (Left / Right vertical split)
        drawCenterCropped(loadedImages[0], 0, 0, cx, SIZE);
        drawCenterCropped(loadedImages[1], cx, 0, cx, SIZE);

        // Gold Divider Line
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, SIZE);
        ctx.strokeStyle = '#e59a18';
        ctx.lineWidth = 8;
        ctx.stroke();

      } else if (memberCount === 3) {
        // 3 Members (Top half, Bottom Left, Bottom Right)
        drawCenterCropped(loadedImages[0], 0, 0, SIZE, cy);
        drawCenterCropped(loadedImages[1], 0, cy, cx, cy);
        drawCenterCropped(loadedImages[2], cx, cy, cx, cy);

        // Gold Divider Lines
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(SIZE, cy);
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, SIZE);
        ctx.strokeStyle = '#e59a18';
        ctx.lineWidth = 8;
        ctx.stroke();

      } else {
        // 4 Members (2x2 Quadrants)
        drawCenterCropped(loadedImages[0], 0, 0, cx, cy);
        drawCenterCropped(loadedImages[1], cx, 0, cx, cy);
        drawCenterCropped(loadedImages[2], 0, cy, cx, cy);
        drawCenterCropped(loadedImages[3], cx, cy, cx, cy);

        // Gold Divider Lines (Cross)
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(SIZE, cy);
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, SIZE);
        ctx.strokeStyle = '#e59a18';
        ctx.lineWidth = 8;
        ctx.stroke();
      }

      ctx.restore(); // Restore inner circle clip

      // 6. Draw inner gold border around photo collage
      ctx.beginPath();
      ctx.arc(cx, cy, r_inner + 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#e59a18';
      ctx.lineWidth = 5;
      ctx.stroke();

      // 7. Draw bottom-center golden octagon logo badge
      const bx = cx;
      const by = cy + r_inner + 5;
      const br = 82;
      drawGoldOctagonBadge(ctx, bx, by, br, logoImg);
    };
  }, [photos, memberCount, groupName, city]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', maxWidth: '300px', display: 'block', margin: '0 auto', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
    />
  );
};

// ─── WhatsApp DP Canvas (Perfect Circle Crop) ─────────────────────────
const WhatsAppDPCanvas = ({ photo, name, gender, dpRef }) => {
  useEffect(() => {
    if (!photo || !dpRef.current) return;
    const canvas = dpRef.current;
    const ctx = canvas.getContext('2d');
    const SIZE = 800; // High res
    canvas.width = SIZE;
    canvas.height = SIZE;

    const img = new Image();
    const logoImg = new Image();
    let imagesLoaded = 0;

    const checkDraw = () => {
      imagesLoaded++;
      if (imagesLoaded === 2) {
        document.fonts.ready.then(() => {
          draw();
        });
      }
    };

    img.onload = checkDraw;
    img.onerror = checkDraw;
    img.src = photo;

    logoImg.onload = checkDraw;
    logoImg.onerror = checkDraw;
    logoImg.src = '/bmm-seattle-logo.png';

    const draw = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      
      // 1. Fill entire canvas with orange background
      ctx.fillStyle = '#f37021';
      ctx.fillRect(0, 0, SIZE, SIZE);

      const cx = SIZE / 2;
      const cy = SIZE / 2;
      const r_outer = 320;
      const r_inner = 230;

      // 2. Draw white ring outer fill
      ctx.beginPath();
      ctx.arc(cx, cy, r_outer, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // 3. Draw outer gold accent thin border line
      ctx.beginPath();
      ctx.arc(cx, cy, r_outer - 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#e59a18';
      ctx.lineWidth = 4;
      ctx.stroke();

      // 4. Draw curved text segments on the white ring
      const textRadius = (r_outer + r_inner) / 2;
      const textColor = '#e59a18';

      // Top arc
      drawTextAlongArc(
        ctx,
        'I AM ATTENDING',
        cx, cy, textRadius,
        -128 * Math.PI / 180,
        -52 * Math.PI / 180,
        true,
        true,
        'bold 32px "Poppins", "Inter", sans-serif',
        textColor,
        2.2
      );

      // Left arc
      drawTextAlongArc(
        ctx,
        'BMM Convention',
        cx, cy, textRadius,
        222 * Math.PI / 180,
        138 * Math.PI / 180,
        false,
        false,
        'bold 34px "Poppins", "Inter", sans-serif',
        textColor,
        1.4
      );

      // Right arc
      drawTextAlongArc(
        ctx,
        'Seattle 2026',
        cx, cy, textRadius,
        -42 * Math.PI / 180,
        42 * Math.PI / 180,
        true,
        true,
        'bold 34px "Poppins", "Inter", sans-serif',
        textColor,
        1.4
      );

      // 5. Draw user photo cropped to central inner circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r_inner, 0, Math.PI * 2);
      ctx.clip();

      if (img.width > 0) {
        const imgRatio = img.width / img.height;
        const targetRatio = 1;
        let sx, sy, sw, sh;
        if (imgRatio > targetRatio) {
          sh = img.height;
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
          sy = 0;
        } else {
          sw = img.width;
          sh = img.width / targetRatio;
          sx = 0;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, cx - r_inner, cy - r_inner, r_inner * 2, r_inner * 2);
      } else {
        ctx.fillStyle = '#FFF3E8';
        ctx.fillRect(cx - r_inner, cy - r_inner, r_inner * 2, r_inner * 2);
      }
      ctx.restore();

      // 6. Draw inner gold border around photo (on top of photo edge)
      ctx.beginPath();
      ctx.arc(cx, cy, r_inner + 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#e59a18';
      ctx.lineWidth = 5;
      ctx.stroke();

      // 7. Draw bottom-center golden octagon logo badge
      const bx = cx;
      const by = cy + r_inner + 5; // centers it perfectly overlapping the white ring & bottom edge of inner circle
      const br = 82;
      drawGoldOctagonBadge(ctx, bx, by, br, logoImg, true);
    };
  }, [photo, name, gender]);

  return (
    <canvas
      ref={dpRef}
      style={{ width: '100%', maxWidth: '300px', display: 'block', margin: '0 auto', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
    />
  );
};

// ─── Social Poster (1:1 for Instagram) ───────────────────────────────────────
const SocialPosterCanvas = ({ photo, name, role, city, posterRef }) => {
  useEffect(() => {
    if (!photo || !posterRef.current) return;
    const canvas = posterRef.current;
    const ctx = canvas.getContext('2d');
    const W = 1080, H = 1080;
    canvas.width = W;
    canvas.height = H;

    const img = new Image();
    const logoImg = new Image();
    let imagesLoaded = 0;
    const checkDraw = () => {
      imagesLoaded++;
      if (imagesLoaded === 2) {
        document.fonts.ready.then(() => {
          draw();
        });
      }
    };

    img.onload = checkDraw;
    img.onerror = checkDraw;
    img.src = photo;

    logoImg.onload = checkDraw;
    logoImg.onerror = checkDraw;
    logoImg.src = '/logo.png';

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Background - White
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // Subtle dot pattern
      ctx.fillStyle = '#000000';
      ctx.globalAlpha = 0.02;
      for (let x = 0; x < W; x += 30) {
        for (let y = 0; y < H; y += 30) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;

      // Header Section
      if (logoImg.width > 0) {
        const processedLogo = removeLogoBackground(logoImg);
        ctx.drawImage(processedLogo, 40, 30, 130, 130 * (logoImg.height / logoImg.width));
      }

      ctx.textAlign = 'left';
      ctx.font = '900 48px Poppins, sans-serif';
      ctx.fillStyle = '#0A1F5C'; // dark blue
      ctx.fillText('BMM CONVENTION 2026', 220, 90);

      ctx.textAlign = 'right';
      ctx.font = 'bold 28px Inter, sans-serif';
      ctx.fillStyle = '#00664F'; // green
      ctx.fillText('#BMM2026', W - 40, 90);

      ctx.textAlign = 'left';
      ctx.font = '600 24px Inter, sans-serif';
      ctx.fillStyle = '#E55934'; // orange
      ctx.fillText('AUGUST 6-9, 2026  •  SEATTLE CONVENTION CENTER', 220, 140);

      // Divider line
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(190, 175);
      ctx.lineTo(W - 40, 175);
      ctx.stroke();

      // Middle Section - Left (Photo)
      const cx = 310, cy = 470, r = 230;

      // Outer orange arc
      ctx.beginPath();
      ctx.arc(cx, cy, r + 20, -Math.PI / 2, Math.PI * 0.8);
      ctx.strokeStyle = '#E55934'; // orange
      ctx.lineWidth = 8;
      ctx.stroke();

      // Photo clipping and drawing
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      
      if (img.width > 0) {
        const imgRatio = img.width / img.height;
        const targetRatio = 1;
        let sx, sy, sw, sh;
        if (imgRatio > targetRatio) {
          sh = img.height;
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
          sy = 0;
        } else {
          sw = img.width;
          sh = img.width / targetRatio;
          sx = 0;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, cx - r, cy - r, r * 2, r * 2);
      } else {
        ctx.fillStyle = '#F0F4F8';
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
      ctx.restore();

      // Inner gold border for photo
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#D4AF37'; // gold
      ctx.lineWidth = 5;
      ctx.stroke();

      // Middle Section - Right (Text)
      ctx.textAlign = 'left';
      const tx = 590;

      ctx.font = '900 38px Poppins, sans-serif';
      ctx.fillStyle = '#E55934';
      ctx.fillText('JOIN ME AT THE', tx, 380);

      ctx.font = '900 42px Poppins, sans-serif';
      ctx.fillStyle = '#0A1F5C'; // dark blue
      ctx.fillText('BIGGEST', tx, 450);
      let w1 = ctx.measureText('BIGGEST ').width;
      ctx.fillStyle = '#D4AF37'; // gold
      ctx.fillText('MARATHI', tx + w1, 450);

      ctx.fillStyle = '#0A1F5C';
      ctx.fillText('GATHERING IN', tx, 520);
      ctx.fillText('NORTH AMERICA.', tx, 590);

      // Line separator
      ctx.fillStyle = '#E55934';
      ctx.fillRect(tx, 635, 100, 6);

      // Name & Details
      ctx.font = '900 40px Poppins, sans-serif';
      ctx.fillStyle = '#E55934';
      ctx.fillText(name.toUpperCase(), tx, 692);

      if (city) {
        ctx.font = '600 22px Inter, sans-serif';
        ctx.fillStyle = '#555555'; // dark grey
        ctx.fillText(city.toUpperCase(), tx, 735);
      }

      // ─── 1. Tagline Area (Sit between Name/City section and Stats Bar) ───
      const taglineBgY = 780;
      const taglineBgH = 80;
      ctx.fillStyle = '#F0F4F8'; // light blue/grey
      ctx.fillRect(0, taglineBgY, W, taglineBgH);

      // Draw Tagline Text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 30px "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = '#0A1F5C'; // dark blue
      ctx.fillText('जपूया संस्कृती, विणूया नाती!', W / 2, taglineBgY + taglineBgH / 2);
      ctx.textBaseline = 'alphabetic'; // reset

      // ─── 2. Bottom Stats Bar ──────────────────────────────────────────────
      const statsY = 860;
      const statsH = 130;
      const colors = ['#E55934', '#0A1F5C', '#00664F', '#D4AF37', '#E55934'];
      const stats = [
        { n: '2,500+', t: 'Attendees' },
        { n: '54+', t: 'Mandals' },
        { n: '100+', t: 'Performances' },
        { n: '10', t: 'Competitions' },
        { n: '22nd', t: 'Convention' }
      ];

      const bw = W / 5;
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(i * bw, statsY, bw, statsH);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 36px Poppins, sans-serif';
        ctx.fillText(stats[i].n, i * bw + bw / 2, statsY + 65);

        ctx.font = '500 18px Inter, sans-serif';
        ctx.fillStyle = '#ffffff'; 
        ctx.fillText(stats[i].t, i * bw + bw / 2, statsY + 98);
      }

      // ─── 3. Social Media & Website Strip (Absolute Last Footer) ──────────
      const barY = 990;
      const barH = 90;
      ctx.fillStyle = '#051036'; // very dark blue
      ctx.fillRect(0, barY, W, barH);

      const barCy = barY + barH / 2;

      // Left side: Globe icon + website URL
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      // Globe icon (simple circle with cross)
      const globeX = 40;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(globeX, barCy, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(globeX - 10, barCy);
      ctx.lineTo(globeX + 10, barCy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(globeX, barCy - 10);
      ctx.lineTo(globeX, barCy + 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(globeX, barCy, 5, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
      // URL text
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 18px Inter, sans-serif';
      ctx.fillText('www.bmmseattle2026.org', globeX + 20, barCy + 1);

      // Right side: 3 social icons + shared handle
      ctx.textAlign = 'right';
      ctx.font = '600 18px Inter, sans-serif';
      ctx.fillStyle = '#D4AF37'; // gold
      const handleText = '/BMMSeattle2026';
      const handleW = ctx.measureText(handleText).width;
      const handleX = W - 40;
      ctx.fillText(handleText, handleX, barCy + 1);

      // Icons to the left of the handle
      const iconStartX = handleX - handleW - 24;
      const iconR = 14;
      const iconGap = 40;

      // YouTube (rightmost icon)
      const ytX = iconStartX;
      ctx.beginPath();
      ctx.arc(ytX, barCy, iconR, 0, Math.PI * 2);
      ctx.fillStyle = '#FF0000';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('▶', ytX + 1, barCy + 1);

      // Facebook
      const fbX = ytX - iconGap;
      ctx.beginPath();
      ctx.arc(fbX, barCy, iconR, 0, Math.PI * 2);
      ctx.fillStyle = '#1877F2';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('f', fbX, barCy + 1);

      // Instagram (leftmost icon)
      const igX = fbX - iconGap;
      ctx.beginPath();
      ctx.arc(igX, barCy, iconR, 0, Math.PI * 2);
      const igGrad = ctx.createLinearGradient(igX - iconR, barCy + iconR, igX + iconR, barCy - iconR);
      igGrad.addColorStop(0, '#feda75');
      igGrad.addColorStop(0.35, '#fa7e1e');
      igGrad.addColorStop(0.55, '#d62976');
      igGrad.addColorStop(0.8, '#962fbf');
      igGrad.addColorStop(1, '#4f5bd5');
      ctx.fillStyle = igGrad;
      ctx.fill();
      // Camera icon inside
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      const cix = igX - 7, ciy2 = barCy - 7;
      ctx.beginPath();
      ctx.moveTo(cix + 2, ciy2);
      ctx.lineTo(cix + 12, ciy2);
      ctx.quadraticCurveTo(cix + 14, ciy2, cix + 14, ciy2 + 2);
      ctx.lineTo(cix + 14, ciy2 + 12);
      ctx.quadraticCurveTo(cix + 14, ciy2 + 14, cix + 12, ciy2 + 14);
      ctx.lineTo(cix + 2, ciy2 + 14);
      ctx.quadraticCurveTo(cix, ciy2 + 14, cix, ciy2 + 12);
      ctx.lineTo(cix, ciy2 + 2);
      ctx.quadraticCurveTo(cix, ciy2, cix + 2, ciy2);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(igX, barCy, 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(igX + 4.5, barCy - 4.5, 1, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Reset text alignment
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    };
  }, [photo, name, role, city]);

  return (
    <canvas
      ref={posterRef}
      style={{ width: '100%', maxWidth: '340px', display: 'block', margin: '0 auto', borderRadius: '12px', border: '1px solid #eee' }}
    />
  );
};

// ─── Main App ──────────────────────────────────────────────────────────────────
const PublicApp = ({ forceAdmin = false }) => {
  const [step, setStep] = useState(forceAdmin ? 'admin' : 'form');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', photo: null, city: '', role: 'Attendee', gender: 'female' });
  const [groupFormData, setGroupFormData] = useState({ groupName: '', memberCount: 4, photos: [null, null, null, null], city: '' });
  const [registrations, setRegistrations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const dpCanvasRef = useRef(null);
  const posterCanvasRef = useRef(null);
  const groupDpCanvasRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('bmm_registrations');
    if (saved) setRegistrations(JSON.parse(saved));
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData(f => ({ ...f, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleGroupPhotoUpload = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setGroupFormData(f => {
        const newPhotos = [...f.photos];
        newPhotos[index] = reader.result;
        return { ...f, photos: newPhotos };
      });
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    if (!formData.name || !formData.photo) {
      alert('Please enter your name and upload a photo!');
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      const newReg = {
        ...formData,
        id: `BMM26-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleDateString()
      };
      const updated = [newReg, ...registrations];
      setRegistrations(updated);
      localStorage.setItem('bmm_registrations', JSON.stringify(updated));
      setIsGenerating(false);
      setStep('preview');
      confetti({ particleCount: 160, spread: 80, origin: { y: 0.55 }, colors: ['#D4AF37', '#0a1f5c', '#FF9933'] });
    }, 1800);
  };

  const handleGenerateGroup = () => {
    const uploadedPhotosCount = groupFormData.photos.slice(0, groupFormData.memberCount).filter(p => p).length;
    if (!groupFormData.groupName) {
      alert('Please enter a group/mandal name!');
      return;
    }
    if (uploadedPhotosCount < groupFormData.memberCount) {
      alert(`Please upload photos for all ${groupFormData.memberCount} members!`);
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      const newReg = {
        name: groupFormData.groupName,
        photo: groupFormData.photos[0], // Use first photo as preview in admin
        city: groupFormData.city,
        role: `Group (${groupFormData.memberCount} Members)`,
        id: `BMM26-G-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleDateString(),
        isGroup: true,
        groupData: groupFormData
      };
      const updated = [newReg, ...registrations];
      setRegistrations(updated);
      localStorage.setItem('bmm_registrations', JSON.stringify(updated));
      setIsGenerating(false);
      setStep('previewGroup');
      confetti({ particleCount: 160, spread: 80, origin: { y: 0.55 }, colors: ['#D4AF37', '#0a1f5c', '#FF9933'] });
    }, 1800);
  };

  const downloadCanvas = (ref, fileName) => {
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = ref.current.toDataURL('image/png');
    link.click();
  };

  const deleteRegistration = (id) => {
    const updated = registrations.filter(r => r.id !== id);
    setRegistrations(updated);
    localStorage.setItem('bmm_registrations', JSON.stringify(updated));
  };

  return (
    <div className="bmm-app">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="bmm-header">
        <div className="bmm-header-inner">
          <img src="/logo.png" alt="BMM 2026" className="bmm-logo" />
          <div>
            <h1 className="bmm-title">BMM 2026 Seattle</h1>
            <p className="bmm-subtitle">Profile Frame &amp; Poster Generator</p>
          </div>
        </div>
        <nav className="bmm-nav">
          {!forceAdmin && (
            <>
              <button
                className={`bmm-nav-btn ${step === 'form' || step === 'preview' ? 'active' : ''}`}
                onClick={() => setStep(formData.name && formData.photo ? 'preview' : 'form')}
              >Personal DP</button>
              <button
                className={`bmm-nav-btn ${step === 'groupForm' || step === 'previewGroup' ? 'active' : ''}`}
                onClick={() => setStep(groupFormData.groupName && groupFormData.photos.filter(p => p).length >= groupFormData.memberCount ? 'previewGroup' : 'groupForm')}
              >Group DP</button>
              {user && (
                <button
                  className="bmm-nav-btn"
                  onClick={() => navigate('/admin/dashboard')}
                ><LayoutDashboard size={16} /> Admin</button>
              )}
            </>
          )}
          {forceAdmin && (
            <>
              <button
                className={`bmm-nav-btn ${step === 'admin' ? 'active' : ''}`}
                onClick={() => setStep('admin')}
              >
                <LayoutDashboard size={16} /> Dashboard
              </button>
              <button
                className="bmm-nav-btn"
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          )}
        </nav>
      </header>

      <main className="bmm-main">
        <AnimatePresence mode="wait">

          {/* ── FORM ──────────────────────────────────────────────── */}
          {step === 'form' && (
            <motion.div key="form" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} className="bmm-card">
              <div className="card-badge">Step 1 of 2</div>
              <h2 className="card-title">Enter Your Details</h2>
              <p className="card-desc">Fill in your info to generate your personalised BMM 2026 frame, poster, and WhatsApp DP.</p>

              <div className="form-row">
                <label><User size={15} /> Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Deshmukh"
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              {/* Gender Selector for Marathi Text */}
              <div className="form-row">
                <label>Marathi Tagline Gender *</label>
                <div className="segmented-control" style={{ marginBottom: 0 }}>
                  <button
                    type="button"
                    className={`segmented-btn ${formData.gender === 'female' ? 'active' : ''}`}
                    onClick={() => setFormData(f => ({ ...f, gender: 'female' }))}
                  >
                    Female: मी जातेय...
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${formData.gender === 'male' ? 'active' : ''}`}
                    onClick={() => setFormData(f => ({ ...f, gender: 'male' }))}
                  >
                    Male: मी जातोय...
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${formData.gender === 'plural' ? 'active' : ''}`}
                    onClick={() => setFormData(f => ({ ...f, gender: 'plural' }))}
                  >
                    Group: आम्ही जातोय...
                  </button>
                </div>
              </div>

              {/* Photo Upload */}
              <div className="form-row">
                <label><Upload size={15} /> Your Photo *</label>
                <div className="photo-drop" onClick={() => document.getElementById('photo-input').click()}>
                  {formData.photo
                    ? <img src={formData.photo} alt="preview" className="photo-preview-thumb" />
                    : <>
                        <Upload size={36} style={{ opacity: 0.4, marginBottom: 8 }} />
                        <p>Click to upload photo</p>
                        <span>JPG, PNG · Best with clear face</span>
                      </>
                  }
                  <input id="photo-input" type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
                </div>
              </div>

              <div className="form-two-col">
                <div className="form-row">
                  <label><MapPin size={15} /> City</label>
                  <input type="text" placeholder="e.g. Mumbai" value={formData.city} onChange={e => setFormData(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div className="form-row">
                  <label><Briefcase size={15} /> Role / Designation</label>
                  <input type="text" placeholder="e.g. Delegate" value={formData.role} onChange={e => setFormData(f => ({ ...f, role: e.target.value }))} />
                </div>
              </div>

              <button className="bmm-btn-primary" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating
                  ? <><span className="spinner-ring" /> Generating…</>
                  : '✨ Generate My Frames'}
              </button>
            </motion.div>
          )}

          {/* ── GROUP DP FORM ─────────────────────────────────────── */}
          {step === 'groupForm' && (
            <motion.div key="groupForm" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} className="bmm-card">
              <div className="card-badge">Group DP Generator</div>
              <h2 className="card-title">Enter Group Details</h2>
              <p className="card-desc">Create a custom circular collage DP for your family, group, or local Mandal.</p>

              {/* Group Size Selector */}
              <div className="form-row">
                <label>Group Size</label>
                <div className="segmented-control">
                  {[2, 3, 4].map(count => (
                    <button
                      key={count}
                      type="button"
                      className={`segmented-btn ${groupFormData.memberCount === count ? 'active' : ''}`}
                      onClick={() => setGroupFormData(f => ({ ...f, memberCount: count }))}
                    >
                      {count} Members
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Grid Uploaders */}
              <div className="form-row">
                <label><Upload size={15} /> Member Photos *</label>
                <div className="group-photo-grid">
                  {Array.from({ length: groupFormData.memberCount }).map((_, index) => (
                    <div
                      key={index}
                      className={`group-photo-slot ${groupFormData.photos[index] ? 'has-image' : ''}`}
                      onClick={() => document.getElementById(`group-photo-${index}`).click()}
                    >
                      {groupFormData.photos[index] ? (
                        <img src={groupFormData.photos[index]} alt={`member ${index + 1}`} className="group-photo-thumb" />
                      ) : (
                        <>
                          <Upload size={18} style={{ opacity: 0.5, marginBottom: 4 }} />
                          <span>Member {index + 1}</span>
                        </>
                      )}
                      <input
                        id={`group-photo-${index}`}
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => handleGroupPhotoUpload(e, index)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Group Name & City */}
              <div className="form-row">
                <label><User size={15} /> Group / Mandal Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Seattle Swaravahini"
                  value={groupFormData.groupName}
                  onChange={e => setGroupFormData(f => ({ ...f, groupName: e.target.value }))}
                />
              </div>

              <div className="form-row">
                <label><MapPin size={15} /> City</label>
                <input
                  type="text"
                  placeholder="e.g. Seattle"
                  value={groupFormData.city}
                  onChange={e => setGroupFormData(f => ({ ...f, city: e.target.value }))}
                />
              </div>

              <button className="bmm-btn-primary" onClick={handleGenerateGroup} disabled={isGenerating}>
                {isGenerating
                  ? <><span className="spinner-ring" /> Generating…</>
                  : '✨ Generate Group DP'}
              </button>
            </motion.div>
          )}

          {/* ── PREVIEW ───────────────────────────────────────────── */}
          {step === 'preview' && (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="preview-wrapper">
              <div className="preview-topbar">
                <button className="bmm-btn-ghost" onClick={() => setStep('form')}><ArrowLeft size={16} /> Edit</button>
                <button className="bmm-btn-ghost whatsapp-share" onClick={() => {
                  const text = `🎉 I am attending BMM 2026 Seattle! 6–9 August 2026 | Seattle Convention Center\nजपूया संस्कृती, विणूया नाती!`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}>
                  <Share2 size={16} /> Share on WhatsApp
                </button>
              </div>

              <div className="preview-grid">


                {/* ── CARD 2: Social Media Poster ── */}
                <div className="preview-card">
                  <div className="preview-card-header gold">
                    <span>📣 Social Media Poster</span>
                    <small>For Instagram / Facebook</small>
                  </div>
                  <div className="preview-card-body">
                    <SocialPosterCanvas
                      photo={formData.photo}
                      name={formData.name}
                      role={formData.role}
                      city={formData.city}
                      posterRef={posterCanvasRef}
                    />
                  </div>
                  <div className="preview-card-footer">
                    <button className="bmm-btn-download" onClick={() => downloadCanvas(posterCanvasRef, 'BMM2026_IAmAttending_Poster')}>
                      <Download size={16} /> Download PNG
                    </button>
                  </div>
                </div>

                {/* ── CARD 3: WhatsApp DP ── */}
                <div className="preview-card">
                  <div className="preview-card-header teal">
                    <span>💬 WhatsApp DP</span>
                    <small>Circular crop with BMM ring</small>
                  </div>
                  <div className="preview-card-body">
                    <WhatsAppDPCanvas
                      photo={formData.photo}
                      name={formData.name}
                      gender={formData.gender}
                      dpRef={dpCanvasRef}
                    />
                    <p className="tagline-preview">जपूया संस्कृती, विणूया नाती!</p>
                  </div>
                  <div className="preview-card-footer">
                    <button className="bmm-btn-download" onClick={() => downloadCanvas(dpCanvasRef, 'BMM2026_WhatsApp_DP')}>
                      <Download size={16} /> Download PNG
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ── GROUP DP PREVIEW ──────────────────────────────────── */}
          {step === 'previewGroup' && (
            <motion.div key="previewGroup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="preview-wrapper">
              <div className="preview-topbar">
                <button className="bmm-btn-ghost" onClick={() => setStep('groupForm')}><ArrowLeft size={16} /> Edit</button>
                <button className="bmm-btn-ghost whatsapp-share" onClick={() => {
                  const text = `🎉 Our group is attending BMM 2026 Seattle! 6–9 August 2026 | Seattle Convention Center\nजपूया संस्कृती, विणूया नाती!`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}>
                  <Share2 size={16} /> Share on WhatsApp
                </button>
              </div>

              <div className="preview-grid" style={{ justifyContent: 'center' }}>
                {/* ── CARD: Group DP Collage ── */}
                <div className="preview-card" style={{ maxWidth: '360px', margin: '0 auto' }}>
                  <div className="preview-card-header teal">
                    <span>👥 Group WhatsApp DP</span>
                    <small>{groupFormData.memberCount} Members Collage</small>
                  </div>
                  <div className="preview-card-body">
                    <GroupCollageCanvas
                      photos={groupFormData.photos}
                      memberCount={groupFormData.memberCount}
                      groupName={groupFormData.groupName}
                      city={groupFormData.city}
                      canvasRef={groupDpCanvasRef}
                    />
                    <p className="tagline-preview">जपूया संस्कृती, विणूया नाती!</p>
                  </div>
                  <div className="preview-card-footer">
                    <button className="bmm-btn-download" onClick={() => downloadCanvas(groupDpCanvasRef, 'BMM2026_Group_DP')}>
                      <Download size={16} /> Download PNG
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── ADMIN ─────────────────────────────────────────────── */}
          {step === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="bmm-card wide">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 className="card-title" style={{ marginBottom: 0 }}>Registration Database</h2>
                <button className="bmm-btn-ghost" onClick={() => {
                  const csv = [
                    ['ID', 'Name', 'City', 'Role', 'Date'],
                    ...registrations.map(r => [r.id, r.name, r.city, r.role, r.date])
                  ].map(e => e.join(',')).join('\n');
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                  a.download = 'BMM2026_Registrations.csv';
                  a.click();
                }}>Export CSV</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>Photo</th><th>Name</th><th>City</th><th>Role</th><th>Date</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.length === 0
                      ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>No entries yet.</td></tr>
                      : registrations.map(reg => (
                          <tr key={reg.id}>
                            <td className="mono">{reg.id}</td>
                            <td><img src={reg.photo} alt={reg.name} className="admin-avatar" /></td>
                            <td><strong>{reg.name}</strong></td>
                            <td>{reg.city}</td>
                            <td>{reg.role}</td>
                            <td>{reg.date}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button className="admin-action view" onClick={() => {
                                  if (reg.isGroup) {
                                    setGroupFormData(reg.groupData);
                                    setStep('previewGroup');
                                  } else {
                                    setFormData(reg);
                                    setStep('preview');
                                  }
                                }}>View</button>
                                <button className="admin-action del" onClick={() => deleteRegistration(reg.id)}><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <footer className="bmm-footer">
        <p>
          जपूया संस्कृती, विणूया नाती! &nbsp;·&nbsp; BMM 2026 Seattle &nbsp;·&nbsp; 6–9 August 2026
          {!user && !forceAdmin && (
            <>
              &nbsp;·&nbsp; 
              <span 
                style={{ cursor: 'pointer', opacity: 0.6, fontSize: '0.9em' }} 
                onClick={() => navigate('/admin/login')}
              >
                Admin
              </span>
            </>
          )}
        </p>
      </footer>
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<PublicApp />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/*" element={
        <ProtectedRoute>
          <PublicApp forceAdmin={true} />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
