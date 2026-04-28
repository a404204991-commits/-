// server.cjs
const { createServer } = require('http');
const { readFile, stat } = require('fs');
const { join, extname } = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(readFile);
const statAsync = promisify(stat);

// 静态资源根目录（Vite 默认构建输出路径）
const DIST_DIR = join(__dirname, 'dist');

// 处理 HTTP 请求的核心逻辑
const handleRequest = async (req, res) => {
  try {
    // 1. 尝试读取请求的文件
    let filePath = join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
    
    // 2. 处理前端路由：如果文件不存在，回退到 index.html（SPA 关键）
    try {
      await statAsync(filePath);
    } catch {
      filePath = join(DIST_DIR, 'index.html');
    }

    // 3. 读取文件内容
    const content = await readFileAsync(filePath);
    
    // 4. 根据文件扩展名设置 Content-Type
    const ext = extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2'
    };
    
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.end(content);
    
  } catch (err) {
    // 5. 文件完全不存在时返回 404
    res.statusCode = 404;
    res.end('404 Not Found');
  }
};

// 阿里云 FC 要求的入口函数
module.exports.handler = (req, res, context) => {
  // 将 FC 的 HTTP 触发器请求转换为标准 Node.js 请求对象
  const serverRequest = {
    url: req.path,
    headers: req.headers
  };
  
  // 执行处理逻辑
  handleRequest(serverRequest, {
    setHeader: (key, value) => res.setHeader(key, value),
    statusCode: 200,
    end: (content) => {
      res.send(content, {
        status: this.statusCode,
        headers: this.getHeaders()
      }
