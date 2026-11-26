const WIDTH = 1080;
const HEIGHT = 1350;
const GOLD = "#ffc831";
const DARK = "#131313";
const CARD = "#1e1e1e";
const LIGHT = "#ffffff";
const MUTED = "#cccccc";
const FONT = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const loadImage = (src) =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function fitText(ctx, text, maxWidth, size, weight) {
  let current = size;
  ctx.font = `${weight} ${current}px ${FONT}`;
  while (ctx.measureText(text).width > maxWidth && current > 24) {
    current -= 2;
    ctx.font = `${weight} ${current}px ${FONT}`;
  }
}

async function drawCard({ periodLabel, stats }) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = DARK;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = "rgba(255, 200, 49, 0.06)";
  ctx.lineWidth = 2;
  for (let offset = -HEIGHT; offset < WIDTH; offset += 60) {
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset + HEIGHT, HEIGHT);
    ctx.stroke();
  }

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 6;
  roundedRect(ctx, 40, 40, WIDTH - 80, HEIGHT - 80, 36);
  ctx.stroke();

  const logo = await loadImage("/images/LogoHomePage-removebg.png");
  if (logo) {
    const size = 230;
    ctx.drawImage(logo, (WIDTH - size) / 2, 95, size, size);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = GOLD;
  ctx.font = `800 72px ${FONT}`;
  ctx.fillText("Cráneo Barbero", WIDTH / 2, 410);
  ctx.fillStyle = MUTED;
  fitText(ctx, periodLabel, WIDTH - 200, 40, 500);
  ctx.fillText(periodLabel, WIDTH / 2, 470);

  ctx.fillStyle = GOLD;
  roundedRect(ctx, WIDTH / 2 - 90, 505, 180, 6, 3);
  ctx.fill();

  stats.forEach((stat, index) => {
    const top = 560 + index * 205;
    ctx.fillStyle = CARD;
    roundedRect(ctx, 110, top, WIDTH - 220, 175, 28);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 200, 49, 0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = GOLD;
    fitText(ctx, stat.value, WIDTH - 300, 70, 800);
    ctx.fillText(stat.value, WIDTH / 2, top + 88);
    ctx.fillStyle = LIGHT;
    fitText(ctx, stat.label, WIDTH - 300, 36, 500);
    ctx.fillText(stat.label, WIDTH / 2, top + 140);
  });

  ctx.fillStyle = MUTED;
  ctx.font = `500 36px ${FONT}`;
  ctx.fillText("¡Gracias por elegirnos!", WIDTH / 2, HEIGHT - 110);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export async function shareSummaryImage({ periodLabel, stats, fileName }) {
  const blob = await drawCard({ periodLabel, stats });
  if (!blob) throw new Error("No se pudo generar la imagen.");
  const file = new File([blob], fileName, { type: "image/png" });
  const touch = window.matchMedia?.("(pointer: coarse)").matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (err) {
      if (err?.name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
