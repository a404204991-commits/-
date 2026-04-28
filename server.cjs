const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9000;
// 因为 s.yaml 里 code 设为了 ./，所以网页文件在 dist 文件夹里
const DIST_DIR = path.join(__dirname, 'dist'); 

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.csv': 'text/csv',
  '.svg': 'image/svg+xml',
};

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath);
  
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const extname = path.extname(filePath);
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(500);
      res.end(`Error: ${error.code}`);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}).listen(PORT, '0.0.0.0', () => {
  console.log(`室内设计语汇库已在端口 ${PORT} 启动`);
});
