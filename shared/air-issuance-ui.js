/* 订单内出票办理：名单按乘客及实际航段核对，成功和待查记录分别保护。 */
(function(){
'use strict';
window.createAirIssuanceViews=function(ctx){
 const {M,root,esc,line,tag,open,find,toast,persist}=ctx;
 let work=null;const sessions=new Map();
 const key=t=>t.personId+'|'+t.legId;
 const btn=(s,a,primary=false)=>'<button type="button" class="btn '+(primary?'btn-primary':'btn-secondary')+'" data-ais="'+a+'">'+s+'</button>';
 const options=(values,v)=>values.map(x=>{const [a,b]=Array.isArray(x)?x:[x,x];return '<option value="'+esc(a)+'"'+(a===v?' selected':'')+'>'+esc(b)+'</option>';}).join('');
 const input=(label,k,v,extra='')=>'<input data-issue-field="'+k+'" aria-label="'+esc(label)+'" value="'+esc(v||'')+'" '+extra+'>';
 const order=()=>find(work.id);
 const eligible=t=>['待出票','出票中'].includes(order().state)&&(work.query?t.state==='结果待查':['未出票','失败'].includes(t.state));
 function prepare(o,query,resume){
  if(!resume)sessions.clear();
  if(!resume||!work||work.id!==o.id||work.query!==query){work=sessions.get(o.id+'|'+query)||{id:o.id,query,q:'',leg:'',view:'可办理',drafts:{},pnr:'',airlineNo:'',edited:false};sessions.set(o.id+'|'+query,work);}
  const stamp=Number('999'+String(Date.now()).slice(-10));
  o.tickets.forEach((t,i)=>{if(!eligible(t))return;const k=key(t),l=o.legs.find(l=>l.id===t.legId);if(work.drafts[k])return;
   work.drafts[k]={...t,selected:true,state:query?'结果待查':'已出票',pnr:t.pnr&&t.pnr!=='UNKNOWN'?t.pnr:(!l.additional?o.bookingPnr:'')||'DE'+String(o.legs.indexOf(l)+1).padStart(4,'0'),airlineNo:t.airlineNo||(!l.additional?o.bookingAirlineNo:'')||'DEMO-'+l.flight,ticket:t.ticket||String(stamp+i),reason:query?(t.reason||'供应商回执尚未明确'):t.reason||'',error:''};
  });
 }
 function summary(o){
  const issued=o.people.filter(p=>{const ts=o.tickets.filter(t=>t.personId===p.id);return ts.length&&ts.every(t=>t.state==='已出票');}).length;
  return '<div class="ais-summary"><div><strong>'+esc(o.id)+'</strong>'+tag(o.state)+line(o.customer+' · '+o.type,true)+(o.group?line(o.group,true):'')+'</div>'+ctx.facts([['本单名单',o.people.length+' 人'],['全部航段已出票',issued+' 人'],['结果待查',o.tickets.filter(t=>t.state==='结果待查').length+' 人段']])+'</div>';
 }
 function teamContext(o){
  const s=M.seats.find(s=>s.id===o.seat),v=o.roster;
  return '<section class="ao-section ais-team"><div class="drawer-section-head ais-section-head"><h3 class="drawer-section-title">团队出票核对</h3><span class="ao-muted">'+(o.supplierConfirmed?'供应已确认':'供应待确认')+' · '+esc(o.terms)+'</span></div>'+ctx.facts([['使用机位',s?.name||o.seatRequest||'未提供'],['名单版本','第'+v.sourceVersion+'版 · '+(v.accepted>=v.sourceVersion&&!v.pending?'已接收':v.claimed>=v.sourceVersion&&!v.pending?'待票务接收':'待核对')],['交名单期限',o.rosterDeadline||'协议未提供'],['出票期限',o.ticketDeadline||'协议未提供']])+'<div class="ais-team-actions">'+btn('核对名单','roster')+btn('导出航司名单','template')+(!work.query&&o.tickets.some(eligible)?btn('批量回填票号','import',true):'')+'</div></section>';
 }
 function row(t){
  const o=order(),p=o.people.find(p=>p.id===t.personId),l=o.legs.find(l=>l.id===t.legId),can=eligible(t),d=can?work.drafts[key(t)]:t;
  const control=(label,k,extra='')=>can?input(p.name+' '+l.flight+' '+label,k,d[k],extra):line(d[k]||'—');
  return '<tr data-issue-key="'+esc(key(t))+'" data-current-state="'+esc(t.state)+'">'+
   '<td>'+(can?'<input type="checkbox" data-issue-select aria-label="选择 '+esc(p.name+' '+p.docNo+' '+l.flight)+'"'+(d.selected?' checked':'')+'>':'')+'</td>'+
   '<td>'+line(p.name+(p.english?' · '+p.english:''))+line(p.docNo||'证件待补',true)+'</td>'+
   '<td>'+line(l.flight+' · '+l.from+' → '+l.to)+line(l.date,true)+'</td>'+
   '<td>'+control('订座编号','pnr')+'</td><td>'+control('航司订单号','airlineNo')+'</td><td>'+control('票号','ticket','inputmode="numeric"')+'</td>'+
   '<td>'+(can?'<select data-issue-field="state" aria-label="'+esc(p.name+' '+l.flight+' 本次结果')+'">'+options(['已出票','失败','结果待查'],d.state)+'</select>'+(t.state!=='未出票'?line('原结果：'+t.state,true):'')+'<div data-issue-reason'+(d.state==='已出票'?' hidden':'')+'>'+input(p.name+' '+l.flight+' 失败或待查原因','reason',d.reason,'placeholder="失败 / 待查原因"')+'</div>'+(d.error?'<span class="ais-row-error">'+esc(d.error)+'</span>':''):tag(t.state)+(t.reason?line(t.reason,true):''))+'</td></tr>';
 }
 function visible(t){
  const o=order(),p=o.people.find(p=>p.id===t.personId),d=work.drafts[key(t)]||t;
  return (!work.leg||t.legId===work.leg)&&(!work.q||[p.name,p.english,p.docNo,t.ticket,d.ticket].join(' ').toLowerCase().includes(work.q.toLowerCase()))&&(work.view==='全部'||work.view==='可办理'&&eligible(t)||work.view===t.state);
 }
 function selection(){return order().tickets.filter(t=>eligible(t)&&work.drafts[key(t)]?.selected);}
 function syncCount(){
  const ts=order().tickets,vis=ts.filter(visible),selected=selection(),off=selected.filter(t=>!visible(t)).length,all=root.querySelector('#ais-all'),count=root.querySelector('#ais-count');
  if(count)count.textContent='显示 '+vis.length+' 人段 · 已选 '+selected.length+' 人段'+(off?'（筛选外 '+off+'）':'');
  if(all){const can=vis.filter(eligible);all.disabled=!can.length;all.checked=!!can.length&&can.every(t=>work.drafts[key(t)].selected);all.indeterminate=can.some(t=>work.drafts[key(t)].selected)&&!all.checked;}
  const save=root.querySelector('[data-ais="save"]');if(save){save.disabled=!selected.length;save.textContent=(work.query?'保存查证结果':'保存出票结果')+(selected.length?'（'+selected.length+'）':'');}
 }
 function filterRows(){
  const ts=order().tickets;root.querySelectorAll('[data-issue-key]').forEach(r=>{r.hidden=!visible(ts.find(t=>key(t)===r.dataset.issueKey));});
  const empty=root.querySelector('#ais-empty');if(empty)empty.hidden=ts.some(visible);syncCount();
 }
 function draw(){
  const o=order(),can=o.tickets.some(eligible),team=o.type==='团队票';
  const issues=work.query?[]:M.blockers(o);
  const tools='<div class="ais-filters"><input id="ais-search" aria-label="查找乘客或票号" placeholder="姓名 / 证件 / 票号" value="'+esc(work.q)+'"><select id="ais-leg" aria-label="筛选航段">'+options([['','全部航段'],...o.legs.map(l=>[l.id,l.flight+' · '+l.date])],work.leg)+'</select><select id="ais-view" aria-label="筛选出票记录">'+options(['可办理','全部','已出票','结果待查','失败'],work.view)+'</select>'+btn('重置','reset')+'<span id="ais-count" class="ao-muted" aria-live="polite"></span></div>';
  const bulk=can?'<details class="ais-bulk"><summary>批量填写订座信息</summary><div><label>订座编号<input id="ais-pnr" value="'+esc(work.pnr)+'" placeholder="本批订座编号"></label><label>航司订单号<input id="ais-airline" value="'+esc(work.airlineNo)+'" placeholder="本批航司订单号"></label>'+btn('应用到已选','bulk')+'</div></details>':'';
  const table='<div class="table-wrap ais-table-wrap" tabindex="0" aria-label="出票结果表"><table class="ais-table"><colgroup><col class="ais-col-select"><col><col class="ais-col-flight"><col class="ais-col-pnr"><col class="ais-col-airline"><col class="ais-col-ticket"><col class="ais-col-result"></colgroup><thead><tr><th><input id="ais-all" type="checkbox" aria-label="选择当前筛选可办理记录"></th><th>乘客 / 证件</th><th>航班 / 日期</th><th>订座编号</th><th>航司订单号</th><th>13位票号</th><th>本次结果</th></tr></thead><tbody>'+o.tickets.map(row).join('')+'</tbody></table><div id="ais-empty" class="ao-empty" hidden>当前范围没有可办理记录</div></div>';
  const queryButton=!work.query&&o.tickets.some(t=>t.state==='结果待查')?btn('查证待查结果','query'):work.query?btn('返回出票','issue'):'';
  open(work.query?'查证出票结果':team?'团队出票':'登记出票结果',summary(o)+(team?teamContext(o):'')+(issues.length?'<div class="ao-warning ais-conditions">'+issues.map(s=>line(s)).join('')+'</div>':'')+'<section class="ais-results"><div class="drawer-section-head ais-section-head"><h3 class="drawer-section-title">'+(work.query?'待查客票':'客票结果')+'</h3><span class="ao-muted">'+(can?'预置出票资料':'已有出票记录')+'</span>'+queryButton+'</div>'+tools+bulk+table+'</section>',can?btn(work.query?'保存查证结果':'保存出票结果','save',true):'');
  root.querySelector('#ao-layer .drawer-modal').classList.add('ais-drawer');
  root.querySelector('#ao-layer-footer [data-ao="close"]').textContent='关闭';
  ctx.layerDirty(work.edited);filterRows();
 }
 function show(o,query=false,resume=false){prepare(o,query,resume);draw();}
 function resume(){const o=order();prepare(o,work.query,true);if(!o.tickets.some(eligible)&&work.view==='可办理')work.view='全部';draw();}
 function related(kind){ctx.related(kind,order(),resume);}
 function save(){
  const o=order(),chosen=selection();let saved=0;
  for(const t of chosen){const d=work.drafts[key(t)],u={personId:t.personId,legId:t.legId,state:d.state,pnr:d.pnr||(!o.legs.find(l=>l.id===t.legId).additional?o.bookingPnr:'')||'DEMO01',airlineNo:d.airlineNo||(!o.legs.find(l=>l.id===t.legId).additional?o.bookingAirlineNo:'')||'DEMO-'+o.legs.find(l=>l.id===t.legId).flight,ticket:d.ticket,reason:d.state==='已出票'?'':d.reason||(d.state==='失败'?'供应商返回出票失败':'供应商回执尚未明确')};
   if(!u.ticket)u.ticket=String(Number('999'+String(Date.now()).slice(-10))+saved);
   try{M.record(o,[u],'superadmin',ctx.getData().orders,work.query);d.selected=false;d.error='';saved++;}catch(e){d.error=e.message;}
  }
  if(saved)persist();
  work.edited=chosen.length>saved;if(!o.tickets.some(eligible))work.view='全部';ctx.refresh();resume();
  toast('已保存 '+saved+' 人段'+(chosen.length>saved?' · 待核对 '+(chosen.length-saved)+' 人段':''));
 }
 root.addEventListener('click',e=>{const b=e.target.closest('[data-ais]');if(!b)return;e.preventDefault();try{
  switch(b.dataset.ais){
   case 'save':save();break;
   case 'roster':related('roster');break;
   case 'template':related('template');break;
   case 'import':ctx.import(order(),resume);break;
   case 'query':show(order(),true,true);break;
   case 'issue':show(order(),false,true);break;
   case 'reset':work.q='';work.leg='';work.view='可办理';draw();break;
   case 'bulk':{const pnr=work.pnr.trim(),airlineNo=work.airlineNo.trim();if(!pnr&&!airlineNo){toast('填写本批订座编号或航司订单号');break;}selection().forEach(t=>Object.assign(work.drafts[key(t)],pnr?{pnr}:{},airlineNo?{airlineNo}:{}));work.edited=true;draw();toast('已更新 '+selection().length+' 人段的订座信息');break;}
  }
 }catch(err){ctx.error(err.message);}});
 root.addEventListener('input',e=>{const x=e.target;if(!work||!x.closest('.ais-drawer'))return;
  if(x.id==='ais-search'){work.q=x.value;filterRows();ctx.layerDirty(work.edited);return;}
  if(x.id==='ais-pnr'){work.pnr=x.value;work.edited=true;}if(x.id==='ais-airline'){work.airlineNo=x.value;work.edited=true;}
  if(x.dataset.issueField){const d=work.drafts[x.closest('[data-issue-key]').dataset.issueKey];d[x.dataset.issueField]=x.value;d.error='';work.edited=true;}
  ctx.layerDirty(work.edited);
 });
 root.addEventListener('change',e=>{const x=e.target;if(!work||!x.closest('.ais-drawer'))return;
  if(x.id==='ais-leg'){work.leg=x.value;filterRows();}if(x.id==='ais-view'){work.view=x.value;filterRows();}
  if(x.id==='ais-all'){order().tickets.filter(t=>visible(t)&&eligible(t)).forEach(t=>{work.drafts[key(t)].selected=x.checked;const tr=[...root.querySelectorAll('[data-issue-key]')].find(r=>r.dataset.issueKey===key(t));tr.querySelector('[data-issue-select]').checked=x.checked;});syncCount();}
  if(x.hasAttribute('data-issue-select')){work.drafts[x.closest('[data-issue-key]').dataset.issueKey].selected=x.checked;syncCount();}
  if(x.dataset.issueField==='state'){const d=work.drafts[x.closest('[data-issue-key]').dataset.issueKey];d.state=x.value;work.edited=true;x.closest('td').querySelector('[data-issue-reason]').hidden=x.value==='已出票';}
  ctx.layerDirty(work.edited);
 });
 return {show};
};
})();
