
'use strict';
/* CAT Studio: offline-first, evidence-transparent drafting companion. No fabricated search results. */
const $ = sel => document.querySelector(sel);
const ROOT = $('#app');
const SAVE_KEY = 'cat_studio_2026_mvp_v1';
const BANDS = ['A','B','C','D','F'];
const QUALITY = {A:['+','','-'],B:['+','','-'],C:['+','','-'],D:['+','','-'],F:['']};
const RDS = ['MA','SR','RCT','DID','QE','NEQ','Long','CC','CS','Case','Qual'];
const SECTIONS = [
  ['overview','Overview','⌂'],['auto','AI Auto-Research','✦'],['question','I · Question & PICOC','Ⅰ'],['search','II · Search & sources','Ⅱ'],
  ['appraisal','III · Evidence appraisal','Ⅲ'],['synthesis','IV · Synthesis','Ⅳ'],['logic','V · Logic model','Ⅴ'],
  ['decisions','VI · Policy decision','Ⅵ'],['export','References & export','⇩']
];
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug = s => String(s||'cat').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,45);
const asLines = s => String(s||'').split('\n').map(s=>s.trim()).filter(Boolean);
const lines = x => Array.isArray(x) ? x.join('\n') : String(x ?? '');
const get = (obj,path) => path.split('.').reduce((o,k)=>o==null?undefined:o[k],obj);
const set = (obj,path,value) => {const p=path.split('.');let o=obj;for(let i=0;i<p.length-1;i++)o=o[p[i]];o[p[p.length-1]]=value;};
const cap = s=>s?String(s).charAt(0).toUpperCase()+String(s).slice(1):'';
const quote = s=>'"'+String(s||'').replace(/"/g,'').trim()+'"';
let S = {model:null, active:'overview', round:'CAT3', library:[], searchLoading:false, alert:''};
try {const raw=localStorage.getItem(SAVE_KEY);if(raw){const j=JSON.parse(raw);if(j&&typeof j==='object')S={...S,...j,searchLoading:false,alert:''};}} catch(e){}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({...S,searchLoading:false,alert:''}));}catch(e){showToast('Local browser saving is unavailable. Export a JSON backup.');}}
function showToast(message){let m=$('#toast');if(!m){m=document.createElement('div');m.id='toast';m.style='position:fixed;bottom:20px;right:20px;background:#10334d;color:white;padding:13px 18px;border-radius:12px;z-index:200;max-width:360px;font-size:12px;box-shadow:0 12px 26px #0013';document.body.appendChild(m);}m.textContent=message;setTimeout(()=>m&&m.remove(),4500);}
function infer(topic,question){
 const q=String(question||'').trim().replace(/[?.]+$/,'');
 let iv='', ov='', population='', context='';
 let m=q.match(/^(?:does|do|can|will|did)\s+(.+?)\s+(increase|decrease|improve|reduce|affect|enhance|change|influence|raise|lower|mitigate|promote)\s+(.+)$/i);
 if(m){iv=m[1];ov=m[3];}
 if(!m){m=q.match(/^(?:what is|what are)\s+(?:the\s+)?(?:effect|impact|effectiveness|influence)\s+of\s+(.+?)\s+on\s+(.+)$/i);if(m){iv=m[1];ov=m[2];}}
 if(!iv){iv=String(topic||'').split(/\s+(?:and|versus|on|vs)\s+/i)[0]||'policy intervention (specify)';ov='specified policy outcome (clarify from question)';}
 const p=ov.match(/\s+(?:among|for)\s+(.+)$/i);
 if(p){population=p[1];ov=ov.slice(0,p.index).trim();}
 const c=ov.match(/\s+(?:in the context of|within|in)\s+(.+)$/i);
 if(c){context=c[1];ov=ov.slice(0,c.index).trim();}
 const pi=iv.match(/\s+(?:among|for)\s+(.+)$/i);if(pi){population=population||pi[1];iv=iv.slice(0,pi.index).trim();}
 let t=String(topic||'');
 if(!context && /low[- ]fertility|low birth rate/i.test(t))context='low-fertility settings';
 if(!context && /public sector|government|civil servants/i.test(t))context='public-sector institutions';
 if(!context && /south korea|korean/i.test(t))context='South Korea';
 if(!context)context='setting to be defined';
 if(!population)population='target population to be specified';
 iv=iv.replace(/^the\s+/i,'').trim();ov=ov.replace(/^the\s+/i,'').trim();
 const isMaternity=/maternity|parental leave|family leave/i.test(t+' '+iv);
 const isFertility=/fertility|childbear|birth|having a child/i.test(t+' '+ov);
 const isRemote=/telework|remote work|work from home/i.test(t+' '+iv);
 const isAI=/artificial intelligence|digital technology|government.*ai/i.test(t+' '+iv);
 const isCorrupt=/corruption|bribery|civil.service pay/i.test(t+' '+ov);
 const synI=isMaternity?['paid maternity leave','maternity leave entitlement','maternity benefits','paid parental leave','parental leave policy','family leave']:
 isRemote?['remote work','telework','working from home','flexible work arrangements']:
 isAI?['artificial intelligence','AI adoption','digital government','machine learning','digital technology']:
 isCorrupt?['public sector pay','wage reform','salary increase','civil service remuneration']:[iv,iv.replace(/\s+policy\b/,'').trim()].filter(Boolean);
 const synO=isFertility?['fertility','childbearing','actual childbirth','birth probability','subsequent birth','fertility intentions (screen separately)']:
 isCorrupt?['corruption','bribery','misconduct','integrity']:[ov,ov.replace(/\slikelihood of /i,'')].filter(Boolean);
 const popTerms=/employed women/i.test(population)?[population,'working women','female employees','women of reproductive age']:
 /civil servant/i.test(population)?[population,'public employees','government workers']:[population];
 const outcome=isFertility?'fertility / childbearing in the defined setting':`longer-term consequences of ${ov} (to be established)`;
 return {iv,ov,population,context,outcome,synI:[...new Set(synI)],synO:[...new Set(synO)],popTerms:[...new Set(popTerms)],isFertility,isMaternity};
}
function qTerms(arr,max=4){return '('+arr.filter(x=>x && !/specify|established/i.test(x)).slice(0,max).map(quote).join(' OR ')+')';}
function makeSearches(g){
 const i=qTerms(g.synI,4),o=qTerms(g.synO.filter(x=>!x.includes('screen separately')),4);
 const wide=`AB(${i} AND ${o})`;
 return [
  {code:`AB(${quote(g.synI[0])} AND ${quote(g.synO[0])})`,note:'Narrow baseline; proposed, not executed.'},
  {code:wide,note:'Expand input and output synonyms; proposed, not executed.'},
  {code:`AB(${i} AND ${o} AND ("systematic review" OR "meta-analysis"))`,note:'Find systematic reviews and meta-analyses; proposed, not executed.'},
  {code:`AB(${i} AND ${o} AND ("quasi-experimental" OR "difference-in-differences" OR "regression discontinuity" OR "randomized"))`,note:'Find stronger primary designs; proposed, not executed.'},
  {code:`AB(${i} AND ${o} AND (${quote(g.context)} OR "policy reform" OR "natural experiment"))`,note:'Check context/implementation literature; proposed, not executed.'}
 ];
}
function recommendation(headline,actions){return {headline,ev_ids:[],actions:actions.map(text=>({text,ev_ids:[]}))};}
function newModel(topic,question,round){
 const g=infer(topic,question);
 const contextSpecific=g.context==='setting to be defined'?'[specify the jurisdiction or policy setting]':g.context;
 const model={
 schema_version:'1.2',
 meta:{round,work_mode:round==='CAT3'?'individual':'group',topic,cat_question_short:question,group_no:round==='CAT3'?null:'',date_label:'Fall 2026',members:[{member_id:'m1',name:'',email:''}],course:'Evidence-based public policy and management',institution:'GSPA, Seoul National University',term:'2026년 2학기',submitted_at:null,submitted_by:null},
 s1_1:{decision_issue:[`A relevant policy authority [name the agency] must decide whether/how to adopt or revise ${g.iv} for ${g.population}.`,`The decision requires evidence about ${g.ov}, not assumptions about policy effectiveness.`,`This CAT will compare the best available studies and identify what remains uncertain before recommending action.`],application_context:[`Target setting: ${contextSpecific}; verify institutional eligibility rules, implementation capacity, and baseline outcomes.`,`Population of interest: ${g.population}; assess whether study populations match this definition.`,`Check differences in policy exposure, local resources, and historical period before applying international findings.`]},
 s1_2:{question},
 s1_3:{population:{main:g.population,supplementary:g.popTerms.filter(s=>s!==g.population).concat(['eligible population','target group'])},input:{main:g.iv,supplementary:g.synI.filter(x=>x!==g.iv)},context:{main:g.context,supplementary:g.context==='low-fertility settings'?['low fertility','below replacement fertility','subreplacement fertility']:['implementation setting','policy environment']},output:{main:g.ov,supplementary:g.synO.filter(x=>x!==g.ov)},outcome:{main:g.outcome,supplementary:g.isFertility?['total fertility rate','completed family size','birth timing']:['long-run outcomes','population-level consequences']}},
 s2_1:{databases:[{db_id:'DB1',name:'ProQuest Central',peer_reviewed:true,language:'English (proposed)',year_range:'All years (proposed)',reason:'Multidisciplinary journal discovery; peer-reviewed limiter. Search has not yet been run.'},{db_id:'DB2',name:'Scopus',peer_reviewed:true,language:'English (proposed)',year_range:'All years (proposed)',reason:'Citation-indexed multidisciplinary research; record actual restrictions only after searching.'},{db_id:'DB3',name:'ScienceDirect',peer_reviewed:true,language:'English (proposed)',year_range:'All years (proposed)',reason:'Publisher platform for journal full text and related scholarship; not equivalent to Scopus.'}],notes:'All sources and filters are planning entries only.'},
 s2_2:{steps:makeSearches(g).map((s,i)=>({no:i+1,code:s.code,hits:{},final_count:0,result_note:s.note,found_ev_ids:[]}))},
 s2_3:{evidence:[],selection_note:['Proposed inclusion: original research or systematic reviews addressing the specified input and actual outcome.','Screen each publication against its own population, intervention, comparison or condition, measured output, and context.','Deduplicate by DOI/title; record reasons for exclusions and each study’s actual search step.','No studies have been selected or appraised yet.']},
 s3:{assessment:[],table_note:'No study-level effects are entered until the source publication has been checked.'},
 s4_1:{cat_question_restated:question,conclusion:['Evidence has not been appraised; no substantive effectiveness conclusion can be made yet.'],key_findings:['Pending: summarize verified effect estimates, null results, and design-specific limitations.'],boundary_conditions:[`Check applicability to ${g.population} in ${contextSpecific}.`],conflicting_findings:[],additional_considerations:['Separate associations, quasi-experimental estimates, and randomized evidence; do not treat them as equivalent.']},
 s4_2:Object.fromEntries(BANDS.map(x=>[x,{supporting:{ev_ids:[],text:''},conflicting:{ev_ids:[],text:''}}])),
 s4_3:{strengths:['Initial PICOC and search strategy drafted consistently from the question.'],weaknesses:['No actual database search counts or full-text appraisals have been supplied.','Context, eligibility, and effect sizes require source-level verification.'],credibility_level:'',credibility_reason:['Do not select a confidence level until the evidence has been screened and appraised.']},
 s5_1:{nodes:round==='CAT2'?[]:[{node_id:'N1',label:cap(g.iv),note:'Policy input; proposed, not yet evaluated.'},{node_id:'N2',label:cap(g.ov),note:'Immediate or intermediate measured outcome to be specified.'},{node_id:'N3',label:cap(g.outcome),note:'Longer-term outcome; assumed until verified.'}]},
 s5_2:{links:round==='CAT2'?[]:[{from:'N1',to:'N2',direction:'?',ev_ids:[],mechanism:'Hypothesized relationship; no supporting study selected yet.'},{from:'N2',to:'N3',direction:'?',ev_ids:[],mechanism:'Potential downstream effect; assumption pending evidence.'}]},
 s6_1:{short_term:{time_frame:'0–6 months (proposed)',policy_goal:[`Specify baseline measures of ${g.ov} and eligibility.`],recommendations:[recommendation('Complete evidence-based policy appraisal',[`Verify actual eligibility and outcomes for ${g.population}.`]),recommendation('Design measurement and safeguards',[`Define indicators, subgroup reporting, and data-quality checks for ${g.ov}.`])],confidence:{level:'',reason:'Cannot rate confidence before appraisal.'},further_considerations:['Requires administrative feasibility and stakeholder consultation.']},mid_long_term:{time_frame:'6–24 months (proposed)',policy_goal:[`Monitor ${g.ov} and longer-term outcomes over a defensible follow-up period.`],recommendations:[recommendation('Pilot and evaluate only if evidence supports it',[`Define a credible comparison strategy and monitor ${g.ov} before scale-up.`])],confidence:{level:'',reason:'Cannot rate confidence before appraisal.'},further_considerations:['Policy options are provisional, not evidence-backed recommendations.']}},
 references:[],collaboration:round==='CAT3'?null:{assignments:[],contributions:[]}
 };
 return model;
}
const titleFor=()=> S.model ? S.model.meta.topic : '';
const roundName=r=>({CAT1:'CAT 1 · Walk',CAT2:'CAT 2 · Run',CAT3:'CAT 3 · Fly'})[r]||r;
function evidenceCount(){return S.model?.s2_3.evidence.length||0;}
function progress(){
 const d=S.model;if(!d)return 0;
 const checks=[!!d.s1_2.question,!!d.s1_3.input.main,d.s2_1.databases.every(x=>x.name),d.s2_2.steps.some(x=>Object.values(x.hits).some(v=>v!==null)),d.s2_3.evidence.length>0,d.s3.assessment.some(a=>a.key_findings),d.s4_3.credibility_level!==''&&d.s4_3.credibility_reason.length>0,d.references.length>0];
 return Math.round(checks.filter(Boolean).length/checks.length*100);
}
function fillField(path,label,opts={}){
 const val=get(S.model,path);const isArr=Array.isArray(val);const text=lines(val);const id='field-'+path.replace(/[^a-z0-9_-]/gi,'-');
 return `<div class="field"><label class="label" for="${id}">${esc(label)}</label>${opts.hint?`<div class="field-hint" style="margin-bottom:7px">${esc(opts.hint)}</div>`:''}<textarea id="${id}" data-path="${esc(path)}" data-lines="${isArr?1:0}" rows="${opts.rows||4}" class="${opts.code?'code':opts.bullets?'bullets':''}" placeholder="${esc(opts.placeholder||'Enter content')}">${esc(text)}</textarea></div>`;
}
function inp(path,label,opts={}){const id='field-'+path.replace(/[^a-z0-9_-]/gi,'-');return `<div class="field"><label class="label" for="${id}">${esc(label)}</label><input id="${id}" class="input" data-path="${esc(path)}" value="${esc(get(S.model,path)||'')}" placeholder="${esc(opts.placeholder||'')}" /></div>`;}
function setup(){ROOT.innerHTML=`<div class="cover-shell"><div class="setup"><div class="setup-aside"><div class="setup-mark"><span>CS</span> CAT Studio</div><h1>Your research.<br/>Structured<br/>with evidence.</h1><p>From one policy question to a rigorous CAT report. Draft responsibly, discover literature, appraise evidence, and export into the university's official 2026 form.</p><div class="setup-steps"><span><b>1</b> Enter topic and CAT question</span><span><b>2</b> Review the auto-generated research plan</span><span><b>3</b> Verify evidence and complete your CAT</span></div></div><div class="setup-form"><div class="kicker">Welcome to CAT Studio</div><h2>Start your new CAT</h2><p class="form-sub">Only two text inputs are needed to create your first draft.</p><label class="label">Select CAT round</label><div class="rounds">${['CAT1','CAT2','CAT3'].map(r=>`<button class="round-opt" aria-pressed="${S.round===r}" data-action="round" data-round="${r}">${esc(roundName(r))}</button>`).join('')}</div><div class="field"><label class="label" for="topic">Research topic</label><input id="topic" class="input" placeholder="e.g. Paid maternity leave and low fertility" maxlength="240" /></div><div class="field"><label class="label" for="question">CAT research question</label><textarea id="question" rows="5" placeholder="e.g. Does access to paid maternity leave increase the likelihood of having a child among employed women of reproductive age?"></textarea><div class="field-hint">The system proposes PICOC terms; you can edit them before researching.</div></div><button class="btn primary setup-btn" data-action="generate">Generate my CAT workspace →</button><div class="setup-foot">Automatic drafting does not invent articles, effects, or search counts.</div>${S.model?`<div style="margin-top:20px;text-align:center"><button class="btn" data-action="resume">Resume saved workspace</button></div>`:''}</div></div></div>`;}
function stageNavigation(){
 const steps=SECTIONS.filter(x=>!(x[0]==='logic'&&S.model.meta.round==='CAT2'));
 const at=steps.findIndex(x=>x[0]===S.active);
 const prev=at>0?steps[at-1]:null,next=at<steps.length-1?steps[at+1]:null;
 return `<nav class="stage-nav" aria-label="Continue through CAT sections"><div><span class="stage-label">GUIDED WORKFLOW</span><div class="stage-title">${next?`Next: ${esc(next[1])}`:'You have reached the export step'}</div><div class="mini">Everything remains editable. Save a JSON backup before submitting.</div></div><div class="inline">${prev?`<button class="btn" data-action="nav" data-section="${prev[0]}">← Previous</button>`:''}${next?`<button class="btn primary" data-action="nav" data-section="${next[0]}">Continue →</button>`:`<button class="btn primary" data-action="backup">Save my work ↓</button>`}</div></nav>`;
}
function layout(){
 const current=SECTIONS.find(x=>x[0]===S.active)||SECTIONS[0], d=S.model;
 ROOT.innerHTML=`<div class="shell"><aside class="sidebar"><div class="brand"><span class="brand-logo">CS</span><div><div class="brand-main">CAT Studio</div><div class="brand-sub">Evidence-based policy</div></div></div><div class="nav-label">Research workspace</div><div class="nav-menu" aria-label="Research sections">${SECTIONS.filter(x=>!(x[0]==='logic'&&d.meta.round==='CAT2')).map(([id,label,icon])=>`<button class="nav-item ${S.active===id?'active':''}" data-action="nav" data-section="${id}" ${S.active===id?'aria-current="page"':''}><span class="nav-icon">${icon}</span>${esc(label)}</button>`).join('')}</div><div class="sidebar-bottom"><strong>${esc(roundName(d.meta.round))}</strong><div>Working draft · Fall 2026</div><div class="small-progress" role="progressbar" aria-label="Basic workflow readiness" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress()}"><span style="width:${progress()}%"></span></div><div style="margin-top:6px">${progress()}% basic readiness</div></div></aside><main class="main"><div class="topbar"><div><div class="crumb">CAT Studio / ${esc(current[1])}</div><div class="topbar-title">${esc(d.meta.topic)}</div></div><div class="top-actions"><span class="round-pill">${esc(roundName(d.meta.round))}</span><button class="btn auto-top-button" data-action="auto-start">◈ Auto-Research</button><button class="btn ai-top-button" data-action="ai-open">✦ Ask CAT Copilot</button><button class="btn" data-action="backup">↓ Save JSON</button><button class="btn primary" data-action="nav" data-section="export">Review & export →</button></div></div><div class="content" id="main-content">${renderSection(S.active)}${stageNavigation()}<footer>CAT Studio · Offline-first drafting assistant · Updated to the Fall 2026 CAT schema 1.2</footer></div></main></div>`;
}
function head(kicker,title,desc){return `<div class="page-head"><div><span class="kicker">${esc(kicker)}</span><h1>${esc(title)}</h1><p class="lead">${esc(desc)}</p></div></div>`;}
function notice(label='Important'){return `<div class="banner"><div style="font-size:18px">⚠</div><div><strong>${label}</strong><br/>This is an automatically generated <b>research plan</b>, not a completed evidence review. Published findings, database hit counts, and effect sizes must come from verified sources.</div></div>`;}
function renderSection(k){switch(k){case 'auto':return autoRender();case 'question':return renderQuestion();case 'search':return renderSearch();case 'appraisal':return renderAppraisal();case 'synthesis':return renderSynthesis();case 'logic':return renderLogic();case 'decisions':return renderDecisions();case 'export':return renderExport();default:return renderOverview();}}
function renderOverview(){const d=S.model;const g=infer(d.meta.topic,d.s1_2.question);let done=d.s2_2.steps.filter(s=>Object.values(s.hits||{}).some(x=>typeof x==='number')).length;
 return `${head('Research dashboard','A clear path to your CAT','Your initial draft is ready. The next step is collecting and validating evidence—not inventing an answer.')}${notice('Evidence-first drafting')}
 <div class="grid g4" style="margin-bottom:20px"><div class="stat"><div class="lbl">CAT round</div><div class="num">${esc(d.meta.round.replace('CAT',''))}</div><div class="detail">${esc(roundName(d.meta.round))}</div></div><div class="stat"><div class="lbl">Planned search steps</div><div class="num">${d.s2_2.steps.length}</div><div class="detail">${done} with entered hit counts</div></div><div class="stat"><div class="lbl">Evidence studies</div><div class="num">${evidenceCount()}</div><div class="detail">Requires source validation</div></div><div class="stat"><div class="lbl">Workflow readiness</div><div class="num">${progress()}%</div><div class="detail">Basic fields only</div></div></div>
 <div class="hero"><div><span class="kicker">Your CAT question</span><h2 style="margin-top:8px;font-size:20px">${esc(d.s1_2.question)}</h2><p>Population: ${esc(g.population)} · Input: ${esc(g.iv)} · Output: ${esc(g.ov)} · Context: ${esc(g.context)}</p></div><div class="icon-round">↗</div></div>
 <div class="auto-home-cta"><div><span class="kicker">NEW · AI AUTO-RESEARCH</span><h2>Discover academic sources from your question.</h2><p>Find source records, screen abstracts with AI, and create an editable CAT draft with traceable citations.</p></div><button class="btn primary" data-action="auto-start">Start Auto-Research →</button></div><div class="grid g2"><div class="card"><div class="card-head"><div><h2>Start with PICOC</h2><p class="card-sub">Edit the inferred concepts to match your intended policy decision.</p></div><span class="tag ok">Drafted</span></div><p class="muted">The current 2026 model uses <b>Population · Input · Context (Condition) · Output · outCome</b>, not the old Comparison field.</p><button class="btn primary" data-action="nav" data-section="question">Review question and PICOC →</button></div><div class="card"><div class="card-head"><div><h2>Continue with evidence</h2><p class="card-sub">Run recorded searches and import legitimate articles.</p></div><span class="tag pending">Needs verification</span></div><p class="muted">You can search OpenAlex for candidate publications or import RIS files. Neither action assigns grades or invents effect estimates.</p><button class="btn" data-action="nav" data-section="search">Open search workspace →</button></div></div>
 <div class="card"><h2>How the three CAT rounds work</h2><div class="grid g3" style="margin-top:16px"><div><span class="tag info">CAT 1 · Walk</span><p class="mini">Group-based deliberate analysis, including a logic model.</p></div><div><span class="tag info">CAT 2 · Run</span><p class="mini">Group-based rapid analysis; the official form omits the logic model.</p></div><div><span class="tag info">CAT 3 · Fly</span><p class="mini">Individual final CAT with evidence-linked logic model and policy actions.</p></div></div></div>`;}
