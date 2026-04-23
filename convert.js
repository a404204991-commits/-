import fs from 'fs';
import path from 'path';

// 配置路径
const CSV_PATH = './vocabulary.csv';
const OUTPUT_PATH = './src/data.json';

function convertCsvToJson() {
  try {
    console.log('🚀 正在读取 vocabulary.csv...');
    
    if (!fs.existsSync(CSV_PATH)) {
      console.error('❌ 找不到 CSV 文件！');
      return;
    }

    // 1. 读取文件内容
    const content = fs.readFileSync(CSV_PATH, 'utf-8');

    // 2. 简单的 CSV 解析逻辑（处理换行和逗号）
    const lines = content.split(/\r?\n/);
    const headers = lines[0].split(',');

    const jsonData = lines.slice(1).filter(line => line.trim() !== "").map(line => {
      const values = line.split(',');
      const entry = {};
      
      headers.forEach((header, index) => {
        const cleanHeader = header.trim();
        let value = values[index] ? values[index].trim() : "";

        // 映射字段名到前端标准英文
        const fieldMap = {
          'ID': 'id',
          '语汇名称': 'title',
          '一级分类': 'category1',
          '二级分类': 'category2',
          '语汇描述': 'description',
          '关联语汇': 'related',
          '主图': 'mainImage'
        };

        const targetKey = fieldMap[cleanHeader] || cleanHeader;

        // 特殊处理：将“关联语汇”转为数组
        if (targetKey === 'related') {
          entry[targetKey] = value ? value.split(/[，|]/).map(s => s.trim()) : [];
        } else {
          entry[targetKey] = value;
        }
      });
      return entry;
    });

    // 3. 写入 JSON
    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(jsonData, null, 2));
    
    console.log(`✅ 成功转换！共计 ${jsonData.length} 条语汇。`);
  } catch (err) {
    console.error('❌ 转换出错:', err);
  }
}

convertCsvToJson();
