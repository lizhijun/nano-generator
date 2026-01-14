const sharp = require('sharp');
const path = require('path');

const outputDir = path.join(__dirname, 'images');

// 主背景：深色渐变
async function createMainBackground() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="810">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#181B24"/>
        <stop offset="50%" style="stop-color:#1a1f2e"/>
        <stop offset="100%" style="stop-color:#181B24"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
  </svg>`;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(outputDir, 'bg-main.png'));
  console.log('Created: bg-main.png');
}

// 章节页背景：带紫色渐变
async function createSectionBackground() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="810">
    <defs>
      <linearGradient id="section" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#181B24"/>
        <stop offset="40%" style="stop-color:#2a1f3d"/>
        <stop offset="100%" style="stop-color:#181B24"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#section)"/>
  </svg>`;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(outputDir, 'bg-section.png'));
  console.log('Created: bg-section.png');
}

// 封面背景：更强的紫色渐变
async function createCoverBackground() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="810">
    <defs>
      <linearGradient id="cover" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#181B24"/>
        <stop offset="30%" style="stop-color:#2d1f4a"/>
        <stop offset="70%" style="stop-color:#1f3d3d"/>
        <stop offset="100%" style="stop-color:#181B24"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#cover)"/>
  </svg>`;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(outputDir, 'bg-cover.png'));
  console.log('Created: bg-cover.png');
}

async function main() {
  await createMainBackground();
  await createSectionBackground();
  await createCoverBackground();
  console.log('All backgrounds generated!');
}

main().catch(console.error);
