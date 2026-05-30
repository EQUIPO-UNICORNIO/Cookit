import { useEffect, useRef } from 'react';

const FOODS = [
  { draw: drawApple, size: 70, name: 'apple' },
  { draw: drawCarrot, size: 65, name: 'carrot' },
  { draw: drawSteak, size: 75, name: 'steak' },
  { draw: drawBroccoli, size: 68, name: 'broccoli' },
  { draw: drawOrange, size: 66, name: 'orange' },
  { draw: drawEgg, size: 60, name: 'egg' },
  { draw: drawBanana, size: 80, name: 'banana' },
  { draw: drawWatermelon, size: 72, name: 'watermelon' },
];

function drawFace(ctx, x, y, size) {
  const s = size / 30;
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(x - size * 0.2, y - size * 0.1, s * 1.1, 0, Math.PI * 2);
  ctx.arc(x + size * 0.2, y - size * 0.1, s * 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(x - size * 0.2, y - size * 0.1, s * 0.55, 0, Math.PI * 2);
  ctx.arc(x + size * 0.2, y - size * 0.1, s * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(x - size * 0.2, y - size * 0.1, s * 0.3, 0, Math.PI * 2);
  ctx.arc(x + size * 0.2, y - size * 0.1, s * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = s * 0.4;
  ctx.beginPath();
  ctx.arc(x, y + size * 0.05, size * 0.2, 0, Math.PI);
  ctx.stroke();
  ctx.fillStyle = 'white';
  for (let i = -1; i <= 1; i++) {
    ctx.fillRect(x + i * size * 0.09 - s * 0.2, y + size * 0.05 - s * 0.15, s * 0.4, s * 0.4);
  }
}

function drawApple(ctx, x, y, size) {
  const r = size * 0.45;
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.arc(x, y + r * 0.1, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.arc(x - r * 0.2, y - r * 0.15, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5d4037';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - r + 5);
  ctx.quadraticCurveTo(x + 8, y - r - 15, x + 3, y - r - 22);
  ctx.stroke();
  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.ellipse(x + 4, y - r - 22, 6, 9, -0.2, 0, Math.PI * 2);
  ctx.fill();
  drawFace(ctx, x, y + r * 0.05, size);
}

function drawCarrot(ctx, x, y, size) {
  const h = size * 0.8;
  const w = size * 0.35;
  ctx.fillStyle = '#ff6f00';
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.5);
  ctx.lineTo(x - w, y - h * 0.5);
  ctx.lineTo(x + w, y - h * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e65100';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x - w + i * w * 0.6, y - h * 0.3 + i * h * 0.2);
    ctx.lineTo(x + w - i * w * 0.6, y - h * 0.3 + i * h * 0.2);
    ctx.stroke();
  }
  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.ellipse(x, y - h * 0.55, 12, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x - 6, y - h * 0.6, 8, 12, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 6, y - h * 0.6, 8, 12, 0.3, 0, Math.PI * 2);
  ctx.fill();
  drawFace(ctx, x, y - h * 0.05, size);
}

function drawSteak(ctx, x, y, size) {
  const w = size * 0.55;
  const h = size * 0.4;
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
  ctx.arc(x - w * 0.5, y - h * 0.15, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - w * 0.45, y + h * 0.1, 3, 0, Math.PI * 2);
  ctx.fill();
  drawFace(ctx, x, y + h * 0.05, size);
}

function drawBroccoli(ctx, x, y, size) {
  const r = size * 0.35;
  ctx.fillStyle = '#388e3c';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(x + i * r * 0.7, y - r * 0.3, r * 0.65, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x, y - r * 0.6, r * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.arc(x - r * 0.5, y - r * 0.5, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + r * 0.5, y - r * 0.5, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.arc(x, y - r * 0.8, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(x - 4, y + r * 0.2, 8, size * 0.3);
  drawFace(ctx, x, y + r * 0.05, size);
}

function drawOrange(ctx, x, y, size) {
  const r = size * 0.42;
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
  ctx.ellipse(x, y - r + 2, 5, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  drawFace(ctx, x, y + r * 0.05, size);
}

function drawEgg(ctx, x, y, size) {
  const r = size * 0.38;
  ctx.fillStyle = '#fff8e1';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.15, r * 0.8, r * 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffe0b2';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.15, r * 0.8, r * 1.1, 0, 0, Math.PI * 2);
  ctx.stroke();
  drawFace(ctx, x, y + r * 0.1, size);
}

function drawBanana(ctx, x, y, size) {
  const w = size * 0.55;
  const h = size * 0.35;
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
  ctx.ellipse(x + w * 0.4, y - h * 0.05, 4, 6, 0.2, 0, Math.PI * 2);
  ctx.fill();
  drawFace(ctx, x - w * 0.05, y + h * 0.05, size);
}

function drawWatermelon(ctx, x, y, size) {
  const r = size * 0.42;
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
    ctx.arc(x - r * 0.35 + i * r * 0.23, y + r * 0.35, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#388e3c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.15 - r);
  ctx.lineTo(x, y + r * 0.15 - r - 8);
  ctx.stroke();
  drawFace(ctx, x, y + r * 0.15, size);
}

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
      for (let i = 0; i < 16; i++) {
        const food = FOODS[i % FOODS.length];
        chars.push({
          food,
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: 0.5 + Math.random() * 0.5,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6 - 0.3,
          rotation: 0,
          rotSpeed: (Math.random() - 0.5) * 0.02,
          phase: Math.random() * Math.PI * 2,
        });
      }
      charsRef.current = chars;
    };

    resize();
    initChars();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const chars = charsRef.current;

      chars.sort((a, b) => a.z - b.z);

      for (const c of chars) {
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.002;
        c.rotation += c.rotSpeed;

        if (c.y > canvas.height + 100) {
          c.y = -100;
          c.x = Math.random() * canvas.width;
        }
        if (c.x < -100) c.x = canvas.width + 100;
        if (c.x > canvas.width + 100) c.x = -100;

        const scale = 0.5 + c.z * 0.8;
        const size = c.food.size * scale;
        const alpha = 0.25 + c.z * 0.35;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation + Math.sin(c.phase + Date.now() * 0.001) * 0.05);
        ctx.scale(scale, scale);
        c.food.draw(ctx, 0, 0, c.food.size);
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
