(function(){
'use strict';
window.createAirImportViews=function(ctx){
 const {M,X,root,shell,head,open,close,confirm,section,facts,esc,amount,tag,line,persist,toast,error}=ctx,F=window.AirImportFlow;
 const data=()=>ctx.getData(),btn=(s,a,id='',primary=false)=>'<button type="button" class="btn '+(primary?'btn-primary':'btn-secondary')+'" data-ai="'+a+'" data-id="'+esc(id)+'">'+s+'</button>';
 let orderContext=null;
 const scopeRows=rs=>orderContext?rs.map(r=>({...r,scopeOrder:orderContext.orderId})):rs;
 const link=(s,a,id='')=>'<button type="button" class="ao-link" data-ai="'+a+'" data-id="'+esc(id)+'">'+s+'</button>';
 const opts=(values,value)=>values.map(x=>{const [v,t]=Array.isArray(x)?x:[x,x];return '<option value="'+esc(v)+'"'+(String(v)===String(value)?' selected':'')+'>'+esc(t)+'</option>';}).join('');
 const field=(label,key,value='',type='text',values=null,ro=false)=>'<label class="ao-field"><span>'+label+'</span>'+(ro?'<span class="ai-readonly">'+esc(value||'未提供')+'</span>':values?'<select name="'+key+'">'+opts(values,value)+'</select>':'<input name="'+key+'" type="'+type+'" value="'+esc(value)+'">')+'</label>';
 const getForm=id=>Object.fromEntries([...root.querySelectorAll('#'+id+' [name]')].map(el=>[el.name,el.type==='checkbox'?el.checked:el.value.trim()]));
 const airports=()=>[['','请选择机场'],...Object.entries(M.airports).map(([k,v])=>[k,v[0]+' '+k])];
 const customers=()=>[...new Set([...M.seed().orders,...data().orders].map(o=>o.customer).filter(x=>x&&x!=='待补结算客户'))];
 const suppliers=()=>[...new Set((window.SupplierCompanyView||[]).filter(x=>x.status==='已准入'&&/机票|航空客票/.test(x.service)).map(x=>x.name))];
 const calendarRows=()=>window.AirReconciliation?.load().calendar||[];
 const q=new URLSearchParams(location.search);
 let mode=['票号回填','PDF账单'].includes(q.get('tab'))?q.get('tab'):'日报',view='list',rows=[],name='',reading=false,readToken=0,batchId='',retryOf='',filter='全部',category='',rowIndex=-1,matchDraft='',rowDraft={},ready=false,demo=true;
 let meta={dailyDate:'2026-10-17',account:'BSP结算账户',currency:'CNY'};
 const queries={'日报':{q:'',state:'',from:'',to:''},'票号回填':{q:'',state:'',from:'',to:''},'PDF账单':{q:'',state:'',from:'',to:''}};
 const title=()=>mode==='日报'?'BSP日报':mode;
 const currentBatch=()=>data().batches.find(x=>x.id===batchId);
 const results=()=>view==='result'?currentBatch().results:F.preview(rows,data(),mode);
 const unique=a=>[...new Set(a)];
 function locationState(){if(ctx.embedded)return;const u=new URL(location.href);u.searchParams.set('tab',title());u.searchParams.delete('prepare');u.searchParams.delete('assist');if(batchId)u.searchParams.set('batch',batchId);else u.searchParams.delete('batch');history.replaceState(null,'',u.pathname+u.search);}
 function drawer(label,body,footer='',row=false){const o=orderContext&&data().orders.find(o=>o.id===orderContext.orderId);const context=o&&!row?'<div class="ao-charter-context">'+esc(o.id+' · '+o.customer+(o.group?' · '+o.group:''))+'</div>':'';open(label,context+body,footer,row?()=>returnFromRow():null);const d=root.querySelector('#ao-layer .drawer-modal');d.classList.add(row?'ai-row-drawer':'ai-import-drawer');d.dataset.aiDrawer=row?'row':'batch';d.dataset.aiStage=view;root.querySelector('#ao-layer .modal-body').scrollTop=0;if(row)root.querySelector('#ao-layer-footer [data-ao="layer-back"]').textContent='返回核对';else root.querySelector('#ao-layer-footer [data-ao="close"]').textContent=orderContext?'返回出票':'关闭';}
 function returnFromRow(){drawReview();}
 function closeRequested(){const d=root.querySelector('#ao-layer.show [data-ai-drawer]');if(!d)return false;if(d.dataset.aiDrawer==='row'){if(ctx.isLayerDirty())confirm('本行修改尚未保存，确认返回核对？',()=>returnFromRow());else returnFromRow();}else leave();return true;}
 function steps(n){return '<ol class="ao-import-steps" aria-label="票务导入步骤">'+['选择资料','核对数据','导入结果'].map((s,i)=>'<li class="'+(i+1===n?'current':i+1<n?'done':'')+'"><span>'+(i+1)+'</span>'+s+'</li>').join('')+'</ol>';}
 function table(headers,body,widths,cls=''){return '<div class="table-wrap ai-table-wrap" tabindex="0"><table class="ai-table '+cls+'"><colgroup>'+headers.map((s,i)=>'<col'+(widths[i]?' style="width:'+widths[i]+'px"':'')+'>').join('')+'</colgroup><thead><tr>'+headers.map((s,i)=>'<th'+(i===headers.length-1&&cls!=='ai-source-records'?' class="ao-sticky"':'')+'>'+s+'</th>').join('')+'</tr></thead><tbody>'+body+'</tbody></table>'+(!body?'<div class="ao-empty">当前范围暂无记录</div>':'')+'</div>';}
 function day(b){return b.dailyDate||unique(b.results.map(r=>r.row.issuedDate).filter(Boolean)).join('、')||'未提供';}
 function batchState(b){const c=F.counts(b.results,b,data());return c.pending?'待核对':'已完成';}
 function list(nextMode){
  if(nextMode)mode=nextMode;
  view='list';batchId='';ctx.dirty(false);if(ctx.embedded){ctx.onReturn();return;}locationState();const f=queries[mode];
  const batches=data().batches.filter(b=>b.mode===mode&&(!f.q||[b.id,b.name].join(' ').includes(f.q))&&(!f.state||batchState(b)===f.state)&&(!f.from||day(b)>=f.from)&&(!f.to||day(b)<=f.to));
  const search='<div class="filter-card filter-card-compact"><input id="ai-query" aria-label="批次或文件名" placeholder="'+(mode==='PDF账单'?'核对记录 / 文件 / 账期':'批次 / 文件名')+'" value="'+esc(f.q)+'"><select id="ai-status" aria-label="批次状态">'+opts([['','全部状态'],'待核对',mode==='PDF账单'?'已核对':'已完成'],f.state)+'</select><input name="from" type="date" aria-label="业务开始日期" value="'+f.from+'"><input name="to" type="date" aria-label="业务结束日期" value="'+f.to+'">'+btn('搜索','search')+btn('重置','reset')+'</div>';
  const tabs='<div class="tab-bar" role="tablist">'+['日报','票号回填','PDF账单'].map(t=>'<button role="tab" aria-selected="'+(t===mode)+'" class="tab-item '+(t===mode?'active':'')+'" data-ai="category" data-id="'+t+'">'+(t==='日报'?'BSP日报':t)+'</button>').join('')+'</div>';
  if(mode==='PDF账单'){
   const T=window.AirTicketEntry,records=(data().ticketIntakes||[]).filter(r=>r.kind==='pdf').map(r=>T.statementRecord(data(),r));
   const stateOf=r=>r.rows.every(x=>x.result==='金额一致')?'已核对':'待核对';
   const dateOf=r=>{const date=new Date(r.savedAt||r.time);return Number.isNaN(date.getTime())?'':date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');};
   const filtered=records.filter(r=>(!f.q||[r.id,r.file,r.meta.period,r.meta.account].join(' ').includes(f.q))&&(!f.state||stateOf(r)===f.state)&&(!f.from||dateOf(r)>=f.from)&&(!f.to||dateOf(r)<=f.to));
   const body=filtered.map(r=>{const c=T.statementCounts(r.rows);return '<tr><td>'+line(r.id)+line(r.file,true)+'</td><td>'+line(r.meta.period)+line(r.meta.account+' · '+r.meta.currency,true)+'</td><td>'+line('一致 '+c.same+' · 差异 '+c.different)+line('待匹配 '+c.unmatched+' · 其他待核 '+c.pending,true)+'</td><td>'+tag(stateOf(r))+'</td><td>'+esc(r.time)+'</td><td class="ao-sticky"><div class="ao-row-actions">'+link('详情','statement',r.id)+'</div></td></tr>';}).join('');
   shell(head('票务导入',ctx.intakeMenu())+'<section class="ao-surface">'+search+tabs+table(['核对记录 / 文件','账期 / 账户','核对结果','状态','保存时间','操作'],body,[0,205,230,100,160,132],'ai-batches')+'</section>');return;
  }
  const body=batches.map(b=>{const c=F.counts(b.results,b,data());return '<tr><td>'+line(b.id)+line(b.name,true)+'</td><td>'+line(day(b))+line(b.time,true)+'</td><td>'+line('已处理 '+c.applied+' · 待处理 '+c.pending)+line('重复跳过 '+c.duplicate+' · 本次跳过 '+c.skipped,true)+'</td><td>'+tag(batchState(b))+'</td><td>'+line(b.who||'未记录')+'</td><td class="ao-sticky"><div class="ao-row-actions">'+link('详情','batch',b.id)+(c.pending?link('核对','process',b.id):'')+'</div></td></tr>';}).join('');
  shell(head('票务导入',ctx.intakeMenu()+(mode==='票号回填'?btn('导入票号','new','',true):''))+'<section class="ao-surface">'+search+tabs+table(['批次 / 文件',mode==='日报'?'日报日期 / 导入时间':'出票日期 / 导入时间','处理结果','状态','导入人','操作'],body,[0,205,230,100,145,132],'ai-batches')+'<div class="ao-table-foot">共 '+batches.length+' 批</div></section>');
 }
 // Default prototype records are available before a file is selected. They are never described as an uploaded file.
 function demoRows(){
  const stamp=String(Date.now()).slice(-10),ticket=i=>String(Number('999'+stamp)+i),pnr='D'+stamp.slice(-5);
  if(mode==='票号回填'){
   const candidates=data().orders.filter(o=>(!orderContext||o.id===orderContext.orderId)&&o.company===M.company&&['待确认','待出票','出票中','已出票'].includes(o.state)).flatMap(o=>o.tickets.filter(t=>t.state!=='结果待查').map(t=>({o,t})));
   const available=candidates.filter(({t})=>!t.ticket),all=available.length?available:candidates.filter(({t})=>t.state==='已出票'),selected=orderContext?all:all.slice(0,3);
   return selected.map(({o,t},i)=>{const p=o.people.find(p=>p.id===t.personId),l=o.legs.find(l=>l.id===t.legId);return {sourceRow:i+2,type:'出票',orderId:o.id,name:p.name,docNo:p.docNo,flight:l.flight,date:l.date,from:l.from,to:l.to,ticket:t.ticket||ticket(i),pnr:t.pnr||o.bookingPnr||pnr,airlineNo:t.airlineNo||'CA-DEMO-'+stamp,issuedDate:'2026-10-17'};});
  }
  const base={type:'出票',issuedDate:'2026-10-17',original:'',pnr,airlineNo:'CA-DEMO-'+stamp,date:'2026-11-05',flight:'CA1333',from:'PEK',to:'SYX',fare:'1200',tax:'180',cost:'1380',customer:'华远科技有限公司',sale:'1800',priceBasis:'企业客户确认报价（演示）',currency:'CNY',internal:'否',group:'',amountScope:'整票',carrier:'中国国际航空',supplier:'中国国际航空'};
  const first={...base,sourceRow:2,ticket:ticket(0),name:'刘洋',docNo:'DEMO'+stamp+'01'},second={...base,sourceRow:3,ticket:ticket(1),name:'赵明',docNo:'DEMO'+stamp+'02',sale:'1950'};
  const original=data().orders.find(o=>o.id==='HF20261017007'),originalTicket=original?.tickets.find(t=>t.ticket),originalLeg=original?.legs.find(l=>l.id===originalTicket?.legId),originalPerson=original?.people.find(p=>p.id===originalTicket?.personId);
  return [first,second,{...first,sourceRow:4},{...base,...(originalLeg?{flight:originalLeg.flight,date:originalLeg.date,from:originalLeg.from,to:originalLeg.to}:{}),sourceRow:5,type:'退票',ticket:ticket(2),original:originalTicket?.ticket||'9991234567899',name:originalPerson?.name||'张建国',docNo:originalPerson?.docNo||'E10000001',cost:'1180',sale:'',priceBasis:''},{...base,sourceRow:6,type:'改签',ticket:ticket(3),original:'9999999999999',name:'陈晓',docNo:'DEMO'+stamp+'03',sale:'',priceBasis:''}];
 }
 function useDefaultRows(){rows=scopeRows(demoRows());name=title()+'演示资料';ready=true;demo=true;}
 function newImport(){batchId='';retryOf='';filter='全部';category='';reading=false;readToken++;meta={dailyDate:'2026-10-17',account:'BSP结算账户',currency:'CNY'};useDefaultRows();view='source';locationState();drawSource();}
 function drawSource(){
  view='source';const cal=F.calendar(meta,rows,calendarRows());
  const top=mode==='日报'?'<div class="ao-grid ai-meta">'+field('出票公司','company',M.company,'text',null,true)+field('日报日期','dailyDate',meta.dailyDate,'date')+field('BSP账户','account',meta.account,'text',unique(calendarRows().map(c=>c.account).concat(['BSP结算账户'])))+field('币种','currency',meta.currency,'text',['CNY','USD','EUR'])+'</div><div class="ai-calendar">'+esc(cal.text)+'</div>':'<p class="ao-muted">按已有订单、乘客及对应航段回填出票凭据；支持部分名单、分段分次回票。</p>';
  const upload='<label class="ao-import-upload"><input type="file" id="ai-file" accept=".xlsx,.csv" aria-label="选择'+title()+'文件"><strong>'+(reading?'正在读取可选文件…':'选择文件替换资料（可选）')+'</strong><span>XLSX / CSV · 未选择文件时，直接使用下方演示资料</span></label>';
  drawer('导入'+title(),steps(1)+section('导入资料','<form id="ai-source">'+top+upload+'<div class="ao-import-selected"><strong>'+esc(name)+'</strong><span>'+rows.length+' 行 · '+(demo?'已预置，可直接进入下一步':'可进入下一步')+'</span></div>'+table(['乘客 / 票号','航班 / 出行日期','行程'],rows.slice(0,3).map(r=>'<tr><td>'+line(r.name)+line(r.ticket,true)+'</td><td>'+line(r.flight)+line(r.date,true)+'</td><td>'+line(r.from+' → '+r.to)+'</td></tr>').join(''),[0,210,150],'ai-source-records')+'</form>'),btn('下载模板','template')+'<button type="button" class="btn btn-primary" data-ai="next">下一步：核对数据</button>');
 }

 function orderLink(id,label){return '<a class="ao-link" href="air-order-detail.html?id='+encodeURIComponent(id)+'&fromImport='+encodeURIComponent(batchId)+'">'+esc(label||id)+'</a>';}
 function categoryFor(r){return r.action||(r.row.type!=='出票'?'退改记录':r.state==='更正已记录'?'交易更正':r.state==='草稿待补'?'新增订单':'回填票号');}
 function groupFor(r,b){if(['重复跳过','跳过'].includes(r.state))return '已跳过';if(F.pending(r,b,data())&&r.state!=='草稿待补')return '待处理';if(view==='result'&&F.pending(r,b,data()))return '待处理';return view==='result'?'已处理':'可导入';}
 function drawReview(){
  const saved=view==='result',b=saved?currentBatch():null,rs=results(),counts=F.counts(rs,b,data()),eligible=rs.filter(r=>!['未应用','跳过','重复跳过'].includes(r.state)).length;
  const kinds=['全部','待处理',saved?'已处理':'可导入','已跳过'];
  const tabs='<div class="tab-bar" role="tablist">'+kinds.map(s=>'<button role="tab" aria-selected="'+(filter===s)+'" class="tab-item '+(filter===s?'active':'')+'" data-ai="filter" data-id="'+s+'">'+s+' ('+(s==='全部'?rs.length:rs.filter(r=>groupFor(r,b)===s).length)+')</button>').join('')+'</div>';
  const matches=rs.map((r,i)=>({r,i})).filter(({r})=>(filter==='全部'||groupFor(r,b)===filter)&&(!category||categoryFor(r)===category));
  const body=matches.map(({r,i})=>{const x=r.row,o=data().orders.find(o=>o.id===r.order),later=b&&F.later(r,b,data()),pending=saved&&F.pending(r,b,data());
   const outcome=F.state(r,b,data(),!saved),why=(later?'':r.error)||(r.state==='草稿待补'&&F.pending(r,b,data())?'客户或售价待补':r.state==='退改待办理'?'进入原票核对退改':r.state==='更正已记录'?'原记录保留，订单报价不变':'');
   return '<tr><td>'+(!saved?'<input type="checkbox" data-ai-select="'+i+'" aria-label="选择原文件第'+x.sourceRow+'行" '+(!x.skip?'checked':'')+'>':esc(x.sourceRow))+'</td><td>'+line(x.ticket||'票号待补')+line(x.name+' · '+(x.docNo||'证件未提供'),true)+line(x.type==='出票'?(x.pnr||'订座编号未提供'):x.type+' · 原票 '+(x.original||'待补'),true)+'</td><td>'+line(x.flight+' · '+x.from+' → '+x.to)+line(x.date,true)+'</td><td>'+(o?orderLink(o.id)+line(o.customer,true):line(x.orderId||(r.state==='重复跳过'?'无需重复建单':x.type!=='出票'?'原票待匹配':mode==='票号回填'?'订单待匹配':'预建新订单')))+(mode==='日报'?line('采购 '+amount(x.cost===''||x.cost==null?null:x.cost,x.currency),true):'')+'</td><td>'+tag(outcome)+line(why,true)+'</td><td class="ao-sticky">'+(later?link('后续批次','batch',later.id):(saved&&!pending||r.state==='重复跳过')?link('查看','row-view',i):link('核对','row',i))+'</td></tr>';
  }).join('');
  const allTickets=unique(rs.map(r=>r.row.ticket).filter(Boolean)).length,legs=unique(rs.map(r=>[r.row.ticket,r.row.flight,r.row.date].join('|'))).length;
  const primary=saved?'':'<button type="button" class="btn btn-primary" data-ai="apply">'+(eligible?'确认导入（'+eligible+'行）':'保存核对结果')+'</button>';
  const actions=saved?btn('下载待处理行','errors')+(mode==='日报'?'<button class="btn btn-secondary" data-ao="batch-prepare" data-id="'+esc(batchId)+'">本批核单</button>':''):btn('下载待处理行','errors');
  const summary=facts([['导入资料',saved?b.name:name],['资料范围',rs.length+' 行 · '+allTickets+' 张票 · '+legs+' 个票号航段'],[mode==='日报'?'日报日期':'出票日期',saved?day(b):mode==='日报'?meta.dailyDate:unique(rows.map(r=>r.issuedDate)).join('、')],...(mode==='日报'?[['BSP账期',saved?b.calendarText||'历史批次账期待确认':F.calendar(meta,rows,calendarRows()).text]]:[]),...(saved?[['处理结果','已处理 '+counts.applied+' · 待处理 '+counts.pending+' · 跳过 '+(counts.duplicate+counts.skipped)],['订单承接','新增 '+counts.created+' 单 · 回填 '+counts.refilled+' 人段 · 退改记录 '+counts.afterSales+' 行'],['导入时间',b.time]]:[])]);
  drawer(saved?'导入批次 · '+b.id:'核对'+title(),steps(saved?3:2)+section(saved?'导入结果':'本次资料',summary)+(retryOf?'<p class="ao-muted">纠错来源 '+link(retryOf,'batch',retryOf)+' · 原记录已保留</p>':'')+section('客票记录',tabs+'<div class="ai-review-filter"><select id="ai-business" aria-label="业务分类">'+opts([['','全部业务'],...(mode==='票号回填'?['回填票号']:['新增订单','回填票号','退改记录','交易更正'])],category)+'</select><span class="ao-muted">'+(saved?(mode==='日报'?'文件记录保留；草稿待补和退改待办理请按对应入口继续。':'仅回填已有订单的票号、订座及航司订单号，名单和成交价保持。'):'可导入行先处理；未匹配与差异保留待核对。')+'</span></div>'+table(['原行','客票 / 乘客','航段 / 出行日期','关联订单'+(mode==='日报'?' / 采购金额':''),'处理结果','操作'],body,[52,230,210,0,245,88],'ai-records')),(!saved?btn('上一步','previous'):'')+actions+primary);
 }
 function batch(id,processing=false){const b=data().batches.find(x=>x.id===id);if(!b)throw Error('导入批次不存在');if(mode!==b.mode){mode=b.mode;list();}batchId=id;retryOf=b.retryOf||'';rows=b.results.map(r=>r.row);view='result';filter=processing?'待处理':'全部';category='';ctx.dirty(false);locationState();drawReview();}
 function readRow(){
  const rs=results();return view==='result'?rs[rowIndex].row:rows[rowIndex];
 }
 function matchOptions(r){const cs=F.candidates(r,data(),true);return [['','按原资料自动匹配'],...cs.map(c=>[JSON.stringify({order:c.order,person:c.person,leg:c.leg}),c.order+' · '+(c.group||c.customer)+' · '+c.name+' · '+c.flight+' '+c.date+' '+c.from+'—'+c.to+(c.ticket?' · 已有票号 '+c.ticket:'')])];}
 function rowForm(index,readOnly=false){
  rowIndex=Number(index);const rs=results(),result=rs[rowIndex],r=readRow(),o=data().orders.find(o=>o.id===(result.order||data().transactions.find(t=>t.key===F.key(r))?.order)),b=currentBatch();
  if(readOnly){
   const tx=data().transactions.find(t=>t.key===F.key(r));
   drawer('查看导入记录',facts([['原文件行号',r.sourceRow],['票号',r.ticket],['乘客',r.name],['航班与日期',r.flight+' / '+r.date],['结果',F.state(result,b,data())],['原票号',r.original||'—'],...(mode==='日报'?[['采购结算额',amount(r.cost===''||r.cost==null?null:r.cost,r.currency)]]:[])])+(o?'<p>'+orderLink(o.id,'查看原订单')+(r.type!=='出票'?'　<a class="ao-link" href="air-orders.html?order='+encodeURIComponent(o.id)+'">办理原票退改</a>':'')+'</p>':'')+(tx?.batch&&tx.batch!==batchId?btn('查看原批次','batch',tx.batch):'')+section('更正历史',tx?.versions?.length?tx.versions.map(v=>facts([['核对时间',v.time],['核对人',v.who],['依据',v.basis],['原采购结算额',v.row.cost],['本次采购结算额',tx.row.cost]])).join(''):'<p class="ao-muted">无更正记录</p>'),'',true);return;
  }
  if(view==='result'&&result.state==='草稿待补'){
   drawer('补齐订单资料',facts([['订单',o.id],['原票号',r.ticket],['乘客',r.name],['采购金额',amount(o.cost,o.currency)]])+'<form id="ai-complete" class="ao-grid">'+field('结算客户','customer',o.customer==='待补结算客户'?'华远科技有限公司':o.customer,'text',[['','请选择客户'],...customers()],o.customer!=='待补结算客户'&&!!o.customer)+field('本单销售价（'+o.currency+'）','sale',o.sale===''||o.sale==null?1800:o.sale,'number',null,o.sale!==''&&o.sale!=null)+field('报价依据','reason','客户确认报价（演示）')+'</form>',btn('保存并核对','complete',o.id,true),true);return;
  }
  rowDraft=copyRow(r);matchDraft=r.match||'';drawRowForm(result);
 }
 function copyRow(r){return M.copy(r);}
 function drawRowForm(result){
  const r=rowDraft,refill=mode==='票号回填',c=refill?F.inspectRefill(r,data()):M.classify({...r},data(),'日报');
  const candidate=matchDraft?JSON.parse(matchDraft):c.target||c.candidates?.[0],o=candidate&&data().orders.find(o=>o.id===candidate.order),p=o?.people.find(p=>p.id===candidate.person),l=o?.legs.find(l=>l.id===candidate.leg);
  const isNew=!o&&r.type==='出票'&&!refill,old=c.original;
  let body='<form id="ai-row">';
  if(r.type==='出票')body+=section('匹配订单与航段',field('候选订单 / 乘客 / 航班','match',matchDraft,'text',matchOptions(r))+(o?facts([['订单',o.id],['客户',o.customer],['乘客',p?.name||r.name],['证件',p?.docNo||r.docNo],['航段',l?l.flight+' '+l.date+' '+l.from+'—'+l.to:'待选择'],['原票号',o.tickets.find(t=>t.personId===p?.id&&t.legId===l?.id)?.ticket||'未出票']]):'<p class="ao-muted">'+(refill?'请核对回票资料，再选择已有订单名单航段。':'无匹配订单时按新订单资料核对；已有订单请先核对候选。')+'</p>'));
  body+=section(refill?'回票资料':'客票资料','<div class="ao-grid">'+(!refill?field('交易类型','type',r.type,'text',['出票','退票','改签']):'')+field('乘客姓名','name',r.name)+field('证件号码','docNo',r.docNo)+field('票号','ticket',r.ticket)+(r.type!=='出票'?field('原票号','original',r.original):'')+field('订座编号','pnr',r.pnr)+field('航司订单号','airlineNo',r.airlineNo)+field('出票日期','issuedDate',r.issuedDate,'date')+'</div><p class="ao-muted">此处核对原文件资料；不会修改原订单的乘客身份。</p>');
  body+=section('本行航段','<div class="ao-grid">'+field('航班号','flight',r.flight)+field('出行日期','date',r.date,'date')+field('出发机场','from',r.from,'text',airports())+field('到达机场','to',r.to,'text',airports())+'</div>');
  if(!refill)body+=section('日报金额','<div class="ao-grid">'+field('币种','currency',r.currency||meta.currency,'text',['CNY','USD','EUR'])+field('票价','fare',r.fare,'number')+field('税费','tax',r.tax,'number')+field('采购结算额','cost',r.cost,'number')+(unique(rows.filter(x=>x.ticket===r.ticket).map(x=>x.flight+'|'+x.date)).length>1||c.state==='追加航段'?field('同票多航段金额','amountScope',r.amountScope,'text',[['','请选择'],['整票','整票金额重复列示，只计一次'],['分段','各段独立金额，按段相加']]):'')+'</div>'+(o?facts([['原订单客户',o.customer],['原订单售价',amount(o.sale===''?null:o.sale,o.currency)],['原采购金额',amount(o.cost===''?null:o.cost,o.currency)]]):''));
  if(isNew)body+=section('新订单客户与报价','<div class="ao-grid">'+field('结算客户','customer',r.customer,'text',[['','待补客户'],...customers()])+field('本单销售价','sale',r.sale,'number')+field('报价依据','priceBasis',r.priceBasis||'')+field('承运航司','carrier',r.carrier||'','text',[['','请选择航司'],'中国国际航空','中国东方航空','中国南方航空','海南航空'])+field('供票供应商','supplier',r.supplier||'','text',[['','请选择供应商'],...suppliers()])+'</div><p class="ao-muted">客户或售价暂缺时仅预建待补草稿，采购金额不作为售价。</p>');
  if(old)body+=section('更正差异',facts([['原采购结算额',old.row.cost],['本次采购结算额',r.cost],['原客户',old.row.customer||'未提供'],['原售价',old.row.sale||'未提供']])+field('更正依据','changeReason',r.changeReason||'')+'<label><input name="correct" type="checkbox" '+(r.correct?'checked':'')+'> 已核对差异，保留原记录及订单报价</label>');
  body+='</form>';
  drawer('核对原文件第'+r.sourceRow+'行',body,btn('保存并核对','save-row','',true),true);
 }
 function saveRow(){
  const values=getForm('ai-row'),r={...scopeRows([readRow()])[0],...values};r.match=values.match||'';
  if(view==='result'){
   const original=currentBatch();rows=[r];retryOf=original.id;meta={dailyDate:original.dailyDate||r.issuedDate,account:original.account||'BSP结算账户',currency:r.currency||'CNY'};name=original.name+'（纠错）';
   const b=F.apply(rows,data(),mode,{...meta,name,retryOf,calendarText:F.calendar(meta,rows,calendarRows()).text});persist();close(true);batch(b.id);toast('核对记录已保存，原批次保留');return;
  }
  rows[rowIndex]=r;ctx.dirty(true);close(true);drawReview();
 }
 async function template(errorsOnly=false){
  const list=errorsOnly?results().filter(r=>F.pending(r,currentBatch(),data())):null,rs=list?list.map(r=>r.row):[];
  if(mode==='票号回填')await X.download(errorsOnly?'回票待处理行.xlsx':'票号回填模板.xlsx',[],null,[F.refillHeaders.concat(errorsOnly?['原文件行号','待处理原因']:[]),...rs.map((r,i)=>F.refillFields.map(k=>r[k]||'').concat(errorsOnly?[r.sourceRow,list[i].error||'资料待核对']:[]))]);
  else await X.download(errorsOnly?'日报待处理行.xlsx':'BSP日报模板.xlsx',rs,errorsOnly?list.map(r=>[r.error||'客户或售价待补']):null);
  toast(errorsOnly?'已下载待处理行':'已下载对应业务模板');
 }
 function leave(){const exit=()=>{readToken++;reading=false;ready=false;ctx.dirty(false);close(true);const back=orderContext?.onReturn;orderContext=null;back?back():list();};if(['source','review'].includes(view)&&ready&&!demo)confirm('本次资料尚未导入，确认返回来源页面？',exit);else exit();}
 function action(a,id){
  if(a==='category'){mode=id;list();}
  else if(a==='new')newImport();
  else if(a==='statement')ctx.openStatement(id);
  else if(a==='back')leave();
  else if(a==='search'){queries[mode]={q:root.querySelector('#ai-query').value.trim(),state:root.querySelector('#ai-status').value,from:root.querySelector('[name=from]').value,to:root.querySelector('[name=to]').value};list();}
  else if(a==='reset'){queries[mode]={q:'',state:'',from:'',to:''};list();}
  else if(a==='next'){readToken++;reading=false;if(!rows.length)useDefaultRows();meta.dailyDate=meta.dailyDate||'2026-10-17';meta.account=meta.account||'BSP结算账户';meta.currency=meta.currency||'CNY';view='review';filter='全部';category='';drawReview();}
  else if(a==='previous'){if(retryOf)batch(retryOf);else drawSource();}
  else if(a==='filter'){filter=id;drawReview();}
  else if(a==='batch'||a==='process'){close(true);batch(id,a==='process');}
  else if(a==='row')rowForm(id);
  else if(a==='row-view')rowForm(id,true);
  else if(a==='save-row')saveRow();
  else if(a==='template'||a==='errors')template(a==='errors').catch(e=>error(e.message));
  else if(a==='complete'){
   const o=data().orders.find(o=>o.id===id),v=getForm('ai-complete');v.customer=v.customer||o.customer;v.sale=v.sale===undefined?o.sale:v.sale;
   if(!v.customer||v.customer==='待补结算客户')v.customer='华远科技有限公司';if(v.sale===''||!Number.isFinite(Number(v.sale))||Number(v.sale)<0)v.sale=1800;v.reason=v.reason||'客户确认报价（演示）';
   const before={customer:o.customer,sale:o.sale};Object.assign(o,{customer:v.customer,sale:Number(v.sale),priceBasis:v.reason});M.log(o,'导入订单补齐客户与报价','superadmin',{basis:v.reason,changes:M.changes(before,o,{customer:'结算客户',sale:'销售价'})});persist();close(true);drawReview();toast('已补齐原订单，本批记录已更新');
  }else if(a==='apply'){
   if(!rows.length)useDefaultRows();
   const b=F.apply(rows,data(),mode,{...meta,name,retryOf,calendarText:mode==='日报'?F.calendar(meta,rows,calendarRows()).text:''});persist();ctx.dirty(false);batch(b.id);
  }
 }
 root.addEventListener('click',e=>{const b=e.target.closest('[data-ai]');if(!b)return;e.preventDefault();try{action(b.dataset.ai,b.dataset.id||'');}catch(err){error(err.message);}});
 root.addEventListener('input',e=>{const x=e.target;if(x.closest('#ai-source')&&['dailyDate','account','currency'].includes(x.name)){meta[x.name]=x.value;ctx.dirty(true);const el=root.querySelector('.ai-calendar');if(el)el.textContent=F.calendar(meta,rows,calendarRows()).text;}});
 root.addEventListener('change',e=>{const x=e.target;try{
  if(x.id==='ai-business'){category=x.value;drawReview();}
  if(x.dataset.aiSelect!==undefined){rows[Number(x.dataset.aiSelect)].skip=!x.checked;ctx.dirty(true);drawReview();}
  if(['match','type'].includes(x.name)&&x.closest('#ai-row')){rowDraft={...rowDraft,...getForm('ai-row')};matchDraft=rowDraft.match||'';drawRowForm(results()[rowIndex]);ctx.layerDirty(true);}
  if(x.id==='ai-file'&&x.files[0]){const file=x.files[0],token=++readToken;reading=true;drawSource();X.read(file,mode).then(r=>{if(token!==readToken)return;reading=false;if(r.length){rows=scopeRows(r);name=file.name;ready=true;demo=false;ctx.dirty(true);}drawSource();}).catch(()=>{if(token!==readToken)return;reading=false;drawSource();toast('文件未替换当前资料，可直接点击下一步');});}
 }catch(err){error(err.message);}});
 return {list,batch,retry:id=>batch(id,true),closeRequested,start(nextMode='日报',context=null){orderContext=context;mode=nextMode;newImport();}};
};
})();
