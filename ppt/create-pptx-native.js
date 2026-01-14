const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

// 复制 html2pptx 库
const html2pptxPath = '/Users/leo/.codebuddy/skills/pptx/scripts/html2pptx.js';
const html2pptx = require(html2pptxPath);

const slidesDir = path.join(__dirname, 'slides');
const outputFile = path.join(__dirname, '开源大模型私有化训练方案深度对比.pptx');

// 颜色定义（不带 # 号）
const COLORS = {
  purple: 'B165FB',
  darkBg: '181B24',
  emerald: '40695B',
  white: 'FFFFFF',
  gray: '888888',
  lightGray: 'E0E0E0',
  cardBg: '1e2235'
};

async function addComparisonTable(slide, pres) {
  // 六种方案对比表
  const headerRow = [
    { text: '方案', options: { bold: true, color: COLORS.white, fill: { color: COLORS.purple }, align: 'center' } },
    { text: '数据量需求', options: { bold: true, color: COLORS.white, fill: { color: COLORS.purple }, align: 'center' } },
    { text: '显存/算力', options: { bold: true, color: COLORS.white, fill: { color: COLORS.purple }, align: 'center' } },
    { text: '灵活性', options: { bold: true, color: COLORS.white, fill: { color: COLORS.purple }, align: 'center' } },
    { text: '适用场景', options: { bold: true, color: COLORS.white, fill: { color: COLORS.purple }, align: 'center' } }
  ];
  
  const dataRows = [
    ['全量微调', '高', '高', '高', '高度定制领域模型'],
    ['LoRA/PEFT', '中', '中低', '中', '企业知识注入、指令适应'],
    ['指令微调', '低中', '中', '高', '对话、任务型助手'],
    ['Prompt Tuning', '低', '低', '低', '小任务或固定任务'],
    ['RLHF', '高', '高', '高', '高质量生成、对话'],
    ['RAG', '高(无需训练)', '低', '高', '知识库问答、企业助手']
  ];

  const tableData = [headerRow, ...dataRows];

  slide.addTable(tableData, {
    x: 0.35,
    y: 1.1,
    w: 9.3,
    colW: [1.3, 1.4, 1.2, 0.9, 4.5],
    rowH: 0.42,
    border: { pt: 0.5, color: '444444' },
    fill: { color: COLORS.cardBg },
    color: COLORS.lightGray,
    fontSize: 11,
    fontFace: 'Arial',
    align: 'center',
    valign: 'middle'
  });
}

async function main() {
  console.log('Starting native PPT generation...\n');
  
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.title = '开源大模型私有化训练方案深度对比';
  pres.author = 'NanoBananaPro';
  
  // 获取所有幻灯片文件
  const slideFiles = fs.readdirSync(slidesDir)
    .filter(f => f.endsWith('.html'))
    .sort();
  
  console.log(`Found ${slideFiles.length} slides to process...\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < slideFiles.length; i++) {
    const file = slideFiles[i];
    const filePath = path.join(slidesDir, file);
    
    try {
      console.log(`[${i + 1}/${slideFiles.length}] Processing ${file}...`);
      
      const { slide, placeholders } = await html2pptx(filePath, pres);
      
      // 对比表格页添加原生表格
      if (file === 'slide23.html') {
        addComparisonTable(slide, pres);
      }
      
      successCount++;
      console.log(`    ✓ Success`);
    } catch (error) {
      errorCount++;
      console.log(`    ✗ Error: ${error.message}`);
    }
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${successCount} success, ${errorCount} errors`);
  
  if (successCount > 0) {
    // 保存文件
    await pres.writeFile({ fileName: outputFile });
    console.log(`\nPPT saved to: ${outputFile}`);
  }
}

main().catch(console.error);
