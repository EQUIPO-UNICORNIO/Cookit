import { useEffect, useRef } from 'react';

const FOODS = [
  { draw: drawApple, name: 'apple' },
  { draw: drawCarrot, name: 'carrot' },
  { draw: drawSteak, name: 'steak' },
  { draw: drawBroccoli, name: 'broccoli' },
  { draw: drawOrange, name: 'orange' },
  { draw: drawEgg, name: 'egg' },
  { draw: drawBanana, name: 'banana' },
  { draw: drawWatermelon, name: 'watermelon' },
];

function drawFace(ctx, x, y, s) {
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(x - s * 0.18, y - s * 0.08, s * 0.045, 0, Math.PI * 2);
  ctx.arc(x + s * 0.18, y - s * 0.08, s * 0.045, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(x - s * 0.18, y - s * 0.08, s * 0.022, 0, Math.PI * 2);
  ctx.arc(x + s * 0.18, y - s * 0.08, s * 0.022, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(x - s * 0.18, y - s * 0.08, s * 0.012, 0, Math.PI * 2);
  ctx.arc(x + s * 0.18, y - s * 0.08, s * 0.012, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  for (let i = -1; i <= 1; i++) {
    ctx.fillRect(x + i * s * 0.08 - s * 0.01, y + s * 0.04 - s * 0.008, s * 0.02, s * 0.025);
  }
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = s * 0.015;
  ctx.beginPath();
  ctx.arc(x, y + s * 0.025, s * 0.13, 0, Math.PI);
  ctx.stroke();
}

function drawShadow(ctx, x, y, s) {
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(x, y + s * 0.75, s * 0.35, s * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawLimb(ctx, x1, y1, length, angle, color, thickness) {
  const x2 = x1 + Math.cos(angle) * length;
  const y2 = y1 + Math.sin(angle) * length;
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  return { x: x2, y: y2 };
}

function drawRoundHand(ctx, x, y, color, r) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawFoot(ctx, x, y, color, s) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.06, s * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();
}

function withLimbs(foodDrawFn, bodyColor, limbColor, bodyOffsetY) {
  return (ctx, x, y, s, t) => {
    const bodyY = y + (bodyOffsetY || 0) * s;
    const walk = Math.sin(t * 2.5) * 0.3;
    const armSwing = Math.sin(t * 2.5) * 0.4;
    const legSwing = Math.sin(t * 2.5) * 0.35;

    drawShadow(ctx, x, bodyY, s);

    const armLen = s * 0.38;
    const legLen = s * 0.4;
    const thick = s * 0.045;
    const armY = bodyY - s * 0.2;
    const legY = bodyY + s * 0.28;

    drawLimb(ctx, x - s * 0.25, armY, armLen, Math.PI * 0.5 + armSwing, limbColor, thick);
    const lh = drawLimb(ctx, x + s * 0.25, armY, armLen, Math.PI * 0.5 - armSwing, limbColor, thick);
    drawRoundHand(ctx, lh.x, lh.y, limbColor, thick * 0.8);

    drawLimb(ctx, x - s * 0.12, legY, legLen, Math.PI * 0.5 + walk, limbColor, thick);
    const lFoot = drawLimb(ctx, x + s * 0.12, legY, legLen, Math.PI * 0.5 - walk, limbColor, thick);
    drawFoot(ctx, lFoot.x, lFoot.y, limbColor, s);

    ctx.save();
    ctx.translate(x, bodyY);
    foodDrawFn(ctx, 0, 0, s);
    drawFace(ctx, 0, -s * 0.05, s);
    ctx.restore();
  };
}

const s = (size) => size;

const drawAppleBody = (ctx, x, y, size) => {
  const r = size * 0.26;
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.arc(x, y + r * 0.1, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.arc(x - r * 0.2, y - r * 0.15, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5d4037';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - r + 3);
  ctx.quadraticCurveTo(x + 5, y - r - 10, x + 2, y - r - 15);
  ctx.stroke();
  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.ellipse(x + 3, y - r - 15, 4, 6, -0.2, 0, Math.PI * 2);
  ctx.fill();
};

const drawCarrotBody = (ctx, x, y, size) => {
  const h = size * 0.5;
  const w = size * 0.2;
  ctx.fillStyle = '#ff6f00';
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.5);
  ctx.lineTo(x - w, y - h * 0.5);
  ctx.lineTo(x + w, y - h * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e65100';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x - w + i * w * 0.6, y - h * 0.3 + i * h * 0.2);
    ctx.lineTo(x + w - i * w * 0.6, y - h * 0.3 + i * h * 0.2);
    ctx.stroke();
  }
  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.ellipse(x, y - h * 0.55, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x - 4, y - h * 0.6, 5, 8, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 4, y - h * 0.6, 5, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
};

const drawSteakBody = (ctx, x, y, size) => {
  const w = size * 0.32;
  const h = size * 0.24;
  ctx.fillStyle = '#8d6e63';
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a1887f';
  ctx.beginPath();
  ctx.ellipse(x - w * 0.15, y - h * 0.1, w * 0.35, h * 0.5, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#efebe9';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.1, y - h * 0.05, w * 0.25, h * 0.35, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6d4c41';
  ctx.beginPath();
  ctx.arc(x - w * 0.5, y - h * 0.15, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - w * 0.45, y + h * 0.1, 2, 0, Math.PI * 2);
  ctx.fill();
};

const drawBroccoliBody = (ctx, x, y, size) => {
  const r = size * 0.2;
  const colors = ['#388e3c', '#2e7d32', '#43a047', '#4caf50'];
  for (let i = -1; i <= 1; i++) {
    ctx.fillStyle = colors[i + 1];
    ctx.beginPath();
    ctx.arc(x + i * r * 0.7, y - r * 0.3, r * 0.65, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = colors[3];
  ctx.beginPath();
  ctx.arc(x, y - r * 0.6, r * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(x - 3, y + r * 0.15, 6, size * 0.18);
};

const drawOrangeBody = (ctx, x, y, size) => {
  const r = size * 0.25;
  ctx.fillStyle = '#ff9800';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f57c00';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.25, r * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.ellipse(x, y - r + 2, 3, 5, 0, 0, Math.PI * 2);
  ctx.fill();
};

const drawEggBody = (ctx, x, y, size) => {
  const r = size * 0.22;
  ctx.fillStyle = '#fff8e1';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.15, r * 0.8, r * 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffe0b2';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.15, r * 0.8, r * 1.1, 0, 0, Math.PI * 2);
  ctx.stroke();
};

const drawBananaBody = (ctx, x, y, size) => {
  const w = size * 0.32;
  const h = size * 0.2;
  ctx.fillStyle = '#fdd835';
  ctx.beginPath();
  ctx.ellipse(x - w * 0.15, y, w, h, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f9a825';
  ctx.beginPath();
  ctx.ellipse(x - w * 0.25, y - h * 0.15, w * 0.3, h * 0.6, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#795548';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.4, y - h * 0.05, 3, 4, 0.2, 0, Math.PI * 2);
  ctx.fill();
};

const drawWatermelonBody = (ctx, x, y, size) => {
  const r = size * 0.25;
  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.arc(x, y + r * 0.15, r, Math.PI * 0.05, Math.PI * 0.95);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e53935';
  ctx.beginPath();
  ctx.arc(x, y + r * 0.1, r * 0.75, Math.PI * 0.15, Math.PI * 0.85);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(x - r * 0.35 + i * r * 0.23, y + r * 0.35, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#388e3c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.15 - r);
  ctx.lineTo(x, y + r * 0.15 - r - 6);
  ctx.stroke();
};

const drawApple = withLimbs(drawAppleBody, '#e74c3c', '#a0522d', 0.08);
const drawCarrot = withLimbs(drawCarrotBody, '#ff6f00', '#bf5b00', 0.08);
const drawSteak = withLimbs(drawSteakBody, '#8d6e63', '#6d4c41', 0.04);
const drawBroccoli = withLimbs(drawBroccoliBody, '#388e3c', '#2e7d32', 0.06);
const drawOrange = withLimbs(drawOrangeBody, '#ff9800', '#bf6a00', 0.04);
const drawEgg = withLimbs(drawEggBody, '#fff8e1', '#d7ccc8', 0.06);
const drawBanana = withLimbs(drawBananaBody, '#fdd835', '#b8860b', 0.04);
const drawWatermelon = withLimbs(drawWatermelonBody, '#4caf50', '#2e7d32', 0.06);

export default function FloatingFoodAnimation() {
  const canvasRef = useRef(null);
  const charsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initChars = () => {
      const chars = [];
      for (let i = 0; i < 14; i++) {
        const food = FOODS[i % FOODS.length];
        chars.push({
          food,
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: 0.5 + Math.random() * 0.5,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          phase: Math.random() * Math.PI * 2,
          time: Math.random() * 10,
        });
      }
      charsRef.current = chars;
    };

    resize();
    initChars();

    const animate = (now) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const chars = charsRef.current;
      const t = now * 0.001;

      for (const c of chars) {
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.001;
        c.time += 0.016;

        if (c.y > canvas.height + 120) {
          c.y = -120;
          c.x = Math.random() * canvas.width;
        }
        if (c.x < -120) c.x = canvas.width + 120;
        if (c.x > canvas.width + 120) c.x = -120;

        const scale = 0.5 + c.z * 0.7;
        const size = 80 * scale;
        const alpha = 0.3 + c.z * 0.3;
        const bobY = Math.sin(t * 1.2 + c.phase) * 6 * scale;
        const wobble = Math.sin(t * 0.6 + c.phase) * 0.04;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(c.x, c.y + bobY);
        ctx.rotate(wobble);
        ctx.scale(scale, scale);
        c.food.draw(ctx, 0, 0, 80, c.time + c.phase);
        ctx.restore();
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