function renderQuestion(){const d=S.model;return `${head('Section I','Policy question & PICOC','The first draft is generated from your two inputs. Verify the scope and revise the terms before searching.')}${notice('Review these interpretations')}
 <div class="card"><div class="card-head"><div><h2>1.1 Policy decision issue</h2><p class="card-sub">Who decides, why now, and where the evidence will apply.</p></div><span class="tag info">Editable</span></div><div class="grid g2">${fillField('s1_1.decision_issue','Decision issue · one bullet per line',{rows:6})}${fillField('s1_1.application_context','Context for applying the evidence',{rows:6})}</div></div>
 <div class="card"><h2>1.2 CAT question</h2><p class="card-sub" style="margin-bottom:13px">Answerable research questions identify a population, input, measurable output, and setting.</p>${fillField('s1_2.question','Full CAT question',{rows:3})}<button class="btn pale" data-action="reinfer">↻ Recalculate PICOC from question</button><div class="mini" style="margin-top:8px">Recalculation regenerates the initial plan and clears subsequent edits; export a backup first.</div></div>
 <div class="card"><div class="card-head"><div><h2>1.3 PICOC structure</h2><p class="card-sub">Updated 2026 terminology: Comparison is not a mandatory PICOC field; outCome is separate from Output.</p></div></div><div class="table-wrap"><table><thead><tr><th style="width:24%">Element</th><th style="width:33%">Main keyword</th><th>Supplementary keywords · one per line</th></tr></thead><tbody>${[['population','Population'],['input','Input'],['context','Context (Condition)'],['output','Output'],['outcome','outCome']].map(([x,n])=>`<tr><td><strong>${n}</strong></td><td><input class="input" data-path="s1_3.${x}.main" value="${esc(d.s1_3[x].main)}"></td><td><textarea rows="3" data-path="s1_3.${x}.supplementary" data-lines="1">${esc(lines(d.s1_3[x].supplementary))}</textarea></td></tr>`).join('')}</tbody></table></div></div>`;}
