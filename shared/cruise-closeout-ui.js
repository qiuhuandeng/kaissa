(function(root){
  'use strict';
  const M=root.CruiseCloseout,P=root.CaesarCruisePurchase,E=P.esc,F=P.money;
  const a=(url,label)=>'<a class="crp-link" href="'+E(url)+'">'+E(label)+'</a>';
  const b=(action,label,key,primary=false)=>'<button type="button" class="crp-btn'+(primary?' primary':'')+'" data-cce="'+action+'" data-key="'+E(key||'')+'">'+E(label)+'</button>';
  const table=(heads,rows)=>'<div class="cc-scroll"><table class="cc-table"><thead><tr>'+heads.map(h=>'<th>'+E(h)+'</th>').join('')+'</tr></thead><tbody>'+ (rows.length?rows.map(row=>'<tr>'+row.map(cell=>'<td>'+cell+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="'+heads.length+'">暂无记录</td></tr>')+'</tbody></table></div>';
  const sec=(title,body)=>'<section class="cc-section"><h3>'+E(title)+'</h3>'+body+'</section>';
  const purchaseUrl=c=>'../cruise/'+P.pages[c.kind]+'?id='+encodeURIComponent(c.id)+'&closeout='+encodeURIComponent(c.key);
  const costUrl=(c,id)=>'../tour/fulfillment-cost.html?scheduleNo='+encodeURIComponent(id)+'&cruiseSource='+encodeURIComponent(c.key);
  let editor,adapter,draft;
  function purchaseHtml(s,kind,row){
    if(kind==='receipts')return '';
    const list=M.contexts(s,kind,row.id);if(!list.length&&(kind!=='contracts'||row.status!=='已签订'))return '';
    const execution=sec('航次履约与费用核对',table(['出发／返航','采购／入库','船方费用／采购差额','核对结果','操作'],list.map(c=>{const r=M.get(c.key,s),f=M.facts(c,r);return [E(c.date)+'<small>'+E(c.back)+'</small>',c.quantity+' / '+c.received+' 间',E(c.currency)+' '+F(f.amount)+'<small>差额 '+F(f.difference)+'</small>',E(r.status)+(r.pending?'<small>待核 '+F(r.pending)+'</small>':''),b('open',r.status==='已核对'?'查看核对':'费用核对',c.key)];})));
    return execution+(kind==='orders'?sec('合同付款办理',paymentHtml(s.contracts.find(c=>c.id===row.contractId),s)):'');
  }
  function paymentHtml(c,s=P.read()){
    const planned=P.sum(c.payments,'amount'),difference=M.round(P.contractTotal(c)-planned);
    return table(['付款节点／到期日','计划金额（'+c.currency+'）','已申请','申请记录／状态','实际支付'],M.paymentRows(c.id,s).map(p=>[E(p.name)+'<small>'+E(p.due)+'</small>',F(p.amount),F(p.requested),E(p.requestNo||'—')+'<small>'+E(p.status)+'</small>',E(p.paymentStatus)]))+
      '<p class="cc-note">计划合计 '+F(planned)+' · 合同金额／预算 '+F(P.contractTotal(c))+' · 尚未列入付款计划 '+F(difference)+'。计划不代表最终应付；最终款项按船方核对及预付冲抵另核。同一合同不按航次重复申请。</p>'+a('../tour/fulfillment-payment-apply.html?cruiseContract='+encodeURIComponent(c.id),'查看本合同付款申请');
  }
  function input(label,key,type='number',options){const value=draft[key];return '<label class="cc-field"><span>'+E(label)+'</span>'+(options?'<select data-cc-field="'+key+'">'+options.map(v=>'<option'+(v===value?' selected':'')+'>'+E(v)+'</option>').join('')+'</select>':'<input data-cc-field="'+key+'" type="'+type+'" value="'+E(value)+'"'+(type==='number'?' min="0" step="any"':'')+'>')+'</label>';}
  function sync(){document.querySelectorAll('[data-cc-field]').forEach(el=>draft[el.dataset.ccField]=el.type==='number'?Number(el.value):el.value);document.querySelectorAll('[data-cc-share]').forEach(el=>draft.shares[+el.dataset.ccShare].amount=Number(el.value));}
  function totals(c){const f=M.facts(c,draft);return '<div class="cc-totals"><span>采购约定 <b>'+F(c.estimate)+'</b></span><span>船方费用 <b>'+F(f.amount)+'</b></span><span>采购差额 <b>'+F(f.difference)+'</b></span><span>分配差额 <b>'+F(f.unassigned)+'</b></span></div>';}
  function form(c){
    const read=draft.status==='已核对',f=M.facts(c,draft);
    let html='<div id="ccTotals">'+totals(c)+'</div>'+sec('本航次执行', '<p class="cc-note">'+E(c.contractId+' · '+c.date+' 至 '+c.back+' · '+c.supplier+' · '+c.currency)+'</p><div class="cc-grid">'+input('费用承担公司','company','text')+input('船方认可销售（间）','recognized')+input('已退舱（间）','returned')+'<div class="cc-field"><span>采购／已入库／未售未退</span><strong>'+c.quantity+' / '+c.received+' / '+f.unsold+' 间</strong></div></div>')+
    sec('船方费用与退费', '<div class="cc-grid">'+input('船票／包舱费','ticket')+input('港口税费','port')+input('燃油附加费','fuel')+input('其他费用','other')+input('船方确认退费','credit')+input('未售／退舱损失金额','loss')+input('损失是否已含','lossMode','select',['已含船费','另计费用'])+'</div>')+
    (c.type==='保底切舱'?sec('保底核对','<p class="cc-note">合同约定 '+E(c.guarantee)+'%；'+E(c.guaranteeRule)+'</p><div class="cc-grid">'+input('核对范围','guaranteeScope','select',['待核合同范围','本航次／间','打包累计／待结清','打包结清分配至本航次'])+input('本次约定保底（间）','guaranteeCount')+input('船方确认补差','guaranteeAmount')+input('补差是否已含','guaranteeMode','select',['已含船费','另计费用'])+'</div><p class="cc-note">'+(f.shortfall===null?'不按本航次销量自动计算打包补差':'认可销售 '+draft.recognized+' 间，距保底 '+f.shortfall+' 间；费用以船方确认结果为准')+'</p>'):'')+
    sec('各团承担',draft.shares.length?table(['团期／出发地','本次承担（'+c.currency+'）','原成本办理'],draft.shares.map((x,i)=>[E(x.id)+'<small>'+E(x.label)+'</small>','<input aria-label="'+E(x.label+'承担金额')+'" data-cc-share="'+i+'" type="number" min="0" value="'+x.amount+'">',a(costUrl(c,x.id),'进入团期结算')])):'<p class="cc-note">尚无已关联销售团期。费用可先核对，分配与本团承担在原团期结算维护；未分配前不出航次毛利。</p>')+
    sec('确认依据与待核事项','<div class="cc-grid">'+input('船方账单／确认依据','reference','text')+input('采购差额与费用范围说明','reason','text')+input('仍待核定金额','pending')+input('售后／船方争议说明','pendingReason','text')+'</div>')+
    sec('核对记录',table(['时间','处理结果','船方费用'],draft.history.map(h=>[E(h.at),E(h.text),F(h.amount)])));
    adapter.show('航次费用核对 · '+c.date,'<div class="cc-editor"'+(read?' data-cc-readonly':'')+'>'+html+'<p id="ccError" role="alert" hidden></p></div>',b('back','返回',c.key)+(read?'':b('save','保存核对',c.key)+b('confirm','确认费用',c.key,true)));
    if(read)document.querySelectorAll('[data-cc-field],[data-cc-share]').forEach(el=>el.disabled=true);
  }
  function open(k,a){adapter=a||adapter;editor=M.context(k);draft=M.get(k);form(editor);}
  function costPanel(schedule,host){
    const c=M.sourceForGroup(schedule.id);if(!host)return;let panel=host.querySelector('[data-cc-source]');if(!c){panel?.remove();return;}
    const r=M.get(c.key),f=M.facts(c,r),current=r.shares.find(x=>x.id===schedule.id),delta=M.round(Number(schedule.actual)-current.amount);
    if(!panel){panel=document.createElement('div');panel.dataset.ccSource='';host.append(panel);}
    panel.innerHTML=sec('采购履约核对',table(['采购合同／航次','采购约定','船方费用','采购差额','核对结果'],[[E(c.contractId)+'<small>'+E(c.voyage)+'</small>',F(c.estimate),F(f.amount),F(f.difference),E(r.status)]])+ '<p class="cc-note">本次分配 '+F(current.amount)+' · 原本团成本 '+F(schedule.actual)+' · 差额 '+F(delta)+(schedule.settlement.status==='已结算'&&delta?'；已结算原值保留，差额走二次结算':'')+'</p><div class="cc-links">'+a(purchaseUrl(c),'查看采购核对')+a('../data/settlement-reports.html?tab=voyages&voyage='+encodeURIComponent(c.voyage),'查看航次毛利')+'</div>');
  }
  function bindPurchase(a,kind,id){adapter=a;const p=new URLSearchParams(location.search),k=p.get('closeout');if(k&&M.contexts(P.read(),kind,id).some(c=>c.key===k))open(k,a);}
  document.addEventListener('click',e=>{const el=e.target.closest('[data-cce]');if(!el)return;try{const k=el.dataset.key;if(el.dataset.cce==='open'){open(k);return;}if(el.dataset.cce==='back'){adapter.back();return;}sync();const r=M.save(k,draft,el.dataset.cce==='confirm');draft=r;form(editor);}catch(error){const node=document.getElementById('ccError');if(node){node.hidden=false;node.textContent=error.message;}else root.alert(error.message);}});
  document.addEventListener('input',e=>{if(e.target.matches('[data-cc-field],[data-cc-share]')){sync();document.getElementById('ccTotals').innerHTML=totals(editor);}});
  root.CruiseCloseoutUI={purchaseHtml,paymentHtml,bindPurchase,costPanel,open,purchaseUrl,costUrl,table};
})(window);
