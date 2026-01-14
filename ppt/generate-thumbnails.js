const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const slidesDir = path.join(__dirname, 'slides');
const outputFile = path.join(__dirname, 'thumbnails.jpg');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 960, height: 540 });
  
  const slideFiles = fs.readdirSync(slidesDir)
    .filter(f => f.endsWith('.html'))
    .sort();
  
  console.log(`Generating thumbnails for ${slideFiles.length} slides...`);
  
  const thumbnails = [];
  const thumbWidth = 320;
  const thumbHeight = 180;
  
  for (const file of slideFiles) {
    const htmlPath = path.join(slidesDir, file);
    await page.goto(`file://${htmlPath}`);
    await page.waitForLoadState('networkidle');
    
    const screenshot = await page.screenshot({ type: 'png' });
    const resized = await sharp(screenshot)
      .resize(thumbWidth, thumbHeight)
      .toBuffer();
    
    thumbnails.push(resized);
    console.log(`Captured: ${file}`);
  }
  
  await browser.close();
  
  // 创建网格：5列6行
  const cols = 5;
  const rows = Math.ceil(slideFiles.length / cols);
  const padding = 10;
  const labelHeight = 20;
  
  const gridWidth = cols * thumbWidth + (cols + 1) * padding;
  const gridHeight = rows * (thumbHeight + labelHeight) + (rows + 1) * padding;
  
  // 创建背景
  const composites = [];
  
  for (let i = 0; i < thumbnails.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = padding + col * (thumbWidth + padding);
    const y = padding + row * (thumbHeight + labelHeight + padding);
    
    composites.push({
      input: thumbnails[i],
      left: x,
      top: y
    });
  }
  
  // 生成网格图
  await sharp({
    create: {
      width: gridWidth,
      height: gridHeight,
      channels: 3,
      background: { r: 24, g: 27, b: 36 }
    }
  })
  .composite(composites)
  .jpeg({ quality: 90 })
  .toFile(outputFile);
  
  console.log(`\nThumbnail grid saved to: ${outputFile}`);
  console.log(`Grid size: ${gridWidth}x${gridHeight}`);
}

main().catch(console.error);
