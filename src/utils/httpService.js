const http=require('node:http');
const https=require('node:https');
function request(url,options) {
 return new Promise((resolve,reject)=>{
  const started=performance.now();let size=0;
  // 检测在主进程进行，默认验证 TLS；失败不降级到 HTTP。
  const req=(url.protocol==='https:'?https:http).request(url,{method:options.method,
   headers:options.headers,rejectUnauthorized:!options.insecureTLS},res=>{
    const ttfb=performance.now()-started;
    res.on('data',chunk=>{size+=chunk.length;if(size>1024*1024){res.destroy();finish();}});
    res.on('end',finish);res.on('error',reject);
    function finish(){clearTimeout(deadline);resolve({url:url.href,method:options.method,status:res.statusCode,
     statusText:res.statusMessage,responseTime:Math.round(performance.now()-started),ttfb:Math.round(ttfb),
     contentLength:res.headers['content-length']||size,contentType:res.headers['content-type']||'',
     headers:res.headers,bodyTruncated:size>1024*1024,tlsAuthorized:res.socket?.authorized});}
   });
  const deadline=setTimeout(()=>req.destroy(new Error('Request deadline exceeded')),options.timeout);
  req.on('error',error=>{clearTimeout(deadline);reject(error);});req.end();
 });
}
module.exports={async executeTest(options={}){
 const url=new URL(/^https?:\/\//i.test(options.url)?options.url:'https://'+options.url);
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error('Invalid HTTP URL');
 const method=(options.method||'GET').toUpperCase();
 if(!['GET','HEAD'].includes(method))throw new Error('Only GET and HEAD diagnostics are supported');
 const timeout=Number(options.timeout??10000),retries=Number(options.retries??0);
 if(!Number.isInteger(timeout)||timeout<100||timeout>60000||!Number.isInteger(retries)||retries<0||retries>3)throw new Error('Invalid timeout or retries');
 let firstError;
 for(let attempt=0;attempt<=retries;attempt++) {
  try {const result=await request(url,{...options,method,timeout});return {...result,attempts:attempt+1,firstError};}
  catch(error){firstError??=error.message;if(attempt===retries)throw error;}
 }
}};
