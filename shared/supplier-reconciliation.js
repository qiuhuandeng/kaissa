/* 仅在挂载页内保存操作；不读取或写入其他端的业务状态。 */
(function () {
  'use strict';
  const root = document.querySelector('[data-reconciliation-app]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  const M = window.SupplierReconciliationModel;
  const agreements = window.SupplierCompanyAgreements;
  const session = M.createSession(root.dataset.reconciliationApp, agreements);
  const merchant = session.role === 'merchant';
  if(!merchant){const identity=()=>{const badge=document.querySelector('.workspace-current-text');if(badge)badge.textContent=session.supplier;};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',identity,{once:true});else identity();}
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = (v, currency) => (currency === 'CNY' ? '¥' : currency + ' ') + Number(v).toLocaleString('zh-CN', {minimumFractionDigits:2,maximumFractionDigits:2});
  const state = s => merchant ? M.states[s.state] : ({reviewing:'待采购公司核对',returned:'待补充',pending:'待确认',disputed:'差异处理中',confirmed:'已确认',void:'已作废'}[s.state]);
  const tag = s => '<span class="tag tag-' + ({draft:'gray',reviewing:'orange',returned:'red',pending:'orange',disputed:'red',confirmed:'green',void:'gray'}[s.state]) + '">' + state(s) + '</span>';
  const section = title => '<div class="drawer-section-head"><h3 class="drawer-section-title">' + title + '</h3></div>';
  const button = (action, text, primary) => '<button type="button" class="btn '+(primary?'btn-primary':'btn-secondary')+'" data-rec-action="'+action+'">'+text+'</button>';
  const options = (items, selected, empty) => (empty===undefined?'':'<option value="">'+esc(empty)+'</option>') + items.map(x=>'<option value="'+esc(x)+'"'+(x===selected?' selected':'')+'>'+esc(x)+'</option>').join('');
  const vendors = [...new Set(session.sources().map(x=>x.supplier))];
  let filters = {keyword:'',company:'',supplier:'',state:'',start:'',end:''};
  let active = null, editing = null, dirty = false, returnFocus = null, confirmCallback = null;
  let candidateIds = new Set();
  let billEditing=null, billValues=new Map(), billFiles=[], billMatch=null;
  const currentTotal=s=>['reviewing','returned'].includes(s.state)?s.lines.reduce((n,l)=>n+M.cents(l.claim),0)/100:M.sum(s.lines);
  const handler=s=>({draft:s.company+' · 计调',reviewing:s.company+' · 计调',returned:s.supplier+' · 对账人员',pending:s.supplier+' · 对账人员',disputed:s.company+' · 计调',confirmed:s.company+' · 财务应付岗',void:'已结束'}[s.state]);
  root.classList.add('rec-app');
  root.innerHTML = '<div class="rec-list"></div><div class="rec-toast" role="status" hidden></div>' +
    '<div class="modal-overlay drawer-overlay rec-overlay" hidden aria-hidden="true"><div class="modal drawer-modal rec-drawer" role="dialog" aria-modal="true" aria-labelledby="recDrawerTitle" tabindex="-1"><div class="modal-header"><div id="recDrawerTitle" class="modal-title"></div><button type="button" class="modal-close" data-rec-action="close" aria-label="关闭">×</button></div><div class="modal-body rec-body"></div><div class="modal-footer rec-footer"></div></div></div>' +
    '<div class="modal-overlay rec-confirm-overlay" hidden><div class="modal modal-sm modal-confirm" role="alertdialog" aria-modal="true" aria-labelledby="recConfirmTitle" aria-describedby="recConfirmText" tabindex="-1"><div class="modal-header"><div class="modal-title" id="recConfirmTitle">确认操作</div></div><div class="modal-body" id="recConfirmText"></div><div class="modal-footer">'+button('cancel-confirm','取消')+button('accept-confirm','确认',true)+'</div></div></div>';
  const list = root.querySelector('.rec-list'), overlay = root.querySelector('.rec-overlay'), body = root.querySelector('.rec-body'), footer = root.querySelector('.rec-footer'), confirmOverlay = root.querySelector('.rec-confirm-overlay');
  const adjustments=window.SupplierAdjustmentUI?.create({session,body,footer,esc,money,section,open,detail,error,confirm,leave:fn=>{if(dirty)confirm('有未保存的内容，确认放弃本次修改？',fn);else fn();}});
  let toastTimer;
  function toast(message) { const node=root.querySelector('.rec-toast'); node.textContent=message; node.hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>node.hidden=true,4500); }
  function error(message) { const node=body.querySelector('.rec-error'); node.textContent=message; node.hidden=false; node.scrollIntoView({block:'nearest'}); }
  function listRender() {
    const rows=session.list().filter(s=>(!filters.company||s.company===filters.company)&&(!filters.supplier||s.supplier===filters.supplier)&&(!filters.state||s.state===filters.state)&&(!filters.start||s.end>=filters.start)&&(!filters.end||s.start<=filters.end)&&(!filters.keyword||[s.id,s.supplier,s.company,...s.lines.flatMap(l=>[l.order,l.tour,l.name])].join(' ').toLowerCase().includes(filters.keyword.toLowerCase())));
    list.innerHTML='<section class="filter-card filter-card-compact list-surface-filter rec-filter" data-list-filter-enhanced="true" aria-label="供应商对账筛选"><div class="list-surface-filter-layout"><div class="list-surface-filter-fields">'+
      '<div class="filter-item"><input id="recKeyword" type="search" aria-label="对账单、订单或团期" placeholder="对账单 / 订单 / 团期" value="'+esc(filters.keyword)+'"></div>'+
      '<div class="filter-item filter-item-sm"><select id="recCompany" aria-label="采购公司">'+options(session.companies,filters.company,'全部采购公司')+'</select></div>'+
      (merchant?'<div class="filter-item filter-item-sm"><select id="recSupplier" aria-label="供应商">'+options(vendors,filters.supplier,'全部供应商')+'</select></div>':'')+
      '<div class="filter-item filter-item-sm"><select id="recStatus" aria-label="对账状态"><option value="">全部状态</option>'+Object.keys(M.states).filter(s=>merchant||s!=='draft').map(s=>'<option value="'+s+'"'+(s===filters.state?' selected':'')+'>'+state({state:s})+'</option>').join('')+'</select></div>'+
      '<div class="filter-item filter-item-wide"><div class="date-range"><input id="recStart" type="date" aria-label="对账期间开始" value="'+esc(filters.start)+'"><span>至</span><input id="recEnd" type="date" aria-label="对账期间结束" value="'+esc(filters.end)+'"></div></div>'+
      '<div class="filter-actions">'+button('search','搜索')+button('reset','重置')+'</div></div>'+'<div class="filter-actions list-surface-filter-actions list-filter-pinned-actions">'+(merchant?button('purchases','采购依据')+button('create','新建对账',true):button('create-bill','提交账单',true))+'</div>'+'</div></section>'+
      '<div class="table-wrap list-surface-table rec-table-wrap"><table class="rec-table"><colgroup><col class="rec-col-statement"><col class="rec-col-company"><col class="rec-col-period"><col class="rec-col-count"><col class="rec-col-money"><col class="rec-col-status"><col class="rec-col-action"></colgroup><thead><tr><th>对账单'+(merchant?' / 供应商':'')+'</th><th>采购公司</th><th>对账期间</th><th>订单数</th><th>本次对账金额</th><th>对账状态</th><th class="rec-action-cell">操作</th></tr></thead><tbody>'+rows.map(s=>'<tr data-rec-id="'+s.id+'"><td><strong class="rec-line">'+s.id+'</strong><span class="rec-muted rec-line">'+esc(merchant?s.supplier:'第 '+s.revision+' 版')+'</span></td><td>'+esc(s.company)+'</td><td><span class="rec-line">'+s.start+'</span><span class="rec-muted rec-line">至 '+s.end+'</span></td><td>'+new Set(s.lines.map(l=>l.order)).size+' 单</td><td class="rec-amount">'+money(currentTotal(s),s.currency)+'</td><td>'+tag(s)+'</td><td class="rec-action-cell"><div class="table-action"><button type="button" class="table-action-primary" data-rec-open="'+s.id+'">'+(merchant?(s.state==='draft'?'编辑':s.state==='reviewing'?'核对':s.state==='disputed'?'处理':'详情'):(s.state==='pending'?'核对':s.state==='returned'?'补充':'详情'))+'</button></div></td></tr>').join('')+(rows.length?'':'<tr><td colspan="7" class="rec-empty">没有符合条件的对账单</td></tr>')+'</tbody></table></div><div class="pagination list-surface-pagination"><span>共 '+rows.length+' 条</span></div>';
  }
  function open(title) { root.querySelector('.rec-toast').hidden=true; returnFocus=document.activeElement; root.querySelector('#recDrawerTitle').textContent=title; overlay.hidden=false; overlay.setAttribute('aria-hidden','false'); requestAnimationFrame(()=>{overlay.classList.add('show'); overlay.querySelector('[role="dialog"]').focus();}); dirty=false; body.scrollTop=0; }
  function close(force) { if(dirty&&!force) { confirm('有未保存的内容，确认放弃本次修改？',()=>close(true)); return; } dirty=false; overlay.classList.remove('show'); overlay.setAttribute('aria-hidden','true'); setTimeout(()=>{overlay.hidden=true; if(returnFocus&&returnFocus.isConnected)returnFocus.focus();},240); }
  function confirm(message, callback) { confirmCallback=callback; root.querySelector('#recConfirmText').textContent=message; confirmOverlay.hidden=false; requestAnimationFrame(()=>{confirmOverlay.classList.add('show');confirmOverlay.querySelector('[data-rec-action="cancel-confirm"]').focus();}); }
  function summary(s) { return '<div class="rec-summary"><div class="rec-summary-title"><strong>'+s.id+'</strong>'+tag(s)+'</div><div class="rec-summary-context">'+esc(s.company+' / '+s.supplier)+'</div><dl class="rec-facts"><div><dt>本次对账金额</dt><dd>'+money(currentTotal(s),s.currency)+'</dd></div><div><dt>对账版本</dt><dd>第 '+s.revision+' 版</dd></div><div><dt>对账期间</dt><dd>'+s.start+' 至 '+s.end+'</dd></div></dl><div class="rec-handler">当前办理：'+esc(handler(s))+'</div></div>'; }
  function draftData() { const v=id=>body.querySelector('#'+id).value; return {company:v('recDraftCompany'),supplier:v('recDraftSupplier'),agreement:v('recAgreement'),currency:v('recCurrency'),start:v('recDraftStart'),end:v('recDraftEnd'),remark:v('recRemark'),ids:[...candidateIds]}; }
  function draftForm(s) {
    billEditing=null;
    editing=s?s.id:null; active=s; candidateIds=new Set(s?s.lines.map(l=>l.id):[]);
    const data=s||{company:'北京凯撒',supplier:session.supplier,agreement:'AGR-GL-BJ-012',currency:'CNY',start:'2026-09-01',end:'2026-09-30',remark:''};
    body.innerHTML='<div class="rec-error" role="alert" hidden></div>'+section('对账范围')+'<div class="rec-form-grid">'+
      '<label>采购公司<select id="recDraftCompany" class="form-control">'+options(session.companies,data.company)+'</select></label>'+
      '<label>供应商<select id="recDraftSupplier" class="form-control">'+options(vendors,data.supplier)+'</select></label>'+
      '<label class="rec-full">合作协议<select id="recAgreement" class="form-control">'+agreements.options(data.supplier,data.company,data.agreement)+'</select></label>'+
      '<label>币种<select id="recCurrency" class="form-control">'+options(['CNY','EUR','JPY'],data.currency)+'</select></label>'+
      '<label>团期 / 订单<input id="recCandidateKeyword" class="form-control" type="search" placeholder="查找当前范围的明细"></label>'+
      '<label>期间开始<input id="recDraftStart" class="form-control" type="date" value="'+data.start+'"></label><label>期间结束<input id="recDraftEnd" class="form-control" type="date" value="'+data.end+'"></label></div>'+
      section('订单费用明细')+'<div class="rec-candidates"></div><div id="recSelectionTotal" class="rec-selection-total"></div><label class="rec-field">对账备注<textarea id="recRemark" class="form-control" rows="2">'+esc(data.remark)+'</textarea></label>';
    footer.innerHTML=button('close','取消')+(s?button('void','作废'):'')+button('save','保存草稿')+button('submit','提交对账',true);
    renderCandidates(); open(s?'编辑对账':'新建对账');
  }
  function renderCandidates() {
    const d=draftData(), q=body.querySelector('#recCandidateKeyword').value.trim().toLowerCase();
    const scope=session.sources().filter(l=>l.company===d.company&&l.supplier===d.supplier&&l.agreement===d.agreement&&l.currency===d.currency&&l.date>=d.start&&l.date<=d.end);
    candidateIds=new Set([...candidateIds].filter(id=>scope.some(l=>l.id===id)));
    const lines=scope.filter(l=>!q||[l.order,l.tour,l.name].join(' ').toLowerCase().includes(q));
    body.querySelector('.rec-candidates').innerHTML='<div class="rec-candidate-list">'+lines.map(l=>{
      const unavailable=session.availability(l.id,editing);
      return '<label class="rec-candidate'+(unavailable?' rec-unavailable':'')+'"><input type="checkbox" data-rec-select="'+l.id+'"'+(candidateIds.has(l.id)?' checked':'')+(unavailable?' disabled':'')+'><div class="rec-candidate-content"><div class="rec-candidate-heading"><strong>'+esc(l.name)+'</strong><strong class="rec-amount">'+money(l.amount,l.currency)+'</strong></div><span class="rec-line">'+l.order+' · '+l.tour+'</span><span class="rec-muted rec-line">服务日期 '+l.date+' · '+l.qty+' × '+money(l.price,l.currency)+' · 增减 '+money(l.adjustment,l.currency)+'</span><span class="rec-muted rec-line">'+esc(l.confirmation+'；'+l.basis)+'</span>'+(unavailable?'<span class="rec-warning rec-line">'+esc(unavailable)+'</span>':'')+'</div></label>';
    }).join('')+(lines.length?'':'<p class="rec-empty">当前范围无订单费用明细</p>')+'</div>';
    updateTotal();
  }
  function updateTotal() { const d=draftData(); const selected=session.sources().filter(l=>candidateIds.has(l.id)); body.querySelector('#recSelectionTotal').innerHTML='<span class="rec-line">已选 '+selected.length+' 条费用 · 合计 '+money(M.sum(selected),d.currency)+'</span><span class="rec-muted rec-line">已冲抵预付款 '+money(selected.reduce((n,l)=>n+l.payment.offset,0),d.currency)+' · 尾款实际已付 '+money(selected.reduce((n,l)=>n+l.payment.paid,0),d.currency)+'</span>'; }
  function billData() {
    const v=id=>body.querySelector('#'+id).value;
    return {company:v('recBillCompany'),supplier:session.supplier,agreement:v('recBillAgreement'),currency:v('recBillCurrency'),start:v('recBillStart'),end:v('recBillEnd'),no:v('recBillNo'),date:v('recBillDate'),total:v('recBillTotal'),files:billFiles,lines:[...candidateIds].map(id=>({id,...billValues.get(id)})),expectedRevision:billMatch?.revision??null};
  }
  function billForm(record) {
    editing=null;active=record||null;billEditing=record?.id||null;candidateIds=new Set(record?record.lines.map(l=>l.id):[]);
    const previous=record?.bills?.at(-1);
    billValues=new Map((record?.lines||[]).map(l=>[l.id,{amount:String(l.claim),reason:l.claimReason||''}]));billFiles=previous?previous.files.map(f=>({...f})):[];billMatch=null;
    const d=record||{company:'北京凯撒',agreement:'AGR-GL-BJ-012',currency:'CNY',start:'2026-09-01',end:'2026-09-30'};
    const agreementsForCompany=company=>[...new Set(session.sources().filter(l=>l.company===company).map(l=>l.agreement))];
    const locked=record?' disabled':'';
    body.innerHTML='<div class="rec-error" role="alert" hidden></div>'+(record?summary(record)+'<div class="rec-return-note">补充要求：'+esc(record.returnReason)+'</div>':'')+section('账单范围')+'<div class="rec-form-grid">'+
      '<label>采购公司<select id="recBillCompany" class="form-control"'+locked+'>'+options(session.companies,d.company)+'</select></label>'+
      '<label>币种<select id="recBillCurrency" class="form-control"'+locked+'>'+options(['CNY','EUR','JPY'],d.currency)+'</select></label>'+
      '<label class="rec-full">原采购协议<select id="recBillAgreement" class="form-control"'+locked+'>'+options(agreementsForCompany(d.company),d.agreement)+'</select></label>'+
      '<label>期间开始<input id="recBillStart" class="form-control" type="date" value="'+d.start+'"'+locked+'></label><label>期间结束<input id="recBillEnd" class="form-control" type="date" value="'+d.end+'"'+locked+'></label></div>'+
      section('账单资料')+'<div class="rec-form-grid"><label>供应商账单号<input id="recBillNo" class="form-control" maxlength="64" value="'+esc(previous?.no||'')+'"></label><label>账单日期<input id="recBillDate" class="form-control" type="date" value="'+esc(previous?.date||'2026-09-26')+'"></label><label><span id="recBillTotalLabel">账单总额（'+esc(d.currency)+'）</span><input id="recBillTotal" class="form-control" type="number" min="0" step="0.01" value="'+esc(previous?.total??'')+'"></label><label>账单附件<input id="recBillFiles" class="form-control" type="file" multiple accept=".pdf,.xls,.xlsx,.csv,.jpg,.jpeg,.png"><span id="recBillFileNames" class="rec-muted">'+esc(billFiles.map(f=>f.name).join('、')||'尚未选择附件')+'</span></label></div>'+
      section('采购订单费用')+'<label class="rec-field">订单 / 团期<input id="recBillKeyword" class="form-control" type="search" placeholder="查询已向本供应商采购的订单"></label><div class="rec-bill-candidates"></div><div id="recBillMatch" class="rec-bill-match" role="status"></div>';
    footer.innerHTML=button('close','取消')+button('submit-bill',record?'重新提交账单':'提交账单',true);
    renderBillCandidates();open(record?'补充供应商账单':'提交供应商账单');
  }
  function renderBillCandidates() {
    const d=billData(),q=body.querySelector('#recBillKeyword').value.trim().toLowerCase();
    const scope=session.sources().filter(l=>l.company===d.company&&l.agreement===d.agreement&&l.currency===d.currency&&l.date>=d.start&&l.date<=d.end&&(!billEditing||active.lines.some(a=>a.id===l.id)));
    candidateIds=new Set([...candidateIds].filter(id=>scope.some(l=>l.id===id)));
    const rows=scope.filter(l=>!q||[l.order,l.tour,l.name].join(' ').toLowerCase().includes(q));
    body.querySelector('.rec-bill-candidates').innerHTML=rows.map(l=>{
      const available=session.billAvailability(l.id,billEditing),selected=candidateIds.has(l.id),value=billValues.get(l.id)||{amount:String(l.amount),reason:''};
      if(!billValues.has(l.id))billValues.set(l.id,value);
      return '<div class="rec-bill-candidate'+(available.blocked?' rec-unavailable':'')+'"><label class="rec-bill-select"><input type="checkbox" data-rec-bill-select="'+l.id+'"'+(selected?' checked':'')+(available.blocked||billEditing?' disabled':'')+'><span><strong class="rec-line">'+esc(l.name)+'</strong><span class="rec-muted rec-line">'+l.order+' · '+l.tour+'</span></span></label><div class="rec-basis">采购明细 '+money(l.amount,l.currency)+' · 服务日期 '+l.date+' · '+esc(available.blocked|| (available.statement?'关联 '+available.statement:'尚无对账单'))+'</div>'+
        (!available.blocked?'<div class="rec-form-grid rec-bill-inputs"'+(selected?'':' hidden')+'><label>账单金额（'+l.currency+'）<input class="form-control" type="number" min="0" step="0.01" data-rec-bill-amount="'+l.id+'" value="'+esc(value.amount)+'"></label><label>增减依据<input class="form-control" data-rec-bill-reason="'+l.id+'" value="'+esc(value.reason)+'" placeholder="与采购金额不同时填写"></label></div>':'')+'</div>';
    }).join('')+(rows.length?'':'<div class="rec-empty">当前范围无采购订单费用</div>');
    updateBillMatch();
  }
  function updateBillMatch() {
    const d=billData();const box=body.querySelector('#recBillMatch');let matchText='尚未选择采购明细';billMatch=null;
    try {if(d.lines.length){billMatch=session.matchBill(d,billEditing);matchText=billMatch.existing?'匹配原对账单 '+(billMatch.id||'（采购公司整理中）'):'本次提交建立对账单';}}catch(e){matchText=e.message;}
    let total='金额待补齐';try{total=money(d.lines.reduce((n,l)=>n+M.cents(l.amount),0)/100,d.currency);}catch(e){/* 保留空金额供填写，不转成零 */}
    box.innerHTML='<span class="rec-line">已选 '+d.lines.length+' 条费用 · 明细合计 '+total+'</span><span class="rec-line">'+esc(matchText)+'</span><span class="rec-muted rec-line">接收人：'+esc(d.company)+' · 计调</span>';
  }
  function billsSection(s) {
    if(!s.bills?.length)return '';
    return '<section class="rec-section">'+section('供应商账单')+s.bills.map((b,i)=>'<details class="rec-history"'+(i===s.bills.length-1?' open':'')+'><summary>'+esc(b.no)+' · 第'+b.version+'次提交 · '+money(b.total,s.currency)+'</summary><div class="rec-basis">账单日期 '+esc(b.date)+' · 提交时间 '+esc(b.submittedAt)+'</div><div class="rec-basis">附件：'+b.files.map(f=>esc(f.name)).join('、')+'</div>'+b.lines.map(l=>'<div class="rec-basis">'+esc(s.lines.find(x=>x.id===l.id)?.order||l.id)+' · '+money(l.amount,s.currency)+(l.reason?' · '+esc(l.reason):'')+'</div>').join('')+'</details>').join('')+(s.returnReason?'<div class="rec-return-note">补充要求：'+esc(s.returnReason)+'</div>':'')+'</section>';
  }
  function reviewingForm(s) {
    editing=null;billEditing=null;active=s;
    body.innerHTML='<div class="rec-error" role="alert" hidden></div>'+summary(s)+billsSection(s)+section('逐项核对')+s.lines.map(l=>lineEvidence(l,s.currency,['reviewing','returned'].includes(s.state))+'<dl class="rec-difference"><div><dt>供应商账单金额</dt><dd>'+money(l.claim,s.currency)+'</dd></div><div><dt>与'+(l.actualBasis?'实际服务':'原对账')+'差额</dt><dd>'+money((M.cents(l.claim)-M.cents(l.actualBasis?.amount??l.amount))/100,s.currency)+'</dd></div></dl><div class="rec-basis">供应商依据：'+esc(l.claimReason||'采购明细金额一致')+'</div>'+(!l.ready?'<div class="rec-return-note">实际服务依据待计调确认</div>':'')+'<div class="rec-form-grid rec-line-response" data-rec-bill-review="'+l.id+'"><label>本次认可金额（'+s.currency+'）<input class="form-control" type="number" min="0" step="0.01" data-rec-review-amount value="'+(l.decision?l.decision.amount:'')+'"></label><label class="rec-full">认可或调整依据<textarea class="form-control" rows="2" data-rec-review-reason>'+esc(l.decision?.reason||'')+'</textarea></label></div></div>').join('')+
      '<div id="recBillReviewOutcome" class="rec-bill-match" role="status">待逐项核对</div>'+section('退回补充')+'<label class="rec-field">需供应商补充的材料或明细<textarea id="recReturnReason" class="form-control" rows="2"></textarea></label>'+history(s);
    footer.innerHTML=button('close','关闭')+button('return-bill','退回补充')+button('save-bill-review','保存核对')+button('finish-bill-review','提交核对结果',true);
    updateReviewOutcome();open('核对供应商账单');
  }
  function billDecisions() { return [...body.querySelectorAll('[data-rec-bill-review]')].map(el=>({id:el.dataset.recBillReview,amount:el.querySelector('[data-rec-review-amount]').value,reason:el.querySelector('[data-rec-review-reason]').value})); }
  function updateReviewOutcome() {
    const d=billDecisions();let text='待逐项核对';
    try {if(d.length&&d.every(l=>l.amount!=='')){const agreed=d.every(l=>M.cents(l.amount)===M.cents(active.lines.find(a=>a.id===l.id).claim));text=agreed?'本次认可金额与供应商账单一致 → 双方确认后交财务应付岗':'本次调整账单金额 → 交供应商对账人员再次确认';}}catch(e){text='认可金额待核对';}
    body.querySelector('#recBillReviewOutcome').textContent=text;
  }
  function lineEvidence(l,currency,asBasis) { return '<div class="rec-line-card"><div class="rec-line-heading"><strong>'+esc(l.name)+'</strong><strong class="rec-amount">'+(asBasis?'采购／原对账 ':'')+money(l.amount,currency)+'</strong></div><div class="rec-muted rec-line">'+l.order+' · '+l.tour+'</div><dl class="rec-line-facts"><div><dt>实际服务</dt><dd>'+l.qty+' 人 · '+l.date+'</dd></div><div><dt>采购单价</dt><dd>'+money(l.price,currency)+'</dd></div><div><dt>原增减费用</dt><dd>'+money(l.adjustment,currency)+'</dd></div></dl><div class="rec-basis">'+esc(l.confirmation+'；'+l.basis)+'</div><div class="rec-basis">已冲抵预付款 '+money(l.payment.offset,currency)+' · 尾款实际已付 '+money(l.payment.paid,currency)+' · '+esc(l.payment.reference)+'</div>'+(l.actualBasis?'<div class="rec-return-note">计调补充实际服务：'+money(l.actualBasis.amount,currency)+'；'+l.actualBasis.qty+' 人；'+esc(l.actualBasis.date+'；'+l.actualBasis.basis)+'（原对账记录保留）</div>':'')+(l.resolution?'<div class="rec-basis">上次处理：'+esc(l.resolution)+'</div>':''); }
  function history(s) { return '<section class="rec-section">'+section('版本与处理记录')+s.history.map(h=>'<details class="rec-history"><summary>第 '+h.revision+' 版 · '+esc(h.action)+' · '+money(M.sum(h.lines),s.currency)+'<span class="rec-muted">'+esc(h.actor+' / '+h.time)+'</span></summary>'+h.lines.map(l=>'<div class="rec-history-line"><strong>'+esc(l.order+' / '+l.name)+'</strong><span>对账金额 '+money(l.amount,s.currency)+(l.claim!==undefined?' · 供应商主张 '+money(l.claim,s.currency):'')+'</span>'+(l.claimReason?'<span>'+esc(l.claimReason)+'</span>':'')+(l.decision?'<span>我方认可 '+money(l.decision.amount,s.currency)+' · '+esc(l.decision.reason)+'</span>':'')+'</div>').join('')+'</details>').join('')+'<ol class="rec-events">'+s.events.map(e=>'<li><span>'+esc(e.action)+'</span><span class="rec-muted">'+esc(e.actor+' · '+e.time)+'</span></li>').join('')+'</ol></section>'; }
  function detail(s) {
    if(merchant&&s.state==='reviewing'){reviewingForm(s);return;}
    if(!merchant&&s.state==='returned'){billForm(s);return;}
    billEditing=null;editing=null; active=s;
    const responding=!merchant&&s.state==='pending', resolving=merchant&&s.state==='disputed';
    body.innerHTML='<div class="rec-error" role="alert" hidden></div>'+summary(s)+'<div class="rec-agreement">合作协议 '+esc(s.agreement)+'</div>'+section('订单费用核对')+
      s.lines.map(l=>lineEvidence(l,s.currency,['reviewing','returned'].includes(s.state))+(l.claim!==undefined?'<dl class="rec-difference"><div><dt>供应商主张</dt><dd>'+money(l.claim,s.currency)+'</dd></div><div><dt>与'+(l.actualBasis?'实际服务':'原对账')+'差额</dt><dd>'+money((M.cents(l.claim)-M.cents(l.actualBasis?.amount??l.amount))/100,s.currency)+'</dd></div></dl><div class="rec-basis">异议依据：'+esc(l.claimReason)+'</div>':'')+
        (responding?'<div class="rec-form-grid rec-line-response" data-rec-answer="'+l.id+'"><label>核对结果<select class="form-control" data-rec-result><option value="">请选择</option><option value="agree">一致</option><option value="dispute">有异议</option></select></label><label data-rec-claim-field hidden>我方主张金额（'+s.currency+'）<input class="form-control" type="number" min="0" step="0.01" data-rec-claim></label><label class="rec-full" data-rec-claim-field hidden>异议原因及依据<textarea class="form-control" rows="2" data-rec-reason></textarea></label></div>':'')+
        (resolving&&l.claim!==undefined?'<div class="rec-form-grid rec-line-response" data-rec-decision="'+l.id+'"><label>本次认可金额（'+s.currency+'）<input class="form-control" type="number" min="0" step="0.01" data-rec-accepted value="'+(l.decision?l.decision.amount:'')+'"></label><label class="rec-full">处理依据<textarea class="form-control" rows="2" data-rec-basis placeholder="填写双方协商结果、费用增减依据">'+esc(l.decision?l.decision.reason:'')+'</textarea></label></div>':'')+'</div>').join('')+
      (s.remark?'<div class="rec-basis">对账备注：'+esc(s.remark)+'</div>':'')+
      billsSection(s)+(s.state==='confirmed'?(adjustments?adjustments.list(s):'')+confirmed(s):'')+history(s);
    footer.innerHTML=button('close','关闭')+(responding?button('respond','提交核对',true):resolving?button('save-resolution','保存处理')+button('resubmit','重新提交',true):'');
    open(responding?'核对对账单':resolving?'处理对账差异':'对账详情');
  }
  function confirmed(s) {
    const p=s.payment;
    return '<section class="rec-section">'+section('款项与票据')+(p?'<dl class="rec-facts"><div><dt>已冲抵预付款</dt><dd>'+money(p.offset,s.currency)+'</dd></div><div><dt>尾款实际已付</dt><dd>'+money(p.paid,s.currency)+'</dd></div><div><dt>剩余未付</dt><dd>'+money((M.cents(M.sum(s.lines))-M.cents(p.offset)-M.cents(p.paid))/100,s.currency)+'</dd></div></dl><div class="rec-basis">'+esc(p.reference)+' · 在途付款 '+money(p.inTransit,s.currency)+'；尚可申请 '+money((M.cents(M.sum(s.lines))-M.cents(p.offset)-M.cents(p.paid)-M.cents(p.inTransit))/100,s.currency)+'</div>':'<div class="rec-basis">财务承接：待核对应付与预付冲抵</div>')+
      (merchant?'<div class="rec-related"><a href="../finance/finance-supplier-bills.html?statementNo='+s.id+'&amp;revision='+s.revision+'">供应商账单</a><a data-rec-payment="'+s.id+'" data-rec-version="'+s.revision+'" href="fulfillment-cost.html?view=payment&amp;statementNo='+s.id+'&amp;revision='+s.revision+'">付款申请</a>'+[['finance-payable.html','应付管理'],['finance-prepayment-offset.html','预付冲抵'],['finance-payment-apply.html','付款复核'],['finance-payment.html','付款记录'],['finance-invoice.html','票据核验'],['finance-payment-return.html','付款退回']].map(([file,label])=>'<a href="../finance/'+file+'?statementNo='+s.id+'&amp;revision='+s.revision+'">'+label+'</a>').join('')+'</div>':invoiceSection(s)+refundSection(s))+'</section>';
  }
  function invoiceSection(s){
    const i=s.invoice,editable=!i||i.status==='待补正';
    let html=section('发票材料');
    if(i)html+='<dl class="rec-facts"><div><dt>收票任务 / 材料版本</dt><dd>'+esc(i.task)+' · 第 '+i.version+' 版</dd></div><div><dt>发票号码 / 金额</dt><dd>'+esc(i.no)+' · '+money(i.amount,s.currency)+'</dd></div><div><dt>核验结果</dt><dd>'+esc(i.status)+'</dd></div></dl><p class="rec-basis">'+esc(i.file)+'</p><p class="rec-handler">当前办理：'+(i.status==='待补正'?'供应商票据人员':s.company+'发票岗')+'</p>';
    if(i?.status==='待补正')html+='<p class="rec-return-note">退回原因：'+esc(i.reason)+'</p>';
    if(editable)html+='<details class="rec-invoice"><summary>'+(i?'补正发票材料':'提交发票材料')+'</summary><div class="rec-form-grid"><label>发票号码<input id="recInvoiceNo" class="form-control" maxlength="30" value="'+esc(i?.no||'')+'"></label><label>发票金额（'+s.currency+'）<input id="recInvoiceAmount" class="form-control" type="number" min="0.01" step="0.01" value="'+(i?.amount||M.sum(s.lines))+'"></label>'+(i?'<label>票面购方<input class="form-control" id="recInvoiceBuyer" value="'+esc(i.buyer)+'"></label><label>票面销方<input class="form-control" id="recInvoiceSeller" value="'+esc(i.seller)+'"></label><label>票面币种<input class="form-control" id="recInvoiceCurrency" value="'+esc(i.currency)+'"></label><label>补正说明<textarea class="form-control" id="recInvoiceReason" maxlength="1000"></textarea></label>':'')+'<label class="rec-full">本次发票材料<input id="recInvoiceFile" class="form-control" type="file" accept=".pdf,.jpg,.jpeg,.png"></label></div><div class="rec-invoice-actions">'+button('invoice',i?'补正重提':'提交材料')+'</div></details>';
    if(s.invoiceHistory?.length)html+='<details class="rec-invoice-history"><summary>票据处理记录（'+s.invoiceHistory.length+'）</summary>'+s.invoiceHistory.map(h=>'<div class="rec-history">'+esc(h.action)+' · 第 '+h.version+' 版 · '+esc(h.no)+' · '+money(h.amount,s.currency)+'<p class="rec-basis">'+esc(h.reason)+' · '+esc(h.file)+' · '+esc(h.actor)+' · '+esc(h.time)+'</p></div>').join('')+'</details>';
    return html;
  }
  function refundSection(s){
    const f=s.refund;if(!f)return '';let html=section('预付退回')+'<dl class="rec-facts"><div><dt>退回单</dt><dd>'+f.id+'</dd></div><div><dt>办理状态</dt><dd>'+f.status+'</dd></div><div><dt>应退 / 已核对到账</dt><dd>'+money(f.amount,s.currency)+' / '+money(f.received,s.currency)+'</dd></div></dl><p class="rec-basis">'+f.payment+' · '+f.prepay+' · '+esc(f.basis)+'</p>';
    if(f.status==='待供应商退款')html+='<details class="rec-refund"><summary>提交退款凭据</summary><div class="rec-form-grid"><label>本次退款金额<input class="form-control" id="recRefundAmount" type="number" value="'+f.amount+'" step="0.01"></label><label>退款交易号<input class="form-control" id="recRefundRef" maxlength="60"></label><label>退款日期<input class="form-control" id="recRefundDate" type="date" value="2026-09-26"></label><label>退款凭据<input class="form-control" id="recRefundFile" type="file" accept=".pdf,.jpg,.jpeg,.png"></label><label class="rec-full">退款说明<textarea class="form-control" id="recRefundBasis" maxlength="1000"></textarea></label></div><div class="rec-invoice-actions">'+button('refund-proof','提交凭据')+'</div></details>';
    else html+='<p class="rec-handler">当前办理：'+s.company+'资金岗核对到账</p>';
    return html+f.submissions.map(x=>'<div class="rec-history">退款凭据 '+esc(x.reference)+' · '+money(x.amount,s.currency)+' · '+esc(x.date)+'<p class="rec-basis">'+esc(x.file)+' · '+esc(x.basis)+'</p></div>').join('');
  }
  function success(s,message) { listRender(); detail(s); toast(message+'（当前页面演示）'); }
  root.addEventListener('click',event=>{
    if(adjustments?.handle(event))return;
    const payLink=event.target.closest('[data-rec-payment]');
    if(payLink&&merchant&&window.SupplierPaymentRequestUI){event.preventDefault();close(true);const id=payLink.dataset.recPayment;window.SupplierPaymentRequestUI.enter(key=>session.get(key),id,payLink.dataset.recVersion,()=>detail(session.get(id)));return;}
    const opener=event.target.closest('[data-rec-open]');
    if(opener) { const s=session.get(opener.dataset.recOpen); if(merchant&&s.state==='draft')draftForm(s);else detail(s);return; }
    const action=event.target.closest('[data-rec-action]')?.dataset.recAction;
    if(!action) { if(event.target===overlay)close(); return; }
    try {
      if(action==='purchases')window.SupplierPurchaseUI.open(session,listRender);
      if(action==='close')close();
      if(action==='create')draftForm();
      if(action==='create-bill')billForm();
      if(action==='submit-bill') {const s=session.submitBill(billData(),billEditing);success(s,'账单已提交给'+s.company+'计调，待采购公司核对');}
      if(action==='save-bill-review'||action==='finish-bill-review'){const result=session.reviewBill(active.id,active.revision,billDecisions(),action==='finish-bill-review');success(result,result.state==='confirmed'?'已按供应商原账单完成双方确认':result.state==='pending'?'调整后金额已提交，待供应商确认':'已保存核对，仍待我方核对');}
      if(action==='return-bill'){const result=session.returnBill(active.id,active.revision,body.querySelector('#recReturnReason').value);success(result,'已退回供应商补充材料');}
      if(action==='search') { const v=id=>root.querySelector('#'+id).value.trim(); if(v('recStart')&&v('recEnd')&&v('recStart')>v('recEnd'))return toast('期间开始不能晚于结束'); filters={keyword:v('recKeyword'),company:v('recCompany'),supplier:merchant?v('recSupplier'):'',state:v('recStatus'),start:v('recStart'),end:v('recEnd')};listRender(); }
      if(action==='reset') { filters={keyword:'',company:'',supplier:'',state:'',start:'',end:''};listRender(); }
      if(action==='save'||action==='submit') { const s=session.saveDraft(draftData(),editing,action==='submit');dirty=false;listRender();close(true);toast((action==='submit'?'已提交对账，待供应商确认':'已保存对账草稿')+'（当前页面演示）'); }
      if(action==='void')confirm('确认作废这张草稿？作废后释放已选费用明细，保留本单记录。',()=>{session.voidDraft(editing);dirty=false;close(true);listRender();toast('草稿已作废');});
      if(action==='respond') { const answers=[...body.querySelectorAll('[data-rec-answer]')].map(el=>({id:el.dataset.recAnswer,result:el.querySelector('[data-rec-result]').value,amount:el.querySelector('[data-rec-claim]').value,reason:el.querySelector('[data-rec-reason]').value})); const s=session.respond(active.id,active.revision,answers);success(s,s.state==='confirmed'?'本版对账已确认':'已提交差异，待采购公司处理'); }
      if(action==='save-resolution'||action==='resubmit') { const decisions=[...body.querySelectorAll('[data-rec-decision]')].map(el=>({id:el.dataset.recDecision,amount:el.querySelector('[data-rec-accepted]').value,reason:el.querySelector('[data-rec-basis]').value})); const s=session.resolve(active.id,active.revision,decisions,action==='resubmit');success(s,action==='resubmit'?'新版本已提交，待供应商重新确认':'已保存处理，对账仍在差异处理中'); }
      if(action==='refund-proof'){const val=id=>body.querySelector('#recRefund'+id).value,file=body.querySelector('#recRefundFile').files[0];if(file&&(!/\.(pdf|jpe?g|png)$/i.test(file.name)||file.size>10*1024*1024))throw Error('请选择不超过10MB的PDF或图片材料');const s=session.refundProof(active.id,active.revision,{amount:val('Amount'),reference:val('Ref'),date:val('Date'),file:file?.name,basis:val('Basis')});success(s,'退款凭据已提交，待采购公司核对实际到账');}
      if(action==='invoice') { const file=body.querySelector('#recInvoiceFile').files[0]; if(file&&(!/\.(pdf|jpe?g|png)$/i.test(file.name)||file.size>10*1024*1024))throw Error('请选择不超过10MB的PDF或图片材料');const s=session.invoice(active.id,active.revision,{no:body.querySelector('#recInvoiceNo').value,amount:body.querySelector('#recInvoiceAmount').value,file:file?.name,version:active.invoice?.version,reason:body.querySelector('#recInvoiceReason')?.value,buyer:body.querySelector('#recInvoiceBuyer')?.value,seller:body.querySelector('#recInvoiceSeller')?.value,currency:body.querySelector('#recInvoiceCurrency')?.value});success(s,'发票材料已登记，待财务核验'); }
      if(action==='cancel-confirm') {confirmOverlay.hidden=true;confirmOverlay.classList.remove('show');confirmCallback=null;overlay.querySelector('[role="dialog"]').focus();}
      if(action==='accept-confirm') {confirmOverlay.hidden=true;confirmOverlay.classList.remove('show');const callback=confirmCallback;confirmCallback=null;callback?.();}
    } catch(e) { if(!overlay.hidden)error(e.message);else toast(e.message); }
  });
  body.addEventListener('input',event=>{
    dirty=true;const t=event.target;
    if(t.id==='recCandidateKeyword')renderCandidates();
    if(t.id==='recBillKeyword')renderBillCandidates();
    if(t.matches('[data-rec-bill-amount],[data-rec-bill-reason]')){const id=t.dataset.recBillAmount||t.dataset.recBillReason;const value=billValues.get(id);value[t.hasAttribute('data-rec-bill-amount')?'amount':'reason']=t.value;updateBillMatch();}
    if(t.matches('[data-rec-review-amount]'))updateReviewOutcome();
  });
  body.addEventListener('change',event=>{
    dirty=true;const target=event.target;
    if(target.matches('[data-rec-bill-select]')){if(target.checked)candidateIds.add(target.dataset.recBillSelect);else candidateIds.delete(target.dataset.recBillSelect);renderBillCandidates();}
    if(target.id==='recBillCompany'){const company=target.value;body.querySelector('#recBillAgreement').innerHTML=options([...new Set(session.sources().filter(l=>l.company===company).map(l=>l.agreement))]);candidateIds.clear();renderBillCandidates();}
    if(['recBillAgreement','recBillCurrency','recBillStart','recBillEnd'].includes(target.id)){if(target.id==='recBillCurrency')body.querySelector('#recBillTotalLabel').textContent='账单总额（'+target.value+'）';renderBillCandidates();}
    if(target.id==='recBillFiles'){billFiles=[...target.files].map(f=>({name:f.name,size:f.size}));body.querySelector('#recBillFileNames').textContent=billFiles.map(f=>f.name).join('、')||'尚未选择附件';}

    if(target.matches('[data-rec-select]')) {if(target.checked)candidateIds.add(target.dataset.recSelect);else candidateIds.delete(target.dataset.recSelect);updateTotal();}
    if(['recDraftCompany','recDraftSupplier'].includes(target.id)) { const company=body.querySelector('#recDraftCompany').value,vendor=body.querySelector('#recDraftSupplier').value;body.querySelector('#recAgreement').innerHTML=agreements.options(vendor,company,'');candidateIds.clear();renderCandidates(); }
    if(['recAgreement','recCurrency','recDraftStart','recDraftEnd'].includes(target.id))renderCandidates();
    if(target.matches('[data-rec-result]'))target.closest('[data-rec-answer]').querySelectorAll('[data-rec-claim-field]').forEach(el=>el.hidden=target.value!=='dispute');
  });
  root.addEventListener('keydown',event=>{
    if(event.key==='Enter'&&event.target.id==='recKeyword')root.querySelector('[data-rec-action="search"]').click();
    const layer=!confirmOverlay.hidden?confirmOverlay:!overlay.hidden?overlay:null;
    if(!layer)return;
    if(event.key==='Escape') {event.preventDefault();event.stopPropagation();if(layer===confirmOverlay)root.querySelector('[data-rec-action="cancel-confirm"]').click();else close();}
    if(event.key==='Tab') {const focusable=[...layer.querySelectorAll('button,input,select,textarea,a,summary')].filter(el=>!el.disabled&&el.getClientRects().length);const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
  });
  listRender();
  const refParams=new URLSearchParams(location.search),refId=refParams.get('statementNo');
  if(refId&&refParams.get('view')!=='payment'&&!['payment','records'].includes(refParams.get('tab'))){
    try {const record=session.get(refId);if(refParams.get('revision')&&Number(refParams.get('revision'))!==record.revision)throw Error('对账版本已变化，请核对当前版本');detail(record);}catch(err){toast(err.message);}
  }
  if(merchant&&window.SupplierPaymentRequestUI)window.SupplierPaymentRequestUI.fromParams(id=>session.get(id),()=>{const id=new URLSearchParams(location.search).get('statementNo');try{detail(session.get(id));}catch(e){toast(e.message);}});
})();
