(function(){
'use strict';
const M=window.AirOrders,D=window.AirSourceDemand;if(!M||!D)return;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=(v,c='CNY')=>v===null||v===''?'待补':c+' '+Number(v).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
const button=(name,action,primary=false)=>'<button type="button" class="btn '+(primary?'btn-primary':'btn-secondary')+'" data-as="'+action+'">'+name+'</button>';
const facts=rows=>'<dl class="as-facts">'+rows.map(([k,v])=>'<div><dt>'+esc(k)+'</dt><dd>'+esc(v??'—')+'</dd></div>').join('')+'</dl>';
const field=(name,key,v,type='text')=>'<label class="as-field"><span>'+esc(name)+'</span><input data-as-field="'+key+'" aria-label="'+esc(name)+'" type="'+type+'" value="'+esc(v)+'"></label>';
const section=(title,body)=>'<section class="as-section"><h3>'+esc(title)+'</h3>'+body+'</section>';
let host=null,dirty=false,trigger=null,context=null;
function mount(){if(host)return;host=document.createElement('div');host.id='air-source-demand-app';host.innerHTML='<div id="as-demand-dialog" class="modal-overlay drawer-overlay" data-static="true" aria-hidden="true"><div class="modal drawer-modal drawer-lg" role="dialog" aria-modal="true" aria-labelledby="as-title"><div class="modal-header"><h2 class="modal-title" id="as-title"></h2><button type="button" class="modal-close" data-layer-close-ready="true" data-as="close" aria-label="关闭供票需求">×</button></div><div class="modal-body"><div id="as-body"></div><div class="as-error" id="as-error" role="alert" hidden></div></div><div class="modal-footer" id="as-footer"></div></div></div>';document.body.append(host);
 host.addEventListener('input',()=>{dirty=true;});
 host.addEventListener('change',e=>{dirty=true;const card=e.target.closest('[data-as-order]');if(card&&e.target.matches('[data-as-select]'))card.querySelector('.as-order-body').hidden=!e.target.checked;});
 host.addEventListener('click',e=>{const btn=e.target.closest('[data-as]');if(!btn)return;e.preventDefault();e.stopPropagation();try{act(btn.dataset.as);}catch(err){const el=host.querySelector('#as-error');el.textContent=err.message;el.hidden=false;el.scrollIntoView({block:'nearest'});}});
 host.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();e.preventDefault();close();}if(e.key==='Tab'){const items=[...host.querySelectorAll('button,input,select,a[href],textarea')].filter(x=>!x.disabled&&x.offsetParent!==null);if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0]?.focus();}}},true);
}
function open(title,body,footer){mount();trigger=document.activeElement;dirty=false;host.querySelector('#as-title').textContent=title;host.querySelector('#as-body').innerHTML=body;host.querySelector('#as-footer').innerHTML=button('关闭','close')+footer;host.querySelector('#as-error').hidden=true;const l=host.querySelector('#as-demand-dialog');l.classList.add('show');l.setAttribute('aria-hidden','false');l.querySelector('button').focus();}
function close(force=false){if(!force&&dirty&&!window.confirm('当前内容未保存，确认离开吗？'))return;host?.querySelector('#as-demand-dialog').classList.remove('show');host?.querySelector('#as-demand-dialog').setAttribute('aria-hidden','true');dirty=false;trigger?.focus();}
function changed(data){if(!M.save(data))throw Error('浏览器未允许保存，请保留当前页面后重试');dirty=false;window.dispatchEvent(new Event('air-source-demand-updated'));context.onSave?.();}
function peopleChoices(s,o){return '<div class="as-checks">'+s.people.map(p=>'<label><input type="checkbox" data-as-person="'+esc(p.id)+'" '+(!o||o.people.some(x=>x.id===p.id)?'checked':'')+'>'+esc(p.name)+'<span class="text-muted">'+esc(p.id)+'</span></label>').join('')+'</div>';}
function openSubmit(getSource,role,onSave){
 role='superadmin';
 const s=D.source(getSource()),data=M.load(),oo=D.orders(data,s,role);context={kind:'submit',getSource,source:s,role,onSave};
 const cards=oo.map(o=>{const d=D.active(o);return '<section class="as-order" data-as-order="'+esc(o.id)+'"><label class="as-order-head"><input type="checkbox" data-as-select '+(d||o.sourceConditionsPending||o.state==='已取消'?'disabled':'')+'><strong>'+esc(o.id)+'</strong><span>'+esc(o.state)+'</span></label>'+facts([['现有供票价',money(M.totals(o).sale,o.currency)],['当前处理',d?d.state:o.sourceConditionsPending?'供票条件待复核':o.state==='已取消'?'已取消':'可提交需求']])+'<div class="as-order-body" hidden>'+field('本次供票团号','group',s.group||o.group)+section('本次受影响航段',o.legs.map((l,i)=>'<div class="as-leg"><label><input type="checkbox" data-as-leg="'+esc(l.id)+'" checked>'+esc((l.flight||'航班待定')+' · '+l.from+' → '+l.to)+'</label><span class="text-muted">原日期 '+esc(l.date)+'</span>'+field('本次日期 '+l.id,'date-'+l.id,i===0?s.start||l.date:i===o.legs.length-1?s.end||l.date:l.date,'date')+'</div>').join(''))+section('本次所选航段乘客',peopleChoices(s,o))+'</div></section>';}).join('');
 const fresh='<section class="as-order" data-as-order="NEW"><label class="as-order-head"><input type="checkbox" data-as-select '+(!oo.length?'checked':'')+'><strong>另建供票单</strong></label><div class="as-order-body" '+(oo.length?'hidden':'')+'><div class="as-grid">'+field('本次供票团号','group',s.group)+field('供票日期','newDate',s.start,'date')+field('出发机场三字码','from','')+field('到达机场三字码','to','')+field('航班号（可待定）','flight','')+'</div>'+section('本次供票乘客',peopleChoices(s))+'</div></section>';
 open('提交供票需求',section('来源旅游订单',facts([['订单号',s.orderNo],['线路',s.productName],['旅游团号',s.group||'无团号'],['旅游出发／回团',s.start+' / '+s.end],['旅游订单成交金额',money(s.tourAmount,s.currency)],['来源名单',s.people.length+' 人']]))+section('选择供票单',cards+fresh)+field('本次需求依据 *','reason',''),button('提交需求','submit',true));
}
function summary(o,role){role='superadmin';const d=D.latest(o);if(!d)return '';return '<section class="ao-section"><div class="ao-toolbar"><h2>供票需求</h2><button type="button" class="btn btn-secondary" data-as-open="'+esc(o.id)+'" data-as-role="'+esc(role)+'">'+(D.active(o)?'核对需求':'查看需求')+'</button></div>'+facts([['需求版本','第'+d.version+'版 · '+d.state],['旅游成交金额',money(d.source.tourAmount,d.source.currency)],['本单供票价',money(M.totals(o).sale,o.currency)],['供票条件',o.sourceConditionsPending?'变更后待复核':o.supplierConfirmed?'已确认':'待确认']])+'</section>';}
function comparison(rows){return rows.length?'<div class="as-comparison">'+rows.map(c=>'<div><strong>'+esc(c.label)+'</strong><span>'+esc(c.before===''?'未填写':c.before)+'</span><span class="text-muted">→</span><span>'+esc(c.after===''?'未填写':c.after)+'</span></div>').join('')+'</div>':'<p class="text-muted">本次未改变对应资料。</p>';}
function openReview(id,role,onSave){
 role='superadmin';
 const data=M.load(),o=data.orders.find(o=>o.id===id);if(!o||!M.canSee(o,role))throw Error('当前岗位无权查看本单');const d=D.active(o)||D.latest(o);if(!d)throw Error('本单暂无来源供票需求');context={kind:'review',id,role,onSave};
 let actions='',form='';
 if(d.state==='待计调核对'&&D.canReview(o,d,role))actions+=button('退回需求','reject')+button('确认需求','review',true);
 if(d.state==='待计调核对'&&(role==='superadmin'||role==='sales'))actions+=button('撤回需求','withdraw');
 if(d.state==='待票务接收'&&M.canEdit(o,role))actions+=button('退回需求','reject')+button('接收需求','accept',true);
 if(d.state==='待计调核对'&&role==='ticket')actions+=button('退回需求','reject');
 if(o.sourceConditionsPending&&M.canEdit(o,role))actions+=button('复核供票条件','conditions',true);
 if(d.state==='待取消办理'&&M.canEdit(o,role))actions+=button('确认取消供票','cancel-order',true);
 if(d.state==='待退改办理'&&M.canEdit(o,role)){
  const original=D.originalTickets(o,d),persons=o.people.filter(p=>original.some(t=>t.personId===p.id));
  form=section('原票办理','<div class="as-grid"><label class="as-field">办理乘客<select id="as-original-person">'+persons.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('')+'</select></label><label class="as-field">办理类型<select id="as-change-type"><option>改签</option><option>退票</option><option>资料更正</option></select></label></div>');actions+=button('办理原票变更','change',true);
 }
 const path=location.pathname.includes('/sales/')?'../tour/':'';
 if(o.sourceConditionsPending)form+=section('待确认内容',facts([['供应及机位','按本次日期、人数重新核对；原机位引用已解除'],['供票报价','本单原报价保留，复核仅确认沿用原价']])+(['草稿','待确认'].includes(o.state)?'<a class="btn btn-secondary" href="'+path+'air-order-edit.html?id='+encodeURIComponent(o.id)+'&role='+role+'">补齐供票资料</a>':''));
 if(actions&&d.state!=='待退改办理')form+=field('处理意见 / 依据 *','opinion','');
 open('供票需求核对',section('当前需求',facts([['供票单',o.id],['来源订单',o.sourceOrder],['需求版本','第'+d.version+'版'],['主状态',d.state],['旅游成交金额',money(d.source.tourAmount,d.source.currency)],['本单供票价',money(M.totals(o).sale,o.currency)],['提交依据',d.reason],['受影响航段',d.request.legIds.map(id=>{const l=o.legs.find(l=>l.id===id);return l?(l.flight||id)+' '+l.from+'→'+l.to:id;}).join('、')]]))+section('旅游订单变化',d.previousSource?comparison(d.sourceChanges):facts([['首次交接团号',d.source.group||'无团号'],['旅游日期',d.source.start+' / '+d.source.end]]))+section('本次供票变化',comparison(d.changes))+(d.protection?'<p class="as-warning">'+esc(d.protection)+'</p>':'')+form+section('处理记录',d.history.map(h=>'<div class="as-history"><strong>'+esc(h.text)+'</strong><span>'+esc(h.who+' · '+h.time)+'</span><span>'+esc(h.basis)+'</span></div>').join(''))+(o.sourceDemands.length>1?'<details><summary>历史需求 · '+(o.sourceDemands.length-1)+' 版</summary>'+o.sourceDemands.slice(0,-1).map(h=>section('第'+h.version+'版 · '+h.state,comparison([...h.sourceChanges,...h.changes])+facts([['提交依据',h.reason],['处理结果',h.history.at(-1)?.basis||'—']]))).join('')+'</details>':''),actions);
}
function act(action){
 if(action==='close'){close();return;}
 if(action==='submit'){
  const s=D.source(context.getSource());if(JSON.stringify(s)!==JSON.stringify(context.source))throw Error('来源订单资料已变化，请关闭后重新核对本次需求');
  const requests=[...host.querySelectorAll('[data-as-order]')].filter(card=>card.querySelector('[data-as-select]').checked).map(card=>{const val=k=>card.querySelector('[data-as-field="'+k+'"]')?.value.trim()||'',orderId=card.dataset.asOrder;const req={orderId:orderId==='NEW'?'':orderId,group:val('group'),peopleIds:[...card.querySelectorAll('[data-as-person]:checked')].map(x=>x.dataset.asPerson),legIds:[...card.querySelectorAll('[data-as-leg]:checked')].map(x=>x.dataset.asLeg),dates:{}};req.legIds.forEach(id=>req.dates[id]=val('date-'+id));if(orderId==='NEW')req.newLeg={date:val('newDate'),from:val('from').toUpperCase(),to:val('to').toUpperCase(),flight:val('flight').toUpperCase()};return req;});
  const data=M.load(),rr=D.submit(data,s,requests,host.querySelector('[data-as-field="reason"]').value,context.role);changed(data);open('供票需求已提交',facts(rr.map(r=>[r.id,r.unchanged?'与已接收需求相同，未重复提交':'第'+r.version+'版 · 待计调核对'])),'');return;
 }
 const data=M.load(),o=data.orders.find(o=>o.id===context.id),role=context.role,note=host.querySelector('[data-as-field="opinion"]')?.value||'';
 if(action==='change'){
  const d=D.active(o),pid=host.querySelector('#as-original-person').value,type=host.querySelector('#as-change-type').value;
  const original=D.originalTickets(o,d).filter(t=>t.personId===pid);if(!original.length)throw Error('请选择受本次需求影响的原票乘客');
  if(original.some(t=>t.state==='结果待查'))throw Error('原票结果待查，请先在名单出票中查证，不能直接发起退改');
  close(true);window.AirBusinessViews.startChange(o,pid,type,{reason:'供票需求 '+d.id+' 第'+d.version+'版；'+d.reason,legIds:original.map(t=>t.legId),dates:d.request.dates});return;
 }
 if(action==='review')D.review(o,role,note);if(action==='accept')D.accept(o,role,note);if(action==='reject')D.reject(o,role,note);if(action==='withdraw')D.withdraw(o,role);if(action==='conditions')D.confirmConditions(o,role,note);
 if(action==='cancel-order'){
  D.cancelOrder(o,role,note);
 }
 changed(data);openReview(o.id,role,context.onSave);
}
 document.addEventListener('click',e=>{const b=e.target.closest('[data-as-open]');if(!b)return;e.preventDefault();openReview(b.dataset.asOpen,b.dataset.asRole||'ticket');});
 window.AirSourceDemandViews={openSubmit,openReview,summary};
})();
