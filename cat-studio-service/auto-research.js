
'use strict';
/* CAT Auto-Research UI: evidence-led discovery, provisional screening and confirmed draft application.
 * Loaded before app.js; functions execute after app.js has created the shared workspace state. */
function autoFresh(){return {status:'idle',phase:'',records:[],queries:[],filter:'all',errors:[],screened:false,screen_model:'',draft:null,draft_model:'',searched_at:'',last_transfer:0};}
function autoState(){if(!S.auto||typeof S.auto!=='object')S.auto=autoFresh();return S.auto;}
function safeExternalURL(value){try{const u=new URL(String(value||''));return /^https?:$/.test(u.protocol)?u.href:'';}catch{return '';}}
function autoTag(record){
 const st=record.screening?.status;
 const labels={possible:'Possible match',unclear:'Needs checking',unlikely:'Likely out of scope'};
 return st?`<span class="tag ${st==='possible'?'ok':st==='unlikely'?'pending':'info'}">${labels[st]}</span>`:'<span class="tag pending">Not screened</span>';
}
function autoCount(st){return autoState().records.filter(r=>r.screening?.status===st).length;}
function autoSelected(){return autoState().records.filter(r=>r.shortlisted);}
function autoRender(){
 const a=autoState(),d=S.model;
 const working=a.phase==='discovering'||a.phase==='screening'||a.phase==='drafting';
 const visible=a.records.filter(p=>a.filter==='all'||(a.filter==='shortlisted'&&p.shortlisted)||p.screening?.status===a.filter);
 const searched=a.queries.length>0;
 const queryRows=a.queries.map(q=>`<div class="auto-query-row"><span>${esc(q.query)}</span><strong>${q.error?'Unavailable':typeof q.count==='number'?q.count.toLocaleString()+' hits':'Not reported'}</strong>${q.error?`<small role="alert">${esc(q.error)}</small>`:''}</div>`).join('');
 const papers=visible.map(p=>{
  const link=safeExternalURL(p.url);
  return `<article class="auto-paper ${p.shortlisted?'is-selected':''}">
     <div class="auto-paper-main"><label class="auto-check"><input type="checkbox" data-auto-check="${esc(p.ref_id)}" ${p.shortlisted?'checked':''} aria-label="Shortlist ${esc(p.title)}"><span>Shortlist</span></label>
     <div class="auto-paper-body"><div class="auto-paper-heading"><span class="ref-chip">${esc(p.ref_id)}</span>${autoTag(p)}<span class="tag info">${esc(String(p.year||'Year unknown'))}</span></div>
     <h3>${esc(p.title||'Untitled')}</h3><div class="auto-source-line">${esc((p.authors||[]).slice(0,3).join(', ')||'Authors not provided')} · ${esc(p.journal||'Journal not confirmed')}</div>
     ${p.abstract?`<p class="auto-abstract">${esc(p.abstract.slice(0,650))}${p.abstract.length>650?'…':''}</p>`:'<p class="auto-abstract muted">Abstract unavailable: title-only appraisal would be unreliable.</p>'}
     ${p.screening?.reason?`<div class="auto-screening"><b>Preliminary screen:</b> ${esc(p.screening.reason)}${p.screening.design_hint?` · <i>Possible design: ${esc(p.screening.design_hint)}</i>`:''}</div>`:''}
     <div class="auto-paper-links">${p.doi?`<span>DOI: ${esc(p.doi)}</span>`:''}${link?`<a href="${esc(link)}" target="_blank" rel="noopener noreferrer">View source ↗</a>`:''}<span>${esc(p.source||'OpenAlex')} metadata · peer review unverified</span></div></div></div>
  </article>`;
 }).join('');
 const draft=a.draft?.fields;
 const draftPaths={decision_issue:'s1_1.decision_issue',application_context:'s1_1.application_context',selection_note:'s2_3.selection_note',conclusion:'s4_1.conclusion',key_findings:'s4_1.key_findings',boundary_conditions:'s4_1.boundary_conditions',conflicting_findings:'s4_1.conflicting_findings',weaknesses:'s4_3.weaknesses',credibility_reason:'s4_3.credibility_reason'};
 const draftLabels={decision_issue:'1.1 Decision issue',application_context:'1.1 Application context',selection_note:'2.3 Screening rationale',conclusion:'4.1 Conclusion',key_findings:'4.1 Key findings',boundary_conditions:'4.1 Boundary conditions',conflicting_findings:'4.1 Conflicting findings',weaknesses:'4.3 CAT weaknesses',credibility_reason:'4.3 Credibility rationale'};
 return `${head('AI research workspace','From question to evidence-backed draft','One guided pipeline: discover published records, screen abstracts provisionally, then prepare editable CAT text. Every source remains inspectable.')}
 <div class="auto-intro"><div class="auto-intro-left"><span class="kicker">RESEARCH WORKFLOW</span><h2>Research intelligently.<br><span>Verify confidently.</span></h2><p>Uses your existing <b>topic + CAT question</b>. No new form to complete. Academic findings are not assumed from search hits.</p><div class="auto-intro-actions"><button class="btn primary" data-action="auto-run" ${working?'disabled':''}>${a.phase==='discovering'?'Searching sources…':a.phase==='screening'?'AI screening…':'✦ Run Auto-Research'}</button><button class="btn" data-action="nav" data-section="question">Review PICOC ↗</button></div><small>Live discovery requires the local server and an internet connection. AI screening and drafting require a server-side OpenAI API key.</small></div>
  <div class="auto-steps"><div class="auto-step ${searched?'done':working?'active':''}"><span>01</span><div><strong>Discover</strong><small>Real bibliographic records + DOI</small></div><b>${searched?'✓':''}</b></div><div class="auto-step ${a.screened?'done':a.phase==='screening'?'active':''}"><span>02</span><div><strong>Screen</strong><small>AI preliminary relevance, not appraisal</small></div><b>${a.screened?'✓':''}</b></div><div class="auto-step ${draft?'done':a.phase==='drafting'?'active':''}"><span>03</span><div><strong>Draft & review</strong><small>Confirm each change to your CAT</small></div><b>${draft?'✓':''}</b></div></div></div>
 ${a.phase?`<div class="auto-live ${working?'is-loading':''}" role="status"><span>${working?'◌':'✓'}</span><div><strong>${esc(a.status)}</strong><small>${esc(a.phase==='discovering'?'Retrieving real metadata from OpenAlex.':a.phase==='screening'?'Checking abstracts with the optional AI service.':a.phase==='drafting'?'Preparing a provisional answer with cited source IDs.':'Your current research snapshot is saved locally.')}</small></div></div>`:''}
 ${a.errors.length?`<div class="auto-alert" role="alert">${a.errors.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:''}
 <div class="grid g4 auto-metrics"><div class="stat"><div class="lbl">Unique publications</div><div class="num">${a.records.length}</div><div class="detail">Metadata candidates</div></div><div class="stat"><div class="lbl">Possible relevance</div><div class="num">${autoCount('possible')}</div><div class="detail">Preliminary only</div></div><div class="stat"><div class="lbl">Need full review</div><div class="num">${autoCount('unclear')+a.records.filter(r=>!r.screening).length}</div><div class="detail">Not yet appraised</div></div><div class="stat"><div class="lbl">Shortlisted</div><div class="num">${autoSelected().length}</div><div class="detail">For editorial review</div></div></div>
 <div class="grid g2"><div class="card"><div class="card-head"><div><h2>Executed public discovery</h2><p class="card-sub">${a.searched_at?'Search date: '+esc(a.searched_at.slice(0,10)):'Searches are not yet executed.'}</p></div><span class="tag ${searched?'ok':'pending'}">${searched?'OpenAlex':'Not run'}</span></div>${searched?`<div class="auto-query-list">${queryRows}</div><p class="mini">Hit counts belong ONLY to these OpenAlex queries; they must not be recorded as ProQuest, Scopus, or ScienceDirect results. Returned records are capped and deduplicated.</p>`:'<div class="auto-empty-small">Start discovery to record exact source queries and the counts actually reported by OpenAlex.</div>'}<div class="inline auto-block-actions"><button class="btn sm" data-action="auto-record" ${!searched?'disabled':''}>Record OpenAlex steps in §2.2</button><button class="btn sm" data-action="auto-audit" ${!searched?'disabled':''}>↓ Research audit</button></div></div>
 <div class="card"><div class="card-head"><div><h2>Next actions</h2><p class="card-sub">Keep each step separate and accountable.</p></div></div><div class="auto-action-grid"><div><b>AI screen the publications</b><p>Rates title/abstract relevance, not causal effect or evidence quality.</p><button class="btn sm" data-action="auto-screen" ${!a.records.length||working?'disabled':''}>✦ Screen with AI</button></div><div><b>Create CAT prose draft</b><p>Uses only your shortlisted sources; never fabricates effect sizes or database hits.</p><button class="btn sm" data-action="auto-draft" ${!autoSelected().length||working?'disabled':''}>✦ Draft from selected sources</button></div><div><b>Transfer to appraisal</b><p>Add citation records as ungraded evidence; verify full texts before final use.</p><button class="btn sm" data-action="auto-transfer" ${!autoSelected().length||working?'disabled':''}>+ Add shortlisted to §2.3</button></div></div></div></div>
 <div class="card auto-library"><div class="card-head"><div><h2>Academic source library</h2><p class="card-sub">${visible.length} shown of ${a.records.length} publications. Tick only records worth full-text eligibility checks.</p></div><div class="auto-filters">${[['all','All'],['possible','Possible'],['unclear','Unclear'],['shortlisted','Shortlisted']].map(([v,l])=>`<button class="auto-filter ${a.filter===v?'is-on':''}" data-action="auto-filter" data-filter="${v}">${l}</button>`).join('')}</div></div>
 ${papers||`<div class="auto-empty"><span>⌕</span><strong>No sources to show</strong><p>${searched?'Try another filter, rerun discovery, or import RIS records in section II.':'Start Auto-Research to retrieve actual academic publication records.'}</p></div>`}</div>
 ${draft?`<div class="card auto-draft"><div class="card-head"><div><h2>Provisional AI CAT draft</h2><p class="card-sub">From ${a.draft.source_ids?.length||0} selected record(s). Always verify wording, eligibility, and original articles.</p></div><span class="tag pending">Not submission-ready</span></div><div class="auto-draft-note">Suggestions are shown before applying them. No study grades, numerical effects, or unexecuted database counts are filled in automatically.</div><div class="auto-draft-grid">${Object.entries(draft).filter(([k,v])=>draftPaths[k]&&v.length).map(([key,val])=>`<div class="auto-draft-field"><div class="row-between"><strong>${esc(draftLabels[key])}</strong><button class="btn sm" data-action="auto-apply" data-field="${esc(key)}">Apply to form ↗</button></div><ul>${val.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></div>`).join('')}</div><button class="btn primary" data-action="auto-apply-all">Apply reviewed draft to form</button><p class="mini" style="margin-top:10px">Drafts are editable; applying requires confirmation and never assigns a study evidence level or effect size.</p></div>`:''}
 <div class="auto-footer-note"><strong>Transparency rule:</strong> OpenAlex provides discovery records; it does not authenticate access to subscribed databases, establish peer review, or substitute for original study appraisal. A completed CAT still requires source verification, correct research design, effect estimates, transparent search logs and a defensible synthesis.</div>`;
}
async function autoPost(endpoint,body){const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});let j={};try{j=await res.json();}catch{}if(!res.ok)throw Error(j.error||`Research service returned HTTP ${res.status}.`);return j;}
async function autoAvailable(){try{const r=await fetch('/api/health');if(!r.ok)throw Error();const j=await r.json();return j.configured===true;}catch{return false;}}
function autoQueries(){const g=infer(S.model.meta.topic,S.model.s1_2.question);
 const text=(g.synI||[]).filter(Boolean),out=(g.synO||[]).filter(s=>!s.includes('screen separately'));
 return [...new Set([[text[0],out[0]],[text[1]||text[0],out[1]||out[0]],['systematic review',text[0],out[0]]].map(xs=>xs.filter(Boolean).join(' ')))];}
async function autoRun(){if(!S.model)return;const old=autoState();if(old.records.length&&!confirm('Run academic discovery again? The previous Auto-Research source list and AI draft will be replaced. Current CAT evidence and sections will remain unchanged.'))return;
 S.auto=autoFresh();const a=autoState();a.phase='discovering';a.status='Searching scholarly metadata';a.errors=[];persist();render();
 try{
  const result=await autoPost('/api/research',{topic:S.model.meta.topic,question:S.model.s1_2.question,queries:autoQueries()});
  a.queries=result.queries||[];a.records=(result.records||[]).map((p,i)=>({...p,ref_id:'R'+(i+1),shortlisted:false,screening:null}));a.searched_at=result.queried_at||new Date().toISOString();a.phase='ready';a.status=`Found ${a.records.length} distinct publication records`;
  for(const x of a.queries)if(x.error)a.errors.push(`Query “${x.query}” was incomplete: ${x.error}`);
  // Reuse established metadata library, with DOI/title deduplication; no grade assigned.
  const keys=new Set(S.library.map(p=>normalizeDoi(p.doi)||String(p.title||'').toLowerCase()));
  for(const p of a.records){const key=normalizeDoi(p.doi)||p.title.toLowerCase();if(!keys.has(key)){S.library.push(p);keys.add(key);}}
  persist();render();
  if(await autoAvailable() && a.records.length)await autoScreen(true);
 }catch(e){a.phase='error';a.status='Could not retrieve academic records';a.errors.push(e.message+' Start CAT Studio with the local Node server.');persist();render();}
}
async function autoScreen(silent=false){const a=autoState();if(!a.records.length)return;a.phase='screening';a.status='AI is reviewing titles and abstracts';persist();render();
 try{
  const chunkSize=12,chunks=[];for(let i=0;i<a.records.length;i+=chunkSize)chunks.push(a.records.slice(i,i+chunkSize));
  let count=0;
  for(let i=0;i<chunks.length;i++){
    a.status=`AI screening batch ${i+1} of ${chunks.length}`;persist();render();
    try{const result=await autoPost('/api/research/screen',{topic:S.model.meta.topic,question:S.model.s1_2.question,records:chunks[i].map(p=>({...p,id:p.ref_id}))});
      const byId=new Map((result.reviews||[]).map(r=>[r.id,r]));
      for(const p of chunks[i]){p.screening=byId.get(p.ref_id)||null;if(p.screening&&!a.screened)p.shortlisted=p.screening.status==='possible';}
      count+=byId.size;a.screen_model=result.model||'';
    }catch(e){a.errors.push(`Screening batch ${i+1} failed: ${e.message}`);}
    a.screened=count>0;persist();render();
  }
  a.phase='ready';a.status=`AI screened ${count} of ${a.records.length} candidate records; review decisions before inclusion`;
  if(count<a.records.length)a.errors.push(`${a.records.length-count} record(s) still require manual screening.`);
  persist();render();if(!silent)showToast('Preliminary screening completed. Review each paper before including it.');
 }catch(e){a.phase='ready';a.status='Source records available; AI screening unavailable';a.errors.push('AI screening: '+e.message);persist();render();}
}
async function autoDraft(){const a=autoState(),pick=autoSelected().slice(0,12);if(!pick.length){showToast('Shortlist at least one source first.');return;}
 a.phase='drafting';a.status='Generating provisional CAT sections';persist();render();
 try{const draft=await autoPost('/api/research/draft',{topic:S.model.meta.topic,question:S.model.s1_2.question,records:pick.map(p=>({...p,id:p.ref_id}))});
  a.draft=draft;a.draft_model=draft.model||'';a.phase='ready';a.status='Draft prepared for review; source verification is still required';persist();render();
 }catch(e){a.phase='ready';a.status='Draft not generated';a.errors.push('CAT draft: '+e.message);persist();render();}
}
function autoTransfer(){const a=autoState(),sel=autoSelected();if(!sel.length)return;
 if(!confirm(`Add ${sel.length} shortlisted citation records to your CAT evidence list as UNGRADED candidates? They will still require full-text appraisal.`))return;
 const d=S.model,byDoi=new Set(d.s2_3.evidence.map(e=>normalizeDoi(e.doi)).filter(Boolean));
 const byTitle=new Set(d.s2_3.evidence.map(e=>String(e.citation||'').toLowerCase()));let n=0;
 for(const p of sel){const doi=normalizeDoi(p.doi);if(doi&&byDoi.has(doi))continue;if(!doi&&byTitle.has(String(p.title).toLowerCase()))continue;
  const id=d.s2_3.evidence.reduce((m,e)=>Math.max(m,e.ev_id),0)+1;
  const names=(p.authors||[]).slice(0,6).join(', ')||'Authors not confirmed';const citation=`${names} (${p.year||'n.d.'}). ${p.title}. ${p.journal||'[journal to verify]'}.${p.doi?' https://doi.org/'+p.doi:''}`;
  d.s2_3.evidence.push({ev_id:id,band:'',pm:'',lv:'',citation,doi:p.doi||'',comment:`Source: ${p.source||'OpenAlex'} ${p.ref_id}. Preliminary candidate only. Peer review, eligibility, research design and effect sizes require full-text verification.`});
  if(doi)byDoi.add(doi);n++;
 }
 ensureAssessment();a.last_transfer=n;persist();render();showToast(`${n} citation(s) transferred as ungraded evidence candidates.`);
}
const AUTO_FIELD_MAP={decision_issue:'s1_1.decision_issue',application_context:'s1_1.application_context',selection_note:'s2_3.selection_note',conclusion:'s4_1.conclusion',key_findings:'s4_1.key_findings',boundary_conditions:'s4_1.boundary_conditions',conflicting_findings:'s4_1.conflicting_findings',weaknesses:'s4_3.weaknesses',credibility_reason:'s4_3.credibility_reason'};
function autoApply(field,all=false){const a=autoState();if(!a.draft?.fields)return;
 const fields=all?Object.keys(AUTO_FIELD_MAP):[field];const touched=fields.filter(k=>Array.isArray(a.draft.fields[k])&&a.draft.fields[k].length);
 if(!touched.length)return;
 if(!confirm(`Replace ${touched.length} CAT field(s) with provisional, AI-generated text? Previous contents will be overwritten. Study grades, effect sizes, and actual search hit counts are never changed.`))return;
 for(const k of touched)set(S.model,AUTO_FIELD_MAP[k],a.draft.fields[k]);
 persist();render();showToast(`${touched.length} draft field(s) applied. Verify the cited source IDs before submission.`);
}
function autoRecord(){const a=autoState(),m=S.model;if(!a.queries.length)return;
 if(!confirm('Record these executed OpenAlex discovery searches in section 2.2? They will be labeled separately from ProQuest, Scopus and ScienceDirect; only observed hit counts will be entered.'))return;
 let db=m.s2_1.databases.find(x=>x.name==='OpenAlex (discovery index)');
 if(!db){db={db_id:'DB'+(m.s2_1.databases.length+1),name:'OpenAlex (discovery index)',peer_reviewed:false,language:'No language filter applied',year_range:'All years',reason:'Public discovery index for finding journal candidates; not a peer-reviewed-only database search or a substitute for ProQuest/Scopus.'};m.s2_1.databases.push(db);}
 let added=0;for(const q of a.queries){if(q.error||typeof q.count!=='number')continue;
  const code=`OpenAlex works: search=${JSON.stringify(q.query)}; filter=type:article; per_page=15`;
  if(m.s2_2.steps.some(s=>s.code===code))continue;
  m.s2_2.steps.push({no:m.s2_2.steps.length+1,code,hits:{[db.db_id]:q.count},final_count:0,result_note:`Executed ${a.searched_at||''}; ${q.count} results reported by OpenAlex for this query. Only up to 15 records retrieved and all query results were deduplicated. Not a full systematic search.`,found_ev_ids:[]});added++;
 }
 persist();render();showToast(`${added} OpenAlex search step(s) recorded separately in §2.2.`);
}
function autoAudit(){const a=autoState();if(!a.queries.length)return;const report={title:'CAT Studio public academic discovery audit',topic:S.model?.meta.topic,question:S.model?.s1_2.question,source:'OpenAlex',searched_at:a.searched_at,queries:a.queries,source_count:a.records.length,screening_method:a.screened?'AI preliminary abstract-only':'Not performed',caution:'This is not ProQuest/Scopus data, a full systematic review, or a verified effect appraisal.',records:a.records};download('CAT_Studio_research_audit.json',JSON.stringify(report,null,2));}
function autoFilter(v){const a=autoState();a.filter=v;persist();render();}
function autoToggle(id,checked){const a=autoState(),p=a.records.find(x=>x.ref_id===id);if(!p)return;p.shortlisted=checked;persist();render();}

