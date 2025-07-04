const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const libre = require('libreoffice-convert');
const { execSync } = require('child_process');

// 配置参数
const inputDir = path.resolve(__dirname, './docs');
const outputDir = path.resolve(__dirname, './output');
const footerText = '© 2025 100分冲刺 / 天天练MAX ycy88.com';

// 检查LibreOffice是否可用
function checkLibreOffice() {
  try {
    execSync('soffice --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 自定义Promise化的convert函数
libre.convertAsync = function(buffer, ext) {
  return new Promise((resolve, reject) => {
    libre.convert(buffer, ext, undefined, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// 更新DOCX页脚
// 更新DOCX页脚 - 完全替换所有内容
function updateDocxFooter(buffer, footerText) {
    try {
      const zip = new PizZip(buffer);
      const footerFiles = zip.file(/word\/footer\d+\.xml/);
  
      footerFiles.forEach(file => {
        // 完全替换整个页脚内容
        const newFooter = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Footer"/>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:t>${footerText}</w:t>
      </w:r>
    </w:p>
  </w:ftr>`;
        
        zip.file(file.name, newFooter);
      });
  
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });
  
      return doc.getZip().generate({ type: 'nodebuffer' });
    } catch (err) {
      throw new Error(`页脚更新失败: ${err.message}`);
    }
  }

  // 将DOC转为DOCX
  async function convertDocToDocx(docPath) {
    const docxPath = path.join(outputDir, `${path.basename(docPath, '.doc')}.docx`);
    try {
      await execSync(`soffice --convert-to docx --outdir "${outputDir}" "${docPath}"`);
      return docxPath;
    } catch (err) {
      throw new Error(`DOC转DOCX失败: ${err.message}`);
    }
  }
// 处理单个文件
async function processFile(filePath) {
  const ext = path.extname(filePath);
  const name = path.basename(filePath, ext);
  
  try {
    console.log(`📄 开始处理: ${name}${ext}`);

     let docxBuffer;
        if (ext === '.doc') {
          // 先转换DOC为DOCX
          const docxPath = await convertDocToDocx(filePath);
          docxBuffer = fs.readFileSync(docxPath);
        } else {
          docxBuffer = fs.readFileSync(filePath);
        }

         const modifiedDocx = updateDocxFooter(docxBuffer, footerText);
            
            const outDocxPath = path.join(outputDir, `${name}.docx`);
            fs.writeFileSync(outDocxPath, modifiedDocx);
            
            const outPdfPath = path.join(outputDir, `${name}.pdf`);
            const pdfBuffer = await libre.convertAsync(modifiedDocx, 'pdf');
            fs.writeFileSync(outPdfPath, pdfBuffer);
            
            console.log(`✅ 处理成功: ${name}.pdf`);
    
    // // 读取和修改文档
    // const inputBuffer = fs.readFileSync(filePath);
    // const modifiedDocx = updateDocxFooter(inputBuffer, footerText);
    
    // // 保存修改后的DOCX
    // const outDocxPath = path.join(outputDir, `${name}.docx`);
    // fs.writeFileSync(outDocxPath, modifiedDocx);
    
    // // 转换为PDF
    // const outPdfPath = path.join(outputDir, `${name}.pdf`);
    // const pdfBuffer = await libre.convertAsync(modifiedDocx, 'pdf');
    // fs.writeFileSync(outPdfPath, pdfBuffer);
    
    // console.log(`✅ 处理成功: ${name}.pdf`);
    return true;
  } catch (err) {
    console.error(`❌ 处理失败: ${name}${ext}`, err.message);
    return false;
  }
}



// 批量处理主函数
async function runBatch() {
  if (!checkLibreOffice()) {
    console.error('错误: 未检测到LibreOffice，请先安装');
    process.exit(1);
  }

  const files = fs.readdirSync(inputDir)
    .filter(file => {
        return file.toLowerCase().endsWith('.docx') || file.toLowerCase().endsWith('.doc')
    })
    .map(file => path.join(inputDir, file));

  if (files.length === 0) {
    console.log('⚠️ 未找到任何DOCX文件');
    return;
  }

  console.log(`发现 ${files.length} 个DOCX文件，开始处理...`);
  
  let successCount = 0;
  for (const file of files) {
    const result = await processFile(file);
    if (result) successCount++;
  }

  console.log('\n处理结果:');
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失败: ${files.length - successCount}`);
  console.log('🎉 处理完成！输出目录:', outputDir);
}

// 启动处理
runBatch().catch(err => {
  console.error('程序运行出错:', err);
  process.exit(1);
});