function renderSearch(){const d=S.model;const g=infer(d.meta.topic,d.s1_2.question);return `${head('Section II','Evidence search & source library','Your search syntax is proposed automatically. Enter actual database counts only after you have conducted each search.')}${notice('Search counts are not auto-filled')}
 <div class="card"><div class="card-head"><div><h2>2.1 Database strategy</h2><p class="card-sub">Three starting sources suggested; change them to match your actual methods.</p></div><button class="btn sm" data-action="add-db">+ Database</button></div><div class="table-wrap"><table><thead><tr><th>ID</th><th>Database</th><th>Language</th><th>Year range</th><th>Reason</th></tr></thead><tbody>${d.s2_1.databases.map((r,i)=>`<tr><td>${esc(r.db_id)}</td><td><input class="input" data-path="s2_1.databases.${i}.name" value="${esc(r.name)}"></td><td><input class="input" data-path="s2_1.databases.${i}.language" value="${esc(r.language)}"></td><td><input class="input" data-path="s2_1.databases.${i}.year_range" value="${esc(r.year_range)}"></td><td><textarea rows="3" data-path="s2_1.databases.${i}.reason">${esc(r.reason)}</textarea></td></tr>`).join('')}</tbody></table></div><div class="section-note">The official template wants a database choice, filter and scope justification. Do not leave “proposed” if you later claim that search was executed.</div></div>
 <div class="card"><div class="card-head"><div><h2>2.2 Search process</h2><p class="card-sub">Search codes below are written for ProQuest's abstract field. Translate to the appropriate syntax in other databases.</p></div><button class="btn sm" data-action="add-step">+ Search step</button></div>${d.s2_2.steps.map((s,i)=>`<div class="step"><div class="step-num">${i+1}</div><div><div class="row-between"><b style="color:#244358;font-size:12px">Search step ${i+1}</b><button class="btn sm" data-action="copy-query" data-index="${i}">Copy query</button></div><textarea class="code" data-path="s2_2.steps.${i}.code">${esc(s.code)}</textarea><div class="grid g3" style="margin-top:10px">${d.s2_1.databases.map(db=>`<div class="field"><label class="label">${esc(db.name||db.db_id)} hits</label><input type="number" min="0" class="input" placeholder="Not run" data-path="s2_2.steps.${i}.hits.${db.db_id}" value="${esc(s.hits[db.db_id]??'')}"></div>`).join('')}</div><div class="field"><label class="label">Results and reason for next step</label><textarea rows="2" data-path="s2_2.steps.${i}.result_note">${esc(s.result_note)}</textarea></div></div></div>`).join('')}</div>
 <div class="grid g2"><div class="card"><div class="card-head"><div><h2>Discover candidate journals</h2><p class="card-sub">Live OpenAlex metadata search. It is not a ProQuest/Scopus search and does not count as one.</p></div></div><button class="btn primary" data-action="openalex" ${S.searchLoading?'disabled':''}>${S.searchLoading?'Searching…':'⌕ Search OpenAlex'}</button><p class="mini" style="margin-top:10px">Optional internet connection required. Add only potentially relevant records; verify each paper before grading.</p></div><div class="card"><h2>Import bibliography</h2><p class="card-sub">Upload RIS references exported from ProQuest, Scopus, Zotero, or another source.</p><button class="btn" data-action="import-ris">↑ Import .RIS / .TXT</button><p class="mini" style="margin-top:10px">Duplicates are checked by DOI/title where possible; the application never fabricates methods or effect sizes.</p></div></div>
 <div class="card"><div class="card-head"><div><h2>Research library</h2><p class="card-sub">${S.library.length} candidate records. These are not automatically in your final evidence list.</p></div></div>${S.library.length?S.library.map((p,i)=>`<div class="paper"><div class="row-between"><div class="paper-title">${esc(p.title||'Untitled publication')}</div><button class="btn sm" data-action="add-evidence" data-index="${i}">+ Add to evidence</button></div><div class="paper-brief">${esc((p.authors||[]).join(', '))} · ${esc(p.year||'n.d.')} · ${esc(p.journal||'Journal unknown')}</div>${p.doi?`<div class="mini">DOI: ${esc(p.doi)}</div>`:''}${p.abstract?`<p>${esc(p.abstract.slice(0,450))}${p.abstract.length>450?'…':''}</p>`:''}${p.url?`<a target="_blank" rel="noreferrer" style="font-size:11px" href="${esc(p.url)}">Source details ↗</a>`:''}</div>`).join(''):`<div class="empty"><span class="big">⌕</span>No papers in your library yet.<br/>Use live discovery or import RIS citation records.</div>`}</div>`;}
