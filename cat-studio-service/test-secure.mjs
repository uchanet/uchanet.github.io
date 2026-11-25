import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';

const mock = http.createServer(async(req,res)=>{
  let body='';for await(const x of req)body+=x;
  res.setHeader('Content-Type','application/json');
  if(req.url.startsWith('/works')){
    res.end(JSON.stringify({meta:{count:19},results:[{id:'https://openalex.org/W1',title:'Paid leave and fertility',display_name:'Paid leave and fertility',publication_year:2023,type:'article',doi:'https://doi.org/10.5555/mock',authorships:[{author:{display_name:'Test Author'}}],primary_location:{source:{display_name:'Test Journal'}},abstract_inverted_index:{Leave:[0],policy:[1]}}]}));return;
  }
  if(req.url==='/responses'){
    assert.equal(req.headers.authorization,'Bearer fake-api-key-for-tests');
    const q=JSON.parse(body);
    const text=q.text?JSON.stringify({reviews:[{id:'R1',status:'possible',reason:'The abstract describes leave policy.',design_hint:'',outcome_match:'unclear',intervention_match:'yes'}]}):'The outcome remains uncertain without full-text appraisal.';
    res.end(JSON.stringify({output_text:text}));return;
  }
  res.writeHead(404);res.end('{}');
});
await new Promise(resolve=>mock.listen(0,'127.0.0.1',resolve));
const mockPort=mock.address().port,port=42193;
const base='http://127.0.0.1:'+port;
const env={...process.env,NODE_ENV:'test',PORT:String(port),HOST:'127.0.0.1',CAT_STUDIO_PASSWORD:'test-password-very-long-2026',CAT_SESSION_SECRET:'test-session-secret-more-than-thirty-two-chars-2026',OPENAI_API_KEY:'fake-api-key-for-tests',CAT_OPENAI_API_URL:'http://127.0.0.1:'+mockPort+'/responses',CAT_OPENALEX_API_URL:'http://127.0.0.1:'+mockPort+'/works'};
const server=spawn(process.execPath,['server.mjs'],{cwd:new URL('.',import.meta.url).pathname,env,stdio:['ignore','pipe','pipe']});
let stderr='';server.stderr.on('data',x=>stderr+=x.toString());
const get=(path,opts={})=>fetch(base+path,{redirect:'manual',...opts});
const post=(path,payload,cookie,origin=base)=>get(path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(payload)});
try{
  let ready=false;
  for(let i=0;i<45;i++){try{const x=await get('/healthz');if(x.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
  assert(ready,'Service failed to start: '+stderr);
  let r=await get('/');assert.equal(r.status,303);assert.equal(r.headers.get('location'),'/auth/login');
  r=await post('/api/chat',{message:'hello'});assert.equal(r.status,401);
  r=await get('/auth/login');assert.equal(r.status,200);assert((await r.text()).includes('Workspace password'));
  r=await get('/auth/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:'password=wrong'});assert.equal(r.status,401);
  r=await get('/auth/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:'password='+encodeURIComponent(env.CAT_STUDIO_PASSWORD)});
  assert.equal(r.status,303);
  const cookie=r.headers.get('set-cookie');assert(cookie.includes('HttpOnly'));assert(cookie.includes('Secure'));assert(cookie.includes('SameSite=Strict'));
  const token=cookie.split(';')[0];
  r=await get('/',{headers:{Cookie:token}});assert.equal(r.status,200);assert((await r.text()).includes('CAT Studio'));
  r=await get('/api/health',{headers:{Cookie:token}});assert.equal(r.status,200);assert.equal((await r.json()).configured,true);
  r=await post('/api/chat',{message:'hello'},token,'https://evil.example');assert.equal(r.status,403);
  r=await post('/api/chat',{message:'Check this CAT question.'},token);assert.equal(r.status,200);assert((await r.json()).answer.includes('uncertain'));
  r=await post('/api/research',{topic:'paid maternity leave',question:'Does it influence fertility?'},token);assert.equal(r.status,200);const works=await r.json();assert.equal(works.provider,'OpenAlex');assert.equal(works.total_unique,1);
  r=await post('/api/research/screen',{topic:'leave',question:'births?',records:[{id:'R1',title:'Leave study',abstract:'Paid leave evaluated.'}]},token);assert.equal(r.status,200);assert.equal((await r.json()).reviews[0].status,'possible');
  r=await get('/server.mjs',{headers:{Cookie:token}});assert.equal(r.status,404);
  r=await get('/Official_CAT_2026.html',{headers:{Cookie:token}});assert.equal(r.status,404);
  r=await get('/auth/logout',{method:'POST',headers:{Origin:base,Cookie:token}});assert.equal(r.status,303);assert(r.headers.get('set-cookie').includes('Max-Age=0'));
  console.log('PASS secure CAT Studio: login, session, public health, access controls, origin protection, AI proxy and OpenAlex');
} finally {
  server.kill('SIGTERM');
  await new Promise(resolve=>mock.close(resolve));
}
