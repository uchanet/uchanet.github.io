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
const mockPort=mock.address().port,port=42194;
const base='http://127.0.0.1:'+port;
const env={...process.env,NODE_ENV:'test',PORT:String(port),HOST:'127.0.0.1',OPENAI_API_KEY:'fake-api-key-for-tests',CAT_OPENAI_API_URL:'http://127.0.0.1:'+mockPort+'/responses',CAT_OPENALEX_API_URL:'http://127.0.0.1:'+mockPort+'/works'};
const server=spawn(process.execPath,['server.mjs'],{cwd:new URL('.',import.meta.url).pathname,env,stdio:['ignore','pipe','pipe']});
let stderr='';server.stderr.on('data',x=>stderr+=x.toString());
const get=(path,opts={})=>fetch(base+path,{redirect:'manual',...opts});
const post=(path,payload,origin=base)=>get(path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(payload)});
try{
  let ready=false;
  for(let i=0;i<45;i++){try{const x=await get('/healthz');if(x.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
  assert(ready,'Service failed to start without any password/session secrets: '+stderr);
  let r=await get('/');assert.equal(r.status,200);assert((await r.text()).includes('anyone with this link'));
  r=await get('/api/health');assert.equal(r.status,200);assert.equal((await r.json()).configured,true);
  r=await post('/api/chat',{message:'hello'},'https://evil.example');assert.equal(r.status,403);
  r=await post('/api/chat',{message:'Check this CAT question.'});assert.equal(r.status,200);assert((await r.json()).answer.includes('uncertain'));
  r=await post('/api/research',{topic:'paid maternity leave',question:'Does it influence fertility?'});assert.equal(r.status,200);const works=await r.json();assert.equal(works.provider,'OpenAlex');assert.equal(works.total_unique,1);
  r=await post('/api/research/screen',{topic:'leave',question:'births?',records:[{id:'R1',title:'Leave study',abstract:'Paid leave evaluated.'}]});assert.equal(r.status,200);assert.equal((await r.json()).reviews[0].status,'possible');
  r=await get('/server.mjs');assert.equal(r.status,404);
  r=await get('/Official_CAT_2026.html');assert.equal(r.status,404);
  console.log('PASS public CAT Studio: open access, public health, origin protection, AI proxy and OpenAlex');
} finally {
  server.kill('SIGTERM');
  await new Promise(resolve=>mock.close(resolve));
}