function renderAppraisal(){const d=S.model;const es=d.s2_3.evidence;return `${head('Sections II.3 + III','Evidence list & critical appraisal','Each final study is entered once, then its design, level, actual study PICOC, and effects are appraised separately.')}${notice('Study-level verification required')}
 <div class="card"><div class="card-head"><div><h2>2.3 Final evidence list</h2><p class="card-sub">Recommended 5–10 studies; the 2026 template's mechanical check accepts 5–12.</p></div><button class="btn" data-action="blank-evidence">+ Add blank study</button></div>${!es.length?`<div class="empty"><span class="big">▤</span>No studies have been finalized.<br/>Go to the Search tab to add candidate references or create a blank evidence record.</div>`:es.map((e,i)=>`<div class="paper ${S.selected===i?'selected':''}"><div class="row-between"><div><div class="paper-title">Evidence #${e.ev_id}: ${esc(e.citation||'[Citation not yet entered]')}</div><div class="paper-brief">${esc(e.lv||'Ungraded')} · ${esc(e.doi||'DOI not entered')}</div></div><div class="inline"><button class="btn sm" data-action="edit-evidence" data-index="${i}">Appraise →</button><button class="btn sm danger" data-action="remove-evidence" data-index="${i}">Remove</button></div></div></div>`).join('')}</div>${es.length&&S.selected!==undefined&&es[S.selected]?renderEvidenceDetail(S.selected):''}`;}
function renderEvidenceDetail(i){const d=S.model,e=d.s2_3.evidence[i],a=d.s3.assessment[i];if(!e||!a)return'';
 return `<div class="card" id="evidence-detail"><div class="card-head"><div><h2>Evidence #${e.ev_id} · Study appraisal</h2><p class="card-sub">Current 2026 form uses P, I, (C), (Th), O, (C). The study’s own components—not your CAT’s PICOC.</p></div><span class="tag ${e.band?'ok':'pending'}">${esc(e.lv||'Unrated')}</span></div>${inp(`s2_3.evidence.${i}.citation`,'APA reference')}${inp(`s2_3.evidence.${i}.doi`,'DOI')}${fillField(`s2_3.evidence.${i}.comment`,'Reason for the evidence level (+/−) and caveats',{rows:3})}
 <div class="grid g2"><div class="field"><label class="label">Evidence level determination (based on study design)</label><select data-path="s2_3.evidence.${i}.band" data-grade="${i}"><option value="">Select based on evidence</option>${BANDS.map(b=>`<option ${e.band===b?'selected':''} value="${b}">${b} · ${({A:'Systematic synthesis of multiple studies',B:'Estimated effect with a comparison group',C:'Association without causal comparison',D:'Systematically collected descriptive data',F:'No systematically collected data'})[b]}</option>`).join('')}</select></div><div class="field"><label class="label">Quality within band</label><select data-path="s2_3.evidence.${i}.pm" data-grade="${i}">${(QUALITY[e.band]||['+','','-']).map(x=>`<option ${e.pm===x?'selected':''} value="${x}">${x||'Standard'} ${x==='+'?'· stronger execution':x==='-'?'· meaningful limitations':''}</option>`).join('')}</select></div></div><div class="grid g2"><div class="field"><label class="label">Research design</label><select data-path="s3.assessment.${i}.rd"><option value=""></option>${RDS.map(x=>`<option value="${x}" ${a.rd===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label class="label">Effect magnitude</label><select data-path="s3.assessment.${i}.effect_size.magnitude">${['','very Large','Large','Moderate','Small','very Small','N/A'].map(x=>`<option value="${x}" ${a.effect_size.magnitude===x?'selected':''}>${x||'Select after checking reported results'}</option>`).join('')}</select></div></div><div class="hline"></div><h3>Study-level PICOC and Thruput</h3><div class="grid g3">${[['p','P · Population'],['i','I · Input'],['c','(C) · Context/condition'],['th','(Th) · Thruput'],['o','O · Output'],['oc','(C) · outCome']].map(([x,n])=>`<div class="field"><label class="label">${n}</label><textarea rows="2" data-path="s3.assessment.${i}.picoc_map.${x}">${esc(a.picoc_map[x]||'')}</textarea></div>`).join('')}</div>
 <div class="hline"></div><div class="grid g2">${fillField(`s3.assessment.${i}.effect_size.details`,'Effect size: exact reported estimate, scale and uncertainty',{rows:5,placeholder:'e.g. odds ratio, 95% CI, sample; never invent a number'})}${fillField(`s3.assessment.${i}.key_findings`,'Key findings · actual source-reported results',{rows:5})}</div>${fillField(`s3.assessment.${i}.policy_implications`,'Policy implications · proportional to findings',{rows:4})}<div class="section-note">A/B/C levels are based on design and controls, not positive or negative results. The +/- modifier describes quality within the level. Keep all extracted numbers linked to the original article.</div></div>`;
}
function renderSynthesis(){const d=S.model;return `${head('Section IV','Evidence synthesis','Explain how the individual studies collectively answer the CAT question. The findings below are incomplete until the evidence is appraised.')}${notice('No evidence-backed conclusion yet')}
 <div class="card"><h2>4.1 Conclusion & key findings</h2><div class="section-note">CAT question: ${esc(d.s1_2.question)}</div>${fillField('s4_1.conclusion','CAT conclusion · bullets',{rows:3})}${fillField('s4_1.key_findings','Key findings · bullets',{rows:4})}<div class="grid g2">${fillField('s4_1.boundary_conditions','Boundary conditions, if any',{rows:4})}${fillField('s4_1.conflicting_findings','Conflicting evidence, if any',{rows:4})}</div>${fillField('s4_1.additional_considerations','Additional considerations',{rows:3})}</div>
 <div class="card"><h2>4.2 Evidence by level</h2><p class="card-sub">List actual evidence IDs, not invented support or opposition.</p><div class="table-wrap"><table><thead><tr><th>Level</th><th>Supporting IDs + interpretation</th><th>Conflicting IDs + interpretation</th></tr></thead><tbody>${BANDS.map(b=>`<tr><td><strong>${b}</strong></td><td>${smallSynthesisField(`s4_2.${b}.supporting`)}</td><td>${smallSynthesisField(`s4_2.${b}.conflicting`)}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="card"><h2>4.3 Credibility audit</h2><div class="grid g2">${fillField('s4_3.strengths','Strengths of the CAT process',{rows:4})}${fillField('s4_3.weaknesses','Weaknesses of the CAT process',{rows:4})}</div><div class="grid g2"><div class="field"><label class="label">Credibility of the conclusion</label><select data-path="s4_3.credibility_level">${['','Very high','High','Moderate','Low','Very low'].map(x=>`<option ${d.s4_3.credibility_level===x?'selected':''} value="${x}">${x||'Not rated'}</option>`).join('')}</select></div>${fillField('s4_3.credibility_reason','Why that confidence rating?',{rows:4})}</div></div>`;}
function smallSynthesisField(path){const r=get(S.model,path);return `<input class="input" data-ids-path="${path}.ev_ids" value="${esc((r.ev_ids||[]).join(', '))}" placeholder="IDs: 1, 3" style="margin-bottom:6px"><textarea rows="3" data-path="${path}.text" placeholder="Explain what the studies support">${esc(r.text||'')}</textarea>`;}
function renderLogic(){const d=S.model;if(d.meta.round==='CAT2')return `${head('CAT 2','Logic model omitted','The official 2026 CAT2 form does not require Section V logic model.')}`;
 const nodes=d.s5_1.nodes,links=d.s5_2.links;
 return `${head('Section V','Evidence-linked logic model','A relationship without a verified evidence ID is an assumption, not an established causal mechanism.')}${notice('Initial pathways are assumptions')}
 <div class="card"><div class="card-head"><div><h2>5.1 Logic-model nodes</h2><p class="card-sub">Distinguish policy input, measured output, and longer-term outCome.</p></div><button class="btn sm" data-action="add-node">+ Node</button></div><div class="table-wrap"><table><thead><tr><th>Node</th><th>Label</th><th>Description</th></tr></thead><tbody>${nodes.map((n,i)=>`<tr><td>${esc(n.node_id)}</td><td><input class="input" data-path="s5_1.nodes.${i}.label" value="${esc(n.label)}"></td><td><textarea rows="2" data-path="s5_1.nodes.${i}.note">${esc(n.note)}</textarea></td></tr>`).join('')}</tbody></table></div></div>
 <div class="card"><div class="card-head"><div><h2>5.2 Mechanisms & evidence</h2><p class="card-sub">Evidence IDs link each path to an appraised paper; unlinked paths remain explicitly hypothetical.</p></div><button class="btn sm" data-action="add-link">+ Path</button></div>${links.map((k,i)=>`<div class="step"><div class="step-num">${i+1}</div><div><div class="grid g3"><div class="field"><label class="label">From</label><select data-path="s5_2.links.${i}.from">${nodes.map(n=>`<option ${k.from===n.node_id?'selected':''} value="${esc(n.node_id)}">${esc(n.label)}</option>`).join('')}</select></div><div class="field"><label class="label">To</label><select data-path="s5_2.links.${i}.to">${nodes.map(n=>`<option ${k.to===n.node_id?'selected':''} value="${esc(n.node_id)}">${esc(n.label)}</option>`).join('')}</select></div><div class="field"><label class="label">Direction</label><select data-path="s5_2.links.${i}.direction">${['?','+','-'].map(x=>`<option ${k.direction===x?'selected':''} value="${x}">${x==='?'?'Undetermined':x}</option>`).join('')}</select></div></div><div class="grid g2"><div class="field"><label class="label">Verified evidence IDs (comma-separated)</label><input class="input" data-ids-path="s5_2.links.${i}.ev_ids" value="${esc(k.ev_ids.join(', '))}" placeholder="None = assumption"></div><div class="field"><label class="label">Mechanism / justification</label><textarea rows="2" data-path="s5_2.links.${i}.mechanism">${esc(k.mechanism)}</textarea></div></div></div></div>`).join('')}</div>
 <div class="card"><h2>5.3 Diagram preview</h2><div class="flow">${nodes.map((n,i)=>`${i?'<span class="flow-arrow">→</span>':''}<div class="flow-node">${esc(n.label)}<div class="mini">${i>0?links[i-1]?.ev_ids?.length?'Evidence-linked':'Assumption':'Starting input'}</div></div>`).join('')}</div><p class="mini">This is a draft sequence. Review the direction and support for every path before submission.</p></div>`;}
function actionColumn(key){const c=get(S.model,`s6_1.${key}`);return `<div class="card"><h2>${key==='short_term'?'Short term':'Mid- and long-term'}</h2>${inp(`s6_1.${key}.time_frame`,'Time frame')}${S.model.meta.round!=='CAT2'?fillField(`s6_1.${key}.policy_goal`,'Policy goals and KPIs · one per line',{rows:3}):''}${c.recommendations.map((r,i)=>`<div class="search-card"><div class="field"><label class="label">Recommendation ${i+1}</label><input class="input" data-path="s6_1.${key}.recommendations.${i}.headline" value="${esc(r.headline)}"></div><div class="field"><label class="label">Supporting evidence IDs</label><input class="input" data-ids-path="s6_1.${key}.recommendations.${i}.ev_ids" value="${esc(r.ev_ids.join(', '))}" placeholder="None yet"></div>${r.actions.map((a,j)=>`<div class="field"><label class="label">Action ${j+1}</label><textarea data-path="s6_1.${key}.recommendations.${i}.actions.${j}.text" rows="2">${esc(a.text)}</textarea></div>`).join('')}</div>`).join('')}<div class="field"><label class="label">Confidence level</label><select data-path="s6_1.${key}.confidence.level">${['','High','Moderate','Low'].map(x=>`<option ${c.confidence.level===x?'selected':''} value="${x}">${x||'Not rated'}</option>`).join('')}</select></div>${fillField(`s6_1.${key}.confidence.reason`,'Why this confidence? (do not overclaim)',{rows:2})}${fillField(`s6_1.${key}.further_considerations`,'Further considerations',{rows:3})}</div>`;}
function renderDecisions(){return `${head('Section VI','Policy recommendations & action plan','Use verified evidence to justify actions. Starting entries are methodological proposals, not findings about the policy’s effectiveness.')}${notice('Recommendations require evidence links')}<div class="grid g2">${actionColumn('short_term')}${actionColumn('mid_long_term')}</div><div class="section-note">Keep 3–5 recommendations total, with evidence IDs, time frames, responsible actors, measurable KPIs, and bounded confidence.</div>`;}
function renderExport(){const d=S.model, issues=validate(), refs=d.references, n=issues.length;
 return `${head('Final stage','References, checks & export','Download a schema-1.2 working file that the uploaded official 2026 CAT form can open and submit.')}
 <div class="grid g3" style="margin-bottom:17px"><div class="stat"><div class="lbl">Formal self-check issues</div><div class="num">${n}</div><div class="detail">Advisory; cannot replace academic review</div></div><div class="stat"><div class="lbl">Evidence entries</div><div class="num">${evidenceCount()}</div><div class="detail">Reference count: ${refs.length}</div></div><div class="stat"><div class="lbl">Compatible schema</div><div class="num">1.2</div><div class="detail">Fall 2026 CAT template</div></div></div>
 <div class="card"><h2>Validation checklist</h2><p class="card-sub">Passing these mechanical checks does not establish scientific accuracy.</p>${issues.length?`<div style="margin-top:13px">${issues.map(s=>`<div style="border-bottom:1px solid #edf0f3;padding:9px 0"><span style="color:#9b6c1f;font-weight:800">!</span> ${esc(s)}</div>`).join('')}</div>`:`<div class="success-circle" style="margin-top:14px">All basic format checks passed. Continue verifying the scientific content and each source.</div>`}</div>
 <div class="card"><div class="card-head"><div><h2>References · APA</h2><p class="card-sub">One source per line. Evidence references can be pulled into this field.</p></div><button class="btn sm" data-action="pull-refs">↻ Pull from evidence</button></div>${fillField('references','Reference list',{rows:9})}</div>
 <div class="card"><div class="card-head"><div><h2>Official CAT submission workflow</h2><p class="card-sub">This app exports a working JSON, not a fake completed submission.</p></div><div class="grid g2"><div class="search-card"><span class="tag ok">Step 1</span><h3 style="margin-top:10px">Download working data</h3><p class="mini">Includes all current section content in the official schema, with blank/unverified studies left blank.</p><button class="btn primary" data-action="backup">↓ Download CAT working JSON</button></div><div class="search-card"><span class="tag info">Step 2</span><h3 style="margin-top:10px">Open the official form</h3><p class="mini">In Chrome, select your CAT round and use “Open working file” to load the JSON. Then review and build its HTML submission.</p><a class="btn dark" target="_blank" rel="noopener" href="Official_CAT_2026.html">↗ Open official CAT 2026 form</a></div></div><div class="banner" style="margin-top:13px;margin-bottom:0"><div>⚠</div><div>For your class, submit the <b>HTML produced by the official form</b>, not this site's preview, JSON, or a PDF. The official form includes its required structured grading data.</div></div></div>
 <div class="card"><h2>Project controls</h2><div class="inline"><button class="btn" data-action="import-work">↑ Import a saved working JSON</button><button class="btn" data-action="restart">+ Start another CAT</button></div></div>`;}
function validate(){const d=S.model,issues=[];if(!d)return[];
 if(!d.meta.members.some(m=>m.name))issues.push('Add your name (and group number for CAT 1 or CAT 2) in the official form.');
 if(d.s2_1.databases.filter(x=>x.name).length<3)issues.push('At least three databases should be documented.');
 if(d.s2_2.steps.filter(x=>x.code).length<5)issues.push('Document at least five search steps.');
 const codes=d.s2_2.steps.map(s=>s.code).join(' ').toLowerCase();if(!codes.includes('meta-analysis')||!codes.includes('systematic review'))issues.push('Search expressions should cover systematic reviews and meta-analyses.');
 if(!d.s2_2.steps.some(s=>Object.values(s.hits||{}).some(x=>typeof x==='number')))issues.push('No actual database hit counts recorded. Run and document the searches.');
 if(d.s2_3.evidence.length<5||d.s2_3.evidence.length>12)issues.push('The official form expects approximately 5–10, accepting 5–12 evidence items.');
 d.s2_3.evidence.forEach(e=>{if(!e.band)issues.push(`Evidence #${e.ev_id} has no research-design band.`);if(!e.citation)issues.push(`Evidence #${e.ev_id} has no citation.`);});
 d.s3.assessment.forEach(a=>{if(!a.rd)issues.push(`Evidence #${a.ev_id} has no research-design code.`);if(!a.key_findings)issues.push(`Evidence #${a.ev_id} has no verified findings.`);});
 if(!d.s4_3.credibility_level)issues.push('Credibility assessment remains unrated.');
 const recs=[...d.s6_1.short_term.recommendations,...d.s6_1.mid_long_term.recommendations].filter(x=>x.headline);
 if(recs.length<3||recs.length>5)issues.push('Provide 3–5 action recommendations total.');
 recs.forEach((r,i)=>{if(!r.ev_ids.length&&!r.actions.some(a=>a.ev_ids.length))issues.push(`Recommendation ${i+1} is not linked to an evidence ID.`);});
 if(d.meta.round!=='CAT2'&&d.s5_2.links.every(x=>!x.ev_ids.length))issues.push('All logic-model paths are assumptions, with no evidence-backed path.');
 if(d.references.length<d.s2_3.evidence.length)issues.push('Reference list is shorter than evidence list.');
 return issues;
}
function render(){if(!S.model)setup();else layout();renderChat();}
function download(name,content,type='application/json'){const blob=new Blob([content],{type});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1200);}
function exportJSON(){const data=structuredClone(S.model);data.s4_1.cat_question_restated=data.s1_2.question;data.s3.assessment.forEach((a,i)=>a.lv=data.s2_3.evidence[i]?.lv||'');download(`${data.meta.round}_2026F_${slug(data.meta.topic)}_working.json`,JSON.stringify(data,null,2));showToast('Working JSON downloaded. Import it in the official CAT form.');}
function ensureAssessment(){const d=S.model;d.s3.assessment=d.s2_3.evidence.map(e=>d.s3.assessment.find(x=>x.ev_id===e.ev_id)||({ev_id:e.ev_id,rd:'',lv:e.lv,picoc_map:{p:'',i:'',c:'',th:'',o:'',oc:''},effect_size:{magnitude:'',details:''},key_findings:'',policy_implications:''}));}
function relevel(i){const e=S.model.s2_3.evidence[i];if(!e)return;e.lv=e.band==='F'?'F':e.band+(e.pm||'');S.model.s3.assessment[i].lv=e.lv;}
function addEvidence(p){const d=S.model;const doi=p?.doi||'';if(doi && d.s2_3.evidence.some(e=>e.doi===doi)){showToast('This DOI is already on the evidence list.');return;}
 const id=d.s2_3.evidence.reduce((m,e)=>Math.max(m,e.ev_id),0)+1;
 const cite=p?`${(p.authors||[]).join(', ')||'Author not verified'} (${p.year||'n.d.'}). ${p.title||'Untitled'}. ${p.journal||'Journal not verified'}. ${p.doi? 'https://doi.org/'+p.doi:''}`:'';
 d.s2_3.evidence.push({ev_id:id,band:'',pm:'',lv:'',citation:cite,doi,comment:'Candidate only. Verify full text, study design, comparison structure and effect estimates before assigning a grade.'});
 ensureAssessment();S.selected=d.s2_3.evidence.length-1;S.active='appraisal';persist();render();showToast('Candidate added. Study is ungraded until you verify the source.');}
function normalizeDoi(d){return String(d||'').trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,'').toLowerCase();}
function addLibrary(list){const seen=new Set(S.library.map(p=>normalizeDoi(p.doi)||String(p.title||'').toLowerCase()));let added=0;
 for(const p of list){const key=normalizeDoi(p.doi)||String(p.title||'').toLowerCase();if(!key||seen.has(key))continue;seen.add(key);S.library.push(p);added++;}
 persist();render();showToast(`${added} new candidate record(s) added. No evidence grades assigned.`);}
function parseRIS(text){const items=[];let p=null;for(const line of text.split(/\r?\n/)){
 const m=line.match(/^([A-Z0-9]{2})\s*-\s*(.+)$/);if(!m)continue;const [_,tag,value]=m;
 if(tag==='TY'){p={title:'',authors:[],year:'',journal:'',doi:'',abstract:'',url:''};continue;}if(!p)continue;
 if(tag==='ER'){if(p.title)items.push(p);p=null;continue;}
 if(tag==='TI'||tag==='T1')p.title=value;else if(tag==='AU'||tag==='A1')p.authors.push(value);else if(tag==='PY'||tag==='Y1')p.year=(value.match(/\d{4}/)||[])[0]||'';else if(['JO','JF','T2'].includes(tag))p.journal=value;else if(tag==='DO')p.doi=normalizeDoi(value);else if(tag==='AB')p.abstract=value;else if(tag==='UR')p.url=value;
 }if(p?.title)items.push(p);return items;}
function invertedAbstract(index){if(!index)return'';const slots=[];for(const [w,idxs] of Object.entries(index))for(const i of idxs)slots[i]=w;return slots.join(' ');}
async function runOpenAlex(){const q=infer(S.model.meta.topic,S.model.s1_2.question);S.searchLoading=true;render();try{
 const query=[q.synI[0],q.synO[0]].join(' ');const url='https://api.openalex.org/works?search='+encodeURIComponent(query)+'&per-page=12&filter=type:article';
 const response=await fetch(url,{headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`HTTP ${response.status}`);
 const j=await response.json();const list=(j.results||[]).map(w=>({title:w.display_name,authors:(w.authorships||[]).slice(0,9).map(a=>a.author?.display_name).filter(Boolean),year:String(w.publication_year||''),journal:w.primary_location?.source?.display_name||'',doi:normalizeDoi(w.doi),abstract:invertedAbstract(w.abstract_inverted_index),url:w.primary_location?.landing_page_url||w.doi||w.id}));
 S.searchLoading=false;addLibrary(list);
 }catch(e){S.searchLoading=false;render();showToast('OpenAlex lookup was unavailable. You can import a RIS file instead. '+e.message);}}
function validIds(s){const live=new Set(S.model.s2_3.evidence.map(e=>e.ev_id));return String(s||'').split(/[ ,;]+/).map(x=>Number(x)).filter(x=>Number.isInteger(x)&&live.has(x));}
function removeEvidence(i){const d=S.model;if(!confirm('Remove this evidence record? You can restore it from a backup.'))return;const old=d.s2_3.evidence[i]?.ev_id;d.s2_3.evidence.splice(i,1);d.s3.assessment=d.s3.assessment.filter(a=>a.ev_id!==old);d.s2_2.steps.forEach(s=>s.found_ev_ids=s.found_ev_ids.filter(x=>x!==old));BANDS.forEach(b=>['supporting','conflicting'].forEach(k=>{d.s4_2[b][k].ev_ids=d.s4_2[b][k].ev_ids.filter(x=>x!==old);}));d.s5_2.links.forEach(l=>l.ev_ids=l.ev_ids.filter(x=>x!==old));S.selected=undefined;persist();render();}
function onClick(e){const t=e.target.closest('[data-action]');if(!t)return;const action=t.dataset.action, idx=Number(t.dataset.index);const model=S.model;
 switch(action){
  case 'ai-open': toggleChat(true);break;
  case 'auto-start':S.active='auto';persist();render();break;
  case 'auto-run':autoRun();break;
  case 'auto-screen':autoScreen();break;
  case 'auto-draft':autoDraft();break;
  case 'auto-transfer':autoTransfer();break;
  case 'auto-record':autoRecord();break;
  case 'auto-audit':autoAudit();break;
  case 'auto-filter':autoFilter(t.dataset.filter);break;
  case 'auto-apply':autoApply(t.dataset.field);break;
  case 'auto-apply-all':autoApply(null,true);break;
  case 'round': S.round=t.dataset.round;persist(); if(!S.model){ROOT.querySelectorAll('.round-opt').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.round===S.round)));} else render();break;
  case 'generate':{
   const topic=$('#topic')?.value?.trim(),question=$('#question')?.value?.trim();if(!topic||!question){showToast('Please enter both the topic and CAT question.');return;}
   S.model=newModel(topic,question,S.round);S.auto=autoFresh();S.library=[];S.active='overview';S.selected=undefined;persist();render();break;}
  case 'resume':S.active='overview';render();break;
  case 'nav':S.active=t.dataset.section;persist();render();window.scrollTo(0,0);break;
  case 'backup':exportJSON();break;
  case 'copy-query':{const q=model.s2_2.steps[idx]?.code;if(navigator.clipboard?.writeText)navigator.clipboard.writeText(q).then(()=>showToast('Search expression copied.')).catch(()=>showToast('Copy not available in this browser.'));else showToast('Select and copy the query from the textbox.');break;}
  case 'add-db':model.s2_1.databases.push({db_id:'DB'+(model.s2_1.databases.length+1),name:'',peer_reviewed:true,language:'',year_range:'',reason:''});persist();render();break;
  case 'add-step':model.s2_2.steps.push({no:model.s2_2.steps.length+1,code:'',hits:{},final_count:0,result_note:'Search not yet executed.',found_ev_ids:[]});persist();render();break;
  case 'openalex':runOpenAlex();break;
  case 'import-ris':$('#import-ris').click();break;
  case 'blank-evidence':addEvidence();break;
  case 'add-evidence':addEvidence(S.library[idx]);break;
  case 'edit-evidence':S.selected=idx;persist();render();setTimeout(()=>$('#evidence-detail')?.scrollIntoView({behavior:'smooth',block:'start'}),100);break;
  case 'remove-evidence':removeEvidence(idx);break;
  case 'add-node':{const nodes=model.s5_1.nodes,n=nodes.reduce((m,x)=>Math.max(m,parseInt(x.node_id.slice(1))||0),0)+1;nodes.push({node_id:'N'+n,label:'New node',note:'Define this pathway component.'});persist();render();break;}
  case 'add-link':{const n=model.s5_1.nodes;model.s5_2.links.push({from:n[0]?.node_id||'',to:n[1]?.node_id||'',direction:'?',ev_ids:[],mechanism:'Hypothesized link; evidence pending.'});persist();render();break;}
  case 'pull-refs':{const have=new Set(model.references);for(const r of model.s2_3.evidence){if(r.citation&&!have.has(r.citation)){model.references.push(r.citation);have.add(r.citation);}}persist();render();showToast('Evidence citations added where missing. Verify APA formatting manually.');break;}
  case 'import-work':$('#import-work').click();break;
  case 'restart':if(confirm('Start a new CAT? Download a JSON backup first if you wish to keep this work.')){S.model=null;S.auto=autoFresh();S.library=[];S.active='overview';persist();render();}break;
  case 'reinfer':if(confirm('Regenerate the draft? This replaces edited fields and clears evidence. Export a JSON backup first.')){const d=S.model;S.model=newModel(d.meta.topic,d.s1_2.question,d.meta.round);S.auto=autoFresh();S.library=[];S.selected=undefined;persist();render();}break;
 }
}
function onInput(e){const t=e.target;if(!S.model)return;const p=t.dataset.path;if(p){let v=t.dataset.lines==='1'?asLines(t.value):t.value;if(t.type==='number')v=t.value===''?null:Number(t.value);set(S.model,p,v);if(p==='s1_2.question')S.model.s4_1.cat_question_restated=v;if(t.dataset.grade!==undefined){const i=+t.dataset.grade;relevel(i);persist();render();return;}persist();return;}
 if(t.dataset.idsPath){set(S.model,t.dataset.idsPath,validIds(t.value));persist();return;}}
