const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

// 配置参数
const inputDir = path.resolve(__dirname, './docs');
const outputDir = path.resolve(__dirname, './output');
const qrImagePath = path.resolve(__dirname, './cc100-qrcode.jpg'); // 二维码路径

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 给PDF添加二维码
async function addQrToPdf(pdfPath, imagePath, outputPath) {
  const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
  
    const imgBytes = fs.readFileSync(imagePath);
    const image = await pdfDoc.embedJpg(imgBytes); // 如果是png则改成 embedPng
  
    const pages = pdfDoc.getPages();
    console.log('pages', image)
    pages.forEach(page => {
      const { width, height } = page.getSize();
      const imgWidth = 30;  // 二维码宽度
      const imgHeight = 30; // 二维码高度
      const x = width - imgWidth - 20; // 右边距
      const y = height - imgHeight - 20; // 上边距
      page.drawImage(image, {
        x,
        y,
        width: imgWidth,
        height: imgHeight,
      });
    });
  
    const modifiedPdf = await pdfDoc.save();
    fs.writeFileSync(outputPath, modifiedPdf);
}

// 处理单个PDF
async function processPdf(filePath) {
  const name = path.basename(filePath, '.pdf');
  const outPdfPath = path.join(outputDir, `${name}.pdf`);

  try {
    console.log(`📄 开始处理: ${name}.pdf`);
    await addQrToPdf(filePath, qrImagePath, outPdfPath);
    console.log(`✅ 处理成功: ${name}.pdf`);
    return true;
  } catch (err) {
    console.error(`❌ 处理失败: ${name}.pdf`, err.message);
    return false;
  }
}

// 批量处理
async function runBatch() {
  const files = fs.readdirSync(inputDir)
    .filter(file => file.toLowerCase().endsWith('.pdf'))
    .map(file => path.join(inputDir, file));

  if (files.length === 0) {
    console.log('⚠️ 未找到任何PDF文件');
    return;
  }

  console.log(`发现 ${files.length} 个PDF文件，开始处理...`);

  let successCount = 0;
  for (const file of files) {
    const result = await processPdf(file);
    if (result) successCount++;
  }

  console.log('\n处理结果:');
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失败: ${files.length - successCount}`);
  console.log('🎉 处理完成！输出目录:', outputDir);
}

// 启动
runBatch().catch(err => {
  console.error('程序运行出错:', err);
  process.exit(1);
});
