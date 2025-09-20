const fs = require('fs');
const path = require('path');

// 配置参数
const config = {
  grade: 1,
  subject: 'math',
  urlBase: 'https://ycy88.com/pdf/0917/',
  description: '网上资料，仅供个人使用，严禁商用！',
  status: 'enabled',
  size: 1024000,
  // 不再需要固定的downloadCount，改为在生成时随机生成
  docsDir: './docs',
  sqlDir: './sql',
  sqlFileName: 'insert_pdf_files.sql'
};

// 生成50-100之间的随机整数
function getRandomDownloadCount() {
  return Math.floor(Math.random() * 51) + 50; // 50-100之间的随机数
}

// 确保目录存在
function ensureDirectoryExistence(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`创建目录: ${dirPath}`);
  }
}

// 从文件名中提取名称（去掉扩展名和特殊字符）
function extractName(filename) {
  // 移除文件扩展名
  let name = filename.replace(/\.[^/.]+$/, "");
  
  // 将下划线和连字符替换为空格
  name = name.replace(/[_-]/g, " ");
  
  // 将每个单词首字母大写
  name = name.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
    
  return name;
}

// 生成SQL语句
function generateSQL(files) {
  let sqlStatements = '';
  
  files.forEach(file => {
    const fileName = path.basename(file);
    const name = extractName(fileName);
    const downloadCount = getRandomDownloadCount(); // 为每个文件生成随机下载次数
    
    sqlStatements += `INSERT INTO pdf_files (
  grade,
  subject,
  name,
  nickname,
  url,
  description,
  status,
  size,
  download_count,
  created_at,
  updated_at
) VALUES (
  ${config.grade},
  '${config.subject}',
  '${name}',
  '${name}',
  '${config.urlBase}${fileName}',
  '${config.description}',
  '${config.status}',
  ${config.size},
  ${downloadCount},
  NOW(),
  NOW()
);

`;
  });
  
  return sqlStatements;
}

// 主函数
async function main() {
  try {
    console.log('开始生成PDF文件SQL语句...');
    
    // 确保docs目录存在
    ensureDirectoryExistence(config.docsDir);
    
    // 确保sql目录存在
    ensureDirectoryExistence(config.sqlDir);
    
    // 读取docs目录中的文件
    const files = fs.readdirSync(config.docsDir);
    
    // 过滤出PDF文件
    const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');
    
    if (pdfFiles.length === 0) {
      console.log(`在 ${config.docsDir} 目录中没有找到PDF文件`);
      
      // 创建示例PDF文件（仅用于演示）
      const examplePdfPath = path.join(config.docsDir, '数学练习册第一章.pdf');
      if (!fs.existsSync(examplePdfPath)) {
        fs.writeFileSync(examplePdfPath, '');
        console.log(`已创建示例PDF文件: ${examplePdfPath}`);
      }
      
      // 重新读取文件
      const newFiles = fs.readdirSync(config.docsDir);
      const newPdfFiles = newFiles.filter(file => path.extname(file).toLowerCase() === '.pdf');
      
      if (newPdfFiles.length > 0) {
        console.log(`找到 ${newPdfFiles.length} 个PDF文件`);
        
        // 生成SQL
        const sql = generateSQL(newPdfFiles);
        
        // 保存SQL到文件
        const sqlFilePath = path.join(config.sqlDir, config.sqlFileName);
        fs.writeFileSync(sqlFilePath, sql);
        
        console.log(`SQL已保存到: ${sqlFilePath}`);
        console.log('\n生成的SQL内容:');
        console.log(sql);
      }
    } else {
      console.log(`找到 ${pdfFiles.length} 个PDF文件`);
      
      // 生成SQL
      const sql = generateSQL(pdfFiles);
      
      // 保存SQL到文件
      const sqlFilePath = path.join(config.sqlDir, config.sqlFileName);
      fs.writeFileSync(sqlFilePath, sql);
      
      console.log(`SQL已保存到: ${sqlFilePath}`);
      console.log('\n生成的SQL内容:');
      console.log(sql);
    }
    
  } catch (error) {
    console.error('发生错误:', error.message);
  }
}

// 运行主函数
main();