ROOT.addEventListener('change',e=>{const t=e.target;if(t.matches('[data-auto-check]'))autoToggle(t.dataset.autoCheck,t.checked);});
ROOT.addEventListener('click',onClick);ROOT.addEventListener('input',onInput);ROOT.addEventListener('change',onInput);
$('#import-work').addEventListener('change',async function(){const f=this.files[0];if(!f)return;try{const j=JSON.parse(await f.text());if(j.schema_version!=='1.2'||!j.s2_3||!j.meta?.round)throw Error('Not an official schema 1.2 CAT working JSON.');S.model=j;S.round=j.meta.round;S.active='overview';S.auto=autoFresh();S.library=[];S.selected=undefined;ensureAssessment();persist();render();showToast('Official schema 1.2 working file imported.');}catch(e){showToast('Unable to load the working file: '+e.message);}this.value='';});
$('#import-ris').addEventListener('change',async function(){let records=[];for(const f of this.files){const body=await f.text();if(f.name.toLowerCase().endsWith('.json')){try{const j=JSON.parse(body);records.push(...(Array.isArray(j)?j:[]));}catch(e){}}else records.push(...parseRIS(body));}addLibrary(records);this.value='';});
/* CAT Copilot: optional live OpenAI Responses API via a separate, server-side proxy.
   No API keys are sent to, stored in, or requested from the browser.
   The official CAT 2026 JSON schema is unchanged. */
