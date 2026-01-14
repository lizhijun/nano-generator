const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

// Import html2pptx from local copy
const html2pptx = require('./html2pptx');

async function createPresentation() {
  const pptx = new pptxgen();
  
  // Set presentation properties
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = '开源大模型私有化训练方案深度对比';
  pptx.author = 'NanoBananaPro Team';
  pptx.subject = 'LoRA微调与模型优化方案对比';
  
  const slidesDir = path.join(__dirname, 'slides');
  const slideFiles = fs.readdirSync(slidesDir)
    .filter(f => f.endsWith('.html'))
    .sort();
  
  console.log(`Found ${slideFiles.length} slide files`);
  
  for (let i = 0; i < slideFiles.length; i++) {
    const slideFile = slideFiles[i];
    const slidePath = path.join(slidesDir, slideFile);
    
    console.log(`Processing ${slideFile}...`);
    
    try {
      const { slide, placeholders } = await html2pptx(slidePath, pptx, {
        tmpDir: path.join(__dirname, 'tmp')
      });
      console.log(`  ✓ Slide ${i + 1} created`);
    } catch (error) {
      console.error(`  ✗ Error in ${slideFile}:`, error.message);
      // Continue with next slide
    }
  }
  
  // Save presentation
  const outputPath = path.join(__dirname, '开源大模型私有化训练方案深度对比.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log(`\nPresentation saved to: ${outputPath}`);
}

createPresentation().catch(console.error);
