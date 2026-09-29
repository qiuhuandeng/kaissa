(function () {
  'use strict';
  const root=document.querySelector('[data-supplier-payment-application]');
  if(!root)return;
  const session=window.SupplierPaymentApplicationModel.createSession();
  const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const cash=(value,currency='CNY')=>(currency==='CNY'?'¥':currency+' ')+Number(value).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
  const tag=(text,color)=>'<span class="tag tag-'+color+'">'+esc(text)+'</span>';
  const stateTag=state=>tag(state,{可申请:'green',部分可申请:'orange',申请中:'blue',已付清:'gray',供应商应退:'red',账户待审核:'orange',成本无效:'gray',审批中:'orange',付款中:'blue',待财务复核:'orange',草稿:'gray',驳回待重提:'red',通过:'green'}[state]||'gray');
  let tab='eligible',filters={keyword:'',company:'',state:''},selected=new Set(),activeIds=[],dirty=false,returnFocus=null;

  root.innerHTML='<nav class="tab-bar list-surface-tabs list-filter-tabs" aria-label="付款申请工作区"><button class="tab-item active" type="button" data-spa-tab="eligible">待申请付款</button><button class="tab-item" type="button" data-spa-tab="records">申请记录</button></nav><div class="spa-content"></div><div class="rec-toast" role="status" hidden></div><div class="modal-overlay drawer-overlay spa-overlay" hidden aria-hidden="true"><div class="modal drawer-modal spa-drawer" role="dialog" aria-modal="true" aria-labelledby="spaDrawerTitle" tabindex="-1"><div class="modal-header"><div id="spaDrawerTitle" class="modal-title"></div><button class="modal-close" type="button" data-spa-action="close" aria-label="关闭">×</button></div><div class="modal-body spa-body"></div><div class="modal-footer spa-footer"></div></div></div><div class="modal-overlay spa-confirm" hidden><div class="modal modal-sm modal-confirm" role="alertdialog" aria-modal="true"><div class="modal-header"><div class="modal-title">确认放弃</div></div><div class="modal-body">当前付款申请尚未保存，确认放弃本次填写？</div><div class="modal-footer"><button class="btn btn-secondary" data-spa-action="keep">继续填写</button><button class="btn btn-primary" data-spa-action="discard">放弃</button></div></div></div>';
  const content=root.querySelector('.spa-content'),overlay=root.querySelector('.spa-overlay'),body=root.querySelector('.spa-body'),footer=root.querySelector('.spa-footer'),confirmBox=root.querySelector('.spa-confirm');
  document.body.append(overlay,confirmBox);
  let toastTimer;
  function toast(message){const node=root.querySelector('.rec-toast');node.textContent=message;node.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.hidden=true,4000);}
  function section(title){return '<div class="drawer-section-head"><h3 class="drawer-section-title">'+title+'</h3></div>';}
  function button(action,label,primary=false){return '<button type="button" class="btn '+(primary?'btn-primary':'btn-secondary')+'" data-spa-action="'+action+'">'+label+'</button>';}
  function open(title){returnFocus=document.activeElement;overlay.querySelector('#spaDrawerTitle').textContent=title;overlay.hidden=false;overlay.setAttribute('aria-hidden','false');requestAnimationFrame(()=>{overlay.classList.add('show');overlay.querySelector('[role="dialog"]').focus();});body.scrollTop=0;dirty=false;}
  function close(force=false){if(dirty&&!force){confirmBox.hidden=false;requestAnimationFrame(()=>confirmBox.classList.add('show'));return;}dirty=false;overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true');setTimeout(()=>{overlay.hidden=true;returnFocus?.focus?.();},200);}
  function options(values,current,empty){return (empty?'<option value="">'+empty+'</option>':'')+values.map(value=>'<option value="'+esc(value)+'"'+(value===current?' selected':'')+'>'+esc(value)+'</option>').join('');}

  function visibleCosts(){return session.list().filter(row=>(!filters.keyword||[row.id,row.supplier,row.tour,row.order,row.item,row.statement].join(' ').toLowerCase().includes(filters.keyword.toLowerCase()))&&(!filters.company||row.company===filters.company)&&(!filters.state||row.state===filters.state));}
  function renderEligible(){
    const rows=visibleCosts(),companies=[...new Set(session.list().map(row=>row.company))];
    content.innerHTML='<section class="filter-card filter-card-compact list-surface-filter" data-list-filter-enhanced="true" aria-label="付款申请筛选"><div class="list-surface-filter-layout"><div class="list-surface-filter-fields"><div class="filter-item"><input id="spaKeyword" type="search" placeholder="供应商 / 团期 / 订单 / 成本项" value="'+esc(filters.keyword)+'"></div><div class="filter-item filter-item-sm"><select id="spaCompany">'+options(companies,filters.company,'全部采购公司')+'</select></div><div class="filter-item filter-item-sm"><select id="spaState">'+options(['可申请','部分可申请','申请中','已付清','供应商应退','账户待审核'],filters.state,'全部状态')+'</select></div><div class="filter-actions">'+button('search','搜索')+button('reset','重置')+'</div></div><div class="list-surface-filter-actions list-filter-pinned-actions">'+button('batch','批量申请',true)+'</div></div></section><div class="table-wrap list-surface-table spa-table-wrap"><table class="spa-table"><colgroup><col class="spa-col-check"><col class="spa-col-payee"><col class="spa-col-tour"><col class="spa-col-basis"><col class="spa-col-paid"><col class="spa-col-available"><col class="spa-col-invoice"><col class="spa-col-status"><col class="spa-col-action"></colgroup><thead><tr><th><input type="checkbox" data-spa-select-all aria-label="选择全部可申请成本"></th><th>付款对象</th><th>关联团期／订单</th><th>成本与最终金额</th><th>已付／占用</th><th>可申请或应退</th><th>票据</th><th>付款状态</th><th class="spa-action-cell">操作</th></tr></thead><tbody>'+rows.map(row=>'<tr data-spa-cost="'+row.id+'"><td><input type="checkbox" data-spa-select="'+row.id+'"'+(selected.has(row.id)?' checked':'')+(row.available<=0||row.refundDue>0||!row.account?' disabled':'')+'></td><td><strong class="spa-line">'+esc(row.supplier)+'</strong><span class="spa-muted spa-line">'+esc(row.company+' · '+row.currency)+'</span><span class="spa-muted spa-line">'+esc(row.item)+'</span></td><td><strong class="spa-line">'+esc(row.tour)+'</strong><span class="spa-muted spa-line">'+esc(row.order)+'</span><span class="spa-muted spa-line">'+esc(row.settlement+' · '+row.reconciliation)+'</span></td><td><span class="spa-line">成本 '+cash(row.cost,row.currency)+'</span><strong class="spa-line">付款上限 '+cash(row.basis,row.currency)+'</strong><span class="spa-muted spa-line">'+esc(row.final==null?'未对账，按成本金额':'最终对账 '+row.statement)+'</span></td><td><span class="spa-line">净已付 '+cash(row.netPaid,row.currency)+'</span><span class="spa-muted spa-line">申请／付款中 '+cash(row.occupied,row.currency)+'</span></td><td><strong class="spa-line '+(row.refundDue?'spa-danger':'')+'">'+(row.refundDue?'应退 '+cash(row.refundDue,row.currency):cash(row.available,row.currency))+'</strong><span class="spa-muted spa-line">'+esc(row.node)+'</span></td><td>'+esc(row.invoice)+'</td><td>'+stateTag(row.state)+'</td><td class="spa-action-cell"><div class="table-action">'+(row.refundDue>0&&row.actualPayments?.length?'<button class="table-action-primary" type="button" data-spa-refund="'+row.id+'">申请退回</button>':'<button class="table-action-primary" type="button" data-spa-open="'+row.id+'"'+(row.available<=0||row.refundDue>0||!row.account?' disabled':'')+'>申请</button>')+'</div></td></tr>').join('')+(rows.length?'':'<tr><td colspan="9" class="spa-empty">没有符合条件的成本项</td></tr>')+'</tbody></table></div><div class="pagination list-surface-pagination"><span>共 '+rows.length+' 条 · 付款不以团期结算或供应商对账为前置</span></div>';
  }

  function renderRecords(){
    const rows=session.requests();
    content.innerHTML='<section class="filter-card filter-card-compact list-surface-filter"><div class="list-surface-filter-layout"><div class="list-surface-filter-fields"><p class="spa-list-note">草稿由计调继续编辑；提交后交付款复核岗，付款执行、回单和NC仍在财务模块办理。</p></div><div class="list-surface-filter-actions list-filter-pinned-actions"><a class="btn btn-secondary" href="../approval/approvals.html?view=mine">我发起的审批</a></div></div></section><div class="table-wrap list-surface-table spa-table-wrap"><table class="spa-table spa-record-table"><thead><tr><th>申请单</th><th>付款对象</th><th>付款性质</th><th>关联成本</th><th>申请金额</th><th>期望付款日</th><th>申请状态</th><th class="spa-action-cell">操作</th></tr></thead><tbody>'+rows.map(row=>'<tr><td><strong class="spa-line">'+row.id+'</strong><span class="spa-muted spa-line">'+esc(row.company)+'</span></td><td><strong class="spa-line">'+esc(row.supplier)+'</strong><span class="spa-muted spa-line">'+esc(row.currency+' · '+row.account)+'</span></td><td>'+esc(row.kind)+'</td><td>'+row.lines.length+' 条<span class="spa-muted spa-line">'+esc(row.lines.map(line=>session.get(line.id).tour).join('、'))+'</span></td><td><strong>'+cash(row.amount,row.currency)+'</strong></td><td>'+esc(row.date||'-')+'</td><td>'+stateTag(row.state)+'</td><td class="spa-action-cell"><button class="table-action-primary" data-spa-request="'+row.id+'">详情</button></td></tr>').join('')+'</tbody></table></div><div class="pagination list-surface-pagination">共 '+rows.length+' 条</div>';
  }
  function render(){root.querySelectorAll('[data-spa-tab]').forEach(node=>node.classList.toggle('active',node.dataset.spaTab===tab));if(tab==='eligible')renderEligible();else renderRecords();}

  function openApply(ids){
    let rows;
    try{rows=session.group(ids);}catch(error){toast(error.message);return;}
    activeIds=rows.map(row=>row.id);
    const first=rows[0];
    body.innerHTML='<div class="spa-error" role="alert" hidden></div><section class="spa-summary"><div><span>付款对象</span><strong>'+esc(first.supplier)+'</strong></div><div><span>采购公司</span><strong>'+esc(first.company)+'</strong></div><div><span>币种／账户</span><strong>'+esc(first.currency+' · '+first.account)+'</strong></div></section>'+section('本次付款明细')+'<div class="spa-lines">'+rows.map(row=>'<div class="spa-apply-line" data-spa-line="'+row.id+'"><div><strong>'+esc(row.item)+'</strong><span class="spa-muted spa-line">'+esc(row.tour+' · '+row.order)+'</span><span class="spa-muted spa-line">付款上限 '+cash(row.basis,row.currency)+'；净已付 '+cash(row.netPaid,row.currency)+'；占用 '+cash(row.occupied,row.currency)+'</span></div><label>本次申请金额<input class="form-control" type="number" min="0.01" step="0.01" max="'+row.available+'" data-spa-amount value="'+Math.min(row.available,row.suggested||row.available)+'"></label><strong class="spa-available">可申请 '+cash(row.available,row.currency)+'</strong></div>').join('')+'</div><div class="spa-total" data-spa-total></div>'+section('付款信息')+'<div class="rec-form-grid spa-form"><label>付款性质<select id="spaKind" class="form-control"><option>预付款</option><option'+(first.reconciliation==='已对账'?' selected':'')+'>付款</option></select></label><label>期望付款日期<input id="spaDate" class="form-control" type="date" value="2026-09-30"></label><label class="rec-full">收款账户<input class="form-control" value="'+esc(first.account)+'" disabled></label><label class="rec-full">付款依据<textarea id="spaBasis" class="form-control" rows="3" maxlength="500" placeholder="填写合同付款节点、采购确认或其他付款依据"></textarea></label><label class="rec-full">付款附件<input id="spaAttachment" class="form-control" type="file" accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx"></label></div><p class="spa-rule">付款资格来自已保存的有效外采成本项。团期结算、供应商对账和发票状态只作为核对信息，不阻断本次申请；最终对账后按确认金额重新计算补付或应退。</p>';
    footer.innerHTML=button('close','取消')+button('save','保存草稿')+button('submit','提交财务复核',true);
    updateTotal();open(ids.length>1?'批量付款申请':'申请付款');
  }
  function updateTotal(){const total=activeIds.reduce((sum,id)=>sum+Number(body.querySelector('[data-spa-line="'+id+'"] [data-spa-amount]')?.value||0),0);const first=session.get(activeIds[0]);body.querySelector('[data-spa-total]').textContent='本次申请合计 '+cash(total,first.currency);}
  function error(message){const node=body.querySelector('.spa-error');node.textContent=message;node.hidden=false;node.scrollIntoView({block:'nearest'});}
  function submit(isSubmit){
    const first=session.get(activeIds[0]);const file=body.querySelector('#spaAttachment').files[0];
    if(file&&file.size>10*1024*1024)throw Error('付款附件不能超过10MB');
    const request=session.save({company:first.company,supplier:first.supplier,currency:first.currency,account:first.account,kind:body.querySelector('#spaKind').value,date:body.querySelector('#spaDate').value,basis:body.querySelector('#spaBasis').value,attachment:file?.name||'',lines:activeIds.map(id=>({id,amount:body.querySelector('[data-spa-line="'+id+'"] [data-spa-amount]').value}))},isSubmit);
    dirty=false;close(true);selected.clear();render();toast(isSubmit?'已提交 '+request.id+'，待财务复核':'已保存付款申请草稿 '+request.id);
  }
  function openRequest(id){
    const request=session.request(id);
    body.innerHTML='<section class="spa-summary"><div><span>申请单</span><strong>'+request.id+'</strong></div><div><span>申请状态</span><strong>'+esc(request.state)+'</strong></div><div><span>当前办理</span><strong>'+esc(request.next)+'</strong></div></section>'+section('付款信息')+'<dl class="rec-facts"><div><dt>付款对象</dt><dd>'+esc(request.supplier)+'</dd></div><div><dt>付款性质</dt><dd>'+esc(request.kind)+'</dd></div><div><dt>申请金额</dt><dd>'+cash(request.amount,request.currency)+'</dd></div><div><dt>期望付款日</dt><dd>'+esc(request.date||'-')+'</dd></div><div><dt>收款账户</dt><dd>'+esc(request.account)+'</dd></div><div><dt>付款依据</dt><dd>'+esc(request.basis||'-')+'</dd></div></dl>'+section('关联成本')+'<div class="spa-lines">'+request.lines.map(line=>{const row=session.get(line.id);return '<div class="spa-record-line"><div><strong>'+esc(row.item)+'</strong><span class="spa-muted spa-line">'+esc(row.tour+' · '+row.order)+'</span></div><strong>'+cash(line.amount,request.currency)+'</strong></div>';}).join('')+'</div>'+section('办理记录')+'<ol class="rec-events">'+request.history.map(item=>'<li>'+esc(item)+'</li>').join('')+'</ol>';
    footer.innerHTML=button('close','关闭');open('付款申请详情');dirty=false;
  }

  function handleClick(event){
    const tabButton=event.target.closest('[data-spa-tab]');if(tabButton){tab=tabButton.dataset.spaTab;selected.clear();render();return;}
    const selectAll=event.target.closest('[data-spa-select-all]');if(selectAll){visibleCosts().filter(row=>row.available>0&&!row.refundDue&&row.account).forEach(row=>selectAll.checked?selected.add(row.id):selected.delete(row.id));renderEligible();return;}
    const select=event.target.closest('[data-spa-select]');if(select){select.checked?selected.add(select.dataset.spaSelect):selected.delete(select.dataset.spaSelect);return;}
    const refund=event.target.closest('[data-spa-refund]');if(refund){window.CostPaymentReturn?.open(session.get(refund.dataset.spaRefund));return;}
    const opener=event.target.closest('[data-spa-open]');if(opener){openApply([opener.dataset.spaOpen]);return;}
    const request=event.target.closest('[data-spa-request]');if(request){openRequest(request.dataset.spaRequest);return;}
    const action=event.target.closest('[data-spa-action]')?.dataset.spaAction;if(!action){if(event.target===overlay)close();return;}
    try{
      if(action==='search'){filters={keyword:content.querySelector('#spaKeyword').value.trim(),company:content.querySelector('#spaCompany').value,state:content.querySelector('#spaState').value};renderEligible();}
      if(action==='reset'){filters={keyword:'',company:'',state:''};selected.clear();renderEligible();}
      if(action==='batch')openApply([...selected]);
      if(action==='close')close();
      if(action==='save')submit(false);
      if(action==='submit')submit(true);
      if(action==='keep'){confirmBox.classList.remove('show');confirmBox.hidden=true;}
      if(action==='discard'){confirmBox.classList.remove('show');confirmBox.hidden=true;close(true);}
    }catch(err){error(err.message);}
  }
  root.addEventListener('click',handleClick);
  overlay.addEventListener('click',handleClick);
  confirmBox.addEventListener('click',handleClick);
  body.addEventListener('input',event=>{dirty=true;if(event.target.matches('[data-spa-amount]'))updateTotal();});
  body.addEventListener('change',()=>{dirty=true;});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();if(!confirmBox.hidden){confirmBox.classList.remove('show');confirmBox.hidden=true;}else if(!overlay.hidden)close();}});

  const params=new URLSearchParams(location.search),statement=params.get('statementNo'),cost=params.get('costId');
  if(params.get('tab')==='records'){tab='records';render();}
  else if(statement){filters.keyword=statement;const match=session.list().find(row=>row.statement===statement&&row.available>0&&!row.refundDue&&row.account);render();if(match)openApply([match.id]);else toast('本对账单当前没有可申请余额，请查看已付或供应商应退金额');}
  else if(cost){render();openApply([cost]);}
  else render();
})();