const CHAT_ROOT = document.getElementById('cat-assistant-root');
const CHAT = {open:false,health:false,enabled:false,model:'',checking:false,busy:false,history:[],input:'',target:'',error:'',draft:null};
const CHAT_CHOICES = [
 ['','Just discuss — do not edit the form'],
 ['s1_1.decision_issue','I · Decision issue'],
 ['s1_1.application_context','I · Application context'],
 ['s1_2.question','I · CAT question'],
 ['s2_3.selection_note','II · Evidence selection explanation'],
 ['s3.table_note','III · Study assessment note'],
 ['s4_1.conclusion','IV · CAT conclusion'],
 ['s4_1.key_findings','IV · Key findings'],
 ['s4_1.boundary_conditions','IV · Boundary conditions'],
 ['s4_1.conflicting_findings','IV · Conflicting findings'],
 ['s4_1.additional_considerations','IV · Additional considerations'],
 ['s4_3.strengths','IV · CAT strengths'],
 ['s4_3.weaknesses','IV · CAT weaknesses'],
 ['s4_3.credibility_reason','IV · Credibility reasons']
];
const CHAT_PROMPTS = [
 ['Review PICOC','Review my research question and PICOC against the 2026 CAT3 rubric. Identify ambiguity and give concrete corrections.'],
 ['Search strategy','Critique the planned database search codes. Improve synonyms, Boolean syntax and traceability without inventing database hit counts.'],
 ['Study appraisal','Explain how to distinguish research design, evidence level A–F, and effect size for this CAT. Do not infer findings without full text.'],
 ['Find gaps','Audit the current CAT draft for unsupported conclusions, empty fields, missing source traceability and policy-logic inconsistencies.']
];
function chatAllowedTarget(value){return CHAT_CHOICES.some(([path])=>path===value);}
function chatContext(){
 if(!S.model)return {round:S.round,topic:'',question:'',active_section:'setup'};
 const d=S.model,active=S.active;
 const sections={question:{issue:d.s1_1,picoc:d.s1_3},search:{databases:d.s2_1.databases,steps:d.s2_2.steps},appraisal:{assessment:d.s3.assessment},synthesis:{conclusion:d.s4_1,by_level:d.s4_2,credibility:d.s4_3},logic:{nodes:d.s5_1.nodes,links:d.s5_2.links},decisions:d.s6_1};
 const studied=d.s2_3.evidence.slice(0,15).map(e=>({id:e.ev_id,reference:e.citation,doi:e.doi,level:e.lv,comment:e.comment}));
 const papers=S.library.slice(0,7).map(p=>({title:p.title,doi:p.doi,year:p.year,abstract:String(p.abstract||'').slice(0,420)}));
 return {round:d.meta.round,topic:d.meta.topic,question:d.s1_2.question,active_section:active,section_draft:sections[active]||{problem:d.s1_1,summary:d.s4_1},evidence_items:studied,imported_candidate_records:papers,source_warning:'These are user-entered drafts or imported bibliographic records; full-text findings have not been independently verified.'};
}
function chatPromptForClipboard(message){
 const instruction='You are an academic CAT research assistant for the SNU Fall 2026 CAT 1/2/3 template (schema 1.2). Follow PICOC = Population, Input, Context (Condition), Output, outCome. The study-level assessment uses P, I, (C), (Th), O, (C). Research levels A–F depend on control structure; +/- reflect within-band quality. Distinguish actual search results from plans, fertility intentions from actual births, and hypotheses from verified evidence. Never invent article details, references, effect sizes, search counts or causal findings. Propose precise edits and acknowledge uncertainties.';
 return `${instruction}\n\nCURRENT CAT CONTEXT (user-provided draft, not verified):\n${JSON.stringify(chatContext(),null,2)}\n\nUSER REQUEST:\n${message}`;
}
async function chatHealth(){
 if(CHAT.checking)return;
 CHAT.checking=true;renderChat();
 try{
  const r=await fetch('/api/health',{cache:'no-store',signal:AbortSignal.timeout(5000)});
  if(!r.ok)throw new Error('No server');
  const j=await r.json();CHAT.enabled=!!j.configured;CHAT.model=String(j.model||'');
 }catch(e){CHAT.enabled=false;CHAT.model='';}
 CHAT.checking=false;CHAT.health=true;renderChat();
}
function toggleChat(open){CHAT.open=open;renderChat();if(open&&!CHAT.health)chatHealth();if(open)setTimeout(()=>CHAT_ROOT?.querySelector('#cat-chat-text')?.focus(),50);}
function renderChat(){
 if(!CHAT_ROOT)return;
 const status=CHAT.checking?'Checking connection…':CHAT.enabled?`Connected · ${CHAT.model}`:'Demo mode · connect API for live chat';
 const msgs=CHAT.history.length?CHAT.history.map((m,i)=>`<div class="cat-chat-message ${m.role==='user'?'from-user':'from-ai'}"><span class="cat-chat-role">${m.role==='user'?'You':'CAT Copilot'}</span><div class="cat-chat-bubble">${esc(m.content)}</div>${m.role==='assistant'&&m.target&&chatAllowedTarget(m.target)?`<button class="cat-chat-apply" type="button" data-chat-action="apply" data-msg="${i}">Apply to ${esc(CHAT_CHOICES.find(c=>c[0]===m.target)?.[1]||'field')} ↗</button>`:''}</div>`).join(''):
 `<div class="cat-chat-welcome"><span class="cat-chat-hero">✦</span><h3>Meet your CAT Copilot</h3><p>Ask about research design, PICOC, evidence appraisal, or your current section. Suggestions are drafts and never overwrite your CAT without your approval.</p></div>`;
 CHAT_ROOT.innerHTML=`<button class="cat-chat-launcher ${CHAT.open?'is-open':''}" id="cat-chat-launch" type="button" data-chat-action="toggle" aria-expanded="${CHAT.open}" aria-controls="cat-chat-panel" aria-label="${CHAT.open?'Close':'Open'} CAT Copilot">${CHAT.open?'×':'✦'}<span>${CHAT.open?'Close':'Ask AI'}</span></button>
 <aside id="cat-chat-panel" class="cat-chat-panel ${CHAT.open?'is-open':''}" role="dialog" aria-label="CAT Copilot assistant" aria-modal="false" ${CHAT.open?'':'inert'}>
   <div class="cat-chat-head"><div class="cat-chat-avatar">✦</div><div><strong>CAT Copilot</strong><div class="cat-chat-status"><span class="cat-chat-dot ${CHAT.enabled?'online':'offline'}"></span>${esc(status)}</div></div><div class="cat-chat-top-actions"><button type="button" data-chat-action="clear" title="Clear chat history" aria-label="Clear chat history">↺</button><button type="button" data-chat-action="toggle" title="Close" aria-label="Close chat">×</button></div></div>
   <div class="cat-chat-privacy">${CHAT.enabled?'Connected to OpenAI API through your secure server. Avoid including private or confidential source material.':'Live AI requires the optional server and an OpenAI API key. You can copy your prepared prompt into ChatGPT without configuring the API.'}</div>
   <div id="cat-chat-messages" class="cat-chat-messages" aria-live="polite">${msgs}${CHAT.busy?'<div class="cat-chat-message from-ai"><span class="cat-chat-role">CAT Copilot</span><div class="cat-chat-bubble cat-chat-thinking">Preparing a careful response…</div></div>':''}</div>
   <div class="cat-chat-prompt-row">${CHAT_PROMPTS.map(([title,prompt],i)=>`<button type="button" data-chat-action="quick" data-quick="${i}">${esc(title)}</button>`).join('')}</div>
   <div class="cat-chat-compose">
     <label for="cat-chat-target">Suggested answer destination</label>
     <select id="cat-chat-target" aria-label="Select form destination">${CHAT_CHOICES.map(([path,label])=>`<option value="${esc(path)}"${CHAT.target===path?' selected':''}>${esc(label)}</option>`).join('')}</select>
     <label for="cat-chat-text" class="sr-only">Your message</label><textarea id="cat-chat-text" rows="3" placeholder="Ask a CAT research question, or request a draft for the selected field…" maxlength="4000">${esc(CHAT.input)}</textarea>
     ${CHAT.error?`<div class="cat-chat-error" role="alert">${esc(CHAT.error)}</div>`:''}
     <div class="cat-chat-send-row"><span>${CHAT.enabled?'Enter to send · Shift+Enter for a new line':'No key? Copy a ready-to-use prompt.'}</span><button class="cat-chat-copy" type="button" data-chat-action="copy">Copy prompt</button><button class="cat-chat-send" type="button" data-chat-action="send" ${!CHAT.enabled||CHAT.busy?'disabled':''}>${CHAT.busy?'Working…':'Send ↗'}</button></div>
   </div>
 </aside>`;
 if(CHAT.open){const view=CHAT_ROOT.querySelector('#cat-chat-messages');if(view)view.scrollTop=view.scrollHeight;}
}
async function chatSend(){
 const input=CHAT.input.trim();if(!input||CHAT.busy)return;
 if(!CHAT.enabled){CHAT.error='Live chat is not configured. Use Copy prompt or start the API server.';renderChat();return;}
 CHAT.busy=true;CHAT.error='';
 const prior=CHAT.history.slice(-12).map(x=>({role:x.role,content:x.content}));
 const selected=CHAT.target;
 CHAT.history.push({role:'user',content:input});CHAT.input='';renderChat();
 try{
  const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:input,history:prior,context:chatContext(),target:selected})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.error||`Server error ${r.status}`);
  if(!data.answer||typeof data.answer!=='string')throw new Error('The model returned an empty response.');
  CHAT.history.push({role:'assistant',content:data.answer,target:selected});
 }catch(e){CHAT.history.pop();CHAT.input=input;CHAT.error='Message could not be sent: '+e.message;}
 CHAT.busy=false;renderChat();
}
async function chatCopy(){
 const message=CHAT.input.trim()||'Review my current CAT question and provide actionable improvements.';
 const all=chatPromptForClipboard(message);
 try{await navigator.clipboard.writeText(all);showToast('CAT context and prompt copied. Paste them into ChatGPT.');CHAT.error='';}
 catch(e){CHAT.error='Clipboard access is unavailable here. Run the website on localhost or copy from the text field.';}
 renderChat();
}
function applyChatDraft(index){
 const m=CHAT.history[index];if(!m||m.role!=='assistant'||!chatAllowedTarget(m.target)||!m.target){return;}
 if(!S.model){CHAT.error='Create a CAT workspace before applying suggestions.';renderChat();return;}
 let current=get(S.model,m.target);
 if(current===undefined){CHAT.error='This field is unavailable in the active CAT.';renderChat();return;}
 const label=CHAT_CHOICES.find(x=>x[0]===m.target)?.[1]||m.target;
 if(!confirm(`Replace the current content of “${label}” with this AI-generated draft? Review and verify it before submission.`))return;
 const text=m.content.replace(/^```(?:text|markdown)?\s*/i,'').replace(/\s*```$/,'').trim();
 const isList=Array.isArray(current);
 set(S.model,m.target,isList?asLines(text).map(s=>s.replace(/^\s*(?:[-*•]|\d+[.)])\s*/,'')):text);
 if(m.target==='s1_2.question')S.model.s4_1.cat_question_restated=text;
 persist();render();showToast('Draft applied to '+label+'. Review it before submission.');
}
CHAT_ROOT?.addEventListener('click',e=>{
 const b=e.target.closest('[data-chat-action]');if(!b)return;
 switch(b.dataset.chatAction){
 case 'toggle':toggleChat(!CHAT.open);break;
 case 'quick':CHAT.input=CHAT_PROMPTS[Number(b.dataset.quick)]?.[1]||'';CHAT.error='';renderChat();CHAT_ROOT.querySelector('#cat-chat-text')?.focus();break;
 case 'clear':if(!CHAT.history.length||confirm('Clear the conversation from this browser session?')){CHAT.history=[];CHAT.error='';renderChat();}break;
 case 'send':chatSend();break;
 case 'copy':chatCopy();break;
 case 'apply':applyChatDraft(Number(b.dataset.msg));break;
 }
});
CHAT_ROOT?.addEventListener('input',e=>{if(e.target.id==='cat-chat-text')CHAT.input=e.target.value;});
CHAT_ROOT?.addEventListener('change',e=>{if(e.target.id==='cat-chat-target')CHAT.target=chatAllowedTarget(e.target.value)?e.target.value:'';});
CHAT_ROOT?.addEventListener('keydown',e=>{if(e.target.id==='cat-chat-text'&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();chatSend();}else if(e.key==='Escape'&&CHAT.open){toggleChat(false);}});
document.addEventListener('keydown',e=>{if(CHAT.open&&e.key==='Escape'&&e.target.id!=='cat-chat-text')toggleChat(false);});
render();

