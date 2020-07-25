### node js基本使用

1. ##### http使用，及query参数获取

   ```js
   const http = require('http');
   const queryString = require('querystring');
   
   const server = http.createServer((req, res) => {
     const query = queryString.parse(req.url.split('?')[1]);
     console.log(JSON.stringify(query));
     res.end(JSON.stringify(query));
   });
   server.listen(3000);
   // http://localhost:3000/dada/?name=666&age=222
   // {
   //  "name": "666",
   //  "age": "222"
   // }
   
   ```

   

2. ##### 处理post请求

   ```js
   const http = require('http');
   const queryString = require('querystring');
   
   const server = http.createServer((req, res) => {
     if (req.method === 'POST') {
       console.log('content-type', req.headers);
       let postData = '';
       req.on('data', (chunk) => {
         postData += chunk.toString();
       });
       req.on('end', () => {
         // console.log(postData);
         res.end('hellow ordl');
       });
     }
   });
   
   server.listen(3000);
   
   ```

   

3. 4-5