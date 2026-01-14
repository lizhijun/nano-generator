const pptxgen = require('pptxgenjs');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const slidesDir = path.join(__dirname, 'slides');
const outputFile = path.join(__dirname, '开源大模型私有化训练方案深度对比.pptx');

// 将 pt 转换为英寸 (PowerPoint 使用英寸)
const PT_TO_INCH = 1 / 72;

// 颜色（不带 # 号）
const COLORS = {
  purple: 'B165FB',
  darkBg: '181B24',
  emerald: '40695B',
  white: 'FFFFFF',
  gray: '888888',
  lightGray: 'E0E0E0',
  cardBg: '1e2235'
};

async function html2pptx(htmlFile, pres, browser) {
  const page = await browser.newPage();
  const htmlPath = path.join(slidesDir, htmlFile);
  
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto(`file://${htmlPath}`);
  await page.waitForLoadState('networkidle');
  
  // 截图作为幻灯片背景
  const screenshot = await page.screenshot({ type: 'png' });
  const imgBase64 = screenshot.toString('base64');
  
  const slide = pres.addSlide();
  slide.addImage({
    data: `image/png;base64,${imgBase64}`,
    x: 0,
    y: 0,
    w: 10,
    h: 5.625,
    sizing: { type: 'cover', w: 10, h: 5.625 }
  });
  
  await page.close();
  return slide;
}

async function addComparisonTable(slide) {
  // 六种方案对比表
  const tableData = [
    [
      { text: '方案', options: { bold: true, color: COLORS.white, fill: { color: COLORS.purple } } },
      { text: '数据量需求', options: { bold: true, color: COLORS.white, fill: { color: COLORS.purple } } },
      { text: '显存/算力', options: { bold: true, color: COLORS.white, fill: { color: COLORS.purple } } },
      { text: '灵活性', options: { bold: true, color: COLORS.white, fill: { color: COLORS.purple } } },
      { text: '适用场景', options: { bold: true, color: COLORS.white, fill: { color: COLORS.purple } } }
    ],
    ['全量微调', '高', '高', '高', '高度定制领域模型'],
    ['LoRA/PEFT', '中', '中低', '中', '企业知识注入、指令适应'],
    ['指令微调', '低中', '中', '高', '对话、任务型助手'],
    ['Prompt Tuning', '低', '低', '低', '小任务或固定任务'],
    ['RLHF', '高', '高', '高', '高质量生成、对话'],
    ['RAG', '高(无需训练)', '低', '高', '知识库问答、企业助手']
  ];

  slide.addTable(tableData, {
    x: 0.4,
    y: 1.2,
    w: 9.2,
    colW: [1.3, 1.4, 1.3, 1.0, 4.2],
    rowH: 0.45,
    border: { pt: 0.5, color: '333333' },
    fill: { color: COLORS.cardBg },
    color: COLORS.lightGray,
    fontSize: 11,
    fontFace: 'Arial',
    align: 'center',
    valign: 'middle'
  });
}

async function main() {
  console.log('Starting PPT generation...');
  
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.title = '开源大模型私有化训练方案深度对比';
  pres.author = 'NanoBananaPro';
  
  const browser = await chromium.launch({ headless: true });
  
  // 获取所有幻灯片文件
  const slideFiles = fs.readdirSync(slidesDir)
    .filter(f => f.endsWith('.html'))
    .sort();
  
  console.log(`Found ${slideFiles.length} slides to process...`);
  
  for (let i = 0; i < slideFiles.length; i++) {
    const file = slideFiles[i];
    console.log(`Processing ${file}...`);
    
    const slide = await html2pptx(file, pres, browser);
    
    // 对比表格页添加表格
    if (file === 'slide23.html') {
      addComparisonTable(slide);
    }
  }
  
  await browser.close();
  
  // 保存文件
  await pres.writeFile({ fileName: outputFile });
  console.log(`\nPPT saved to: ${outputFile}`);
}

main().catch(console.error);
