(function () {
  'use strict';
  var section = document.getElementById('orderVisaSection');
  var travelerRows = document.getElementById('travelerTableRows');
  if (!section || !travelerRows) return;

  function esc(value) { return String(value == null ? '' : value).replace(/[&<>'\"]/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c];}); }
  function openLayer(layer){if(window.caesarUI&&window.caesarUI.openLayer)window.caesarUI.openLayer(layer);else{layer.hidden=false;layer.classList.add('show');}}
  function closeLayer(layer){if(window.caesarUI&&window.caesarUI.closeLayer)window.caesarUI.closeLayer(layer);else{layer.classList.remove('show');layer.hidden=true;}}
  function getProfile(productName){
    if(/专列|境内|国内/.test(productName))return null;
    if(/日本签证/.test(productName))return{country:'日本',type:'个人旅游签证',version:'材料版本v4',deadline:'2026-07-10',days:'出发前15天',allowed:['随团代办'],required:true};
    if(/新加坡/.test(productName))return{country:'新加坡',type:'旅游电子签',version:'材料版本v3',deadline:'2025-08-02',days:'出发前10天',allowed:['游客自办','随团代办'],required:true};
    return{country:'法国',type:'申根旅游签证',version:'材料版本v6',deadline:'2026-06-24',days:'出发前21天',allowed:['游客自办','随团代办'],required:true};
  }
  function modeTag(status){var className=status==='无需签证'?'tag tag-gray':status==='游客自办'?'tag tag-blue':status==='随团代办'?'tag tag-purple':'tag tag-orange';return '<span class="'+className+'">'+esc(status)+'</span>';}

  var productName=document.getElementById('orderProductName').textContent.trim();
  var orderNo=document.getElementById('orderNo').textContent.trim();
  var productTags=document.getElementById('orderHeroTags').textContent;
  if(/单团项目/.test(productTags))return;
  var profile=getProfile(productName);if(!profile)return;
  var names=Array.from(travelerRows.querySelectorAll('tr')).map(function(row){var cell=row.querySelector('td');return cell?cell.textContent.trim():'';}).filter(Boolean);if(!names.length)return;

  var storageKey='caesar-order-visa-modes-'+orderNo;
  var stored={};try{stored=JSON.parse(sessionStorage.getItem(storageKey)||'{}');}catch(e){}
  var records=names.map(function(name,index){
    var saved=stored.records&&stored.records[name];
    if(saved)return saved;
    var mode=index===0&&profile.allowed.indexOf('游客自办')>=0?'游客自办':profile.allowed.indexOf('随团代办')>=0?'随团代办':'未选择';
    return{name:name,mode:mode,previous:'',reason:'',status:mode==='随团代办'?'材料收集中':mode==='游客自办'?'证件待核验':'待选择',material:mode==='随团代办'?(index%2?'10/12项':'8/12项'):'不适用',sent:false,fee:mode==='随团代办'?800:0};
  });
  var history=stored.history||[];
  var currentIndex=-1;

  section.hidden=false;
  document.getElementById('orderVisaContext').textContent=profile.country+' / '+profile.type+' / '+profile.version+' / 产品允许：'+profile.allowed.join('、');
  document.getElementById('orderVisaWorkbenchLink').href='../tour/visa-processing.html?orderNo='+encodeURIComponent(orderNo);
  section.querySelector('thead tr').innerHTML='<th>游客</th><th>办理方式</th><th>常住地/领区</th><th>签证方案</th><th>材料进度</th><th>最晚提交日</th><th>办理状态</th><th>操作</th>';
  section.insertAdjacentHTML('beforeend','<div id="orderVisaHistoryBlock" class="order-visa-history"><div class="detail-section-title">办理方式变更记录</div><div class="table-wrap order-detail-table"><table><thead><tr><th>游客</th><th>原方式</th><th>新方式</th><th>原因</th><th>代办任务处理</th><th>费用影响</th><th>时间</th></tr></thead><tbody id="orderVisaHistoryRows"></tbody></table></div></div>');

  document.body.insertAdjacentHTML('beforeend',[
    '<div id="visaModeChangeDrawer" class="modal-overlay drawer-overlay" aria-hidden="true" hidden><section class="modal drawer-modal drawer-md order-detail-drawer" role="dialog" aria-modal="true" aria-labelledby="visaModeChangeTitle"><div class="modal-header"><div id="visaModeChangeTitle" class="modal-title">变更签证办理方式</div><button class="modal-close" type="button" data-close-visa-mode>×</button></div><div class="modal-body"><section id="visaModeChangeSummary" class="readonly-summary"></section><div class="form-grid">',
    '<label class="form-group"><span class="form-label">原办理方式</span><input id="visaModeOriginal" class="form-control" readonly></label><label class="form-group"><span class="form-label">变更为</span><select id="visaModeNext" class="form-control"></select></label>',
    '<label class="form-group form-group-full"><span class="form-label">变更原因 <i class="req">*</i></span><textarea id="visaModeReason" class="form-control" rows="3" placeholder="填写客户选择、材料情况或业务处理原因"></textarea></label>',
    '<label id="visaTaskHandlingField" class="form-group form-group-full" hidden><span class="form-label">原代办任务处理 <i class="req">*</i></span><select id="visaTaskHandling" class="form-control"><option value="">请选择</option><option>结束未开始任务并保留记录</option><option>申请撤回送签并保留原送签记录</option><option>保持任务待签证专员处理</option></select></label>',
    '</div><section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">费用处理</h3></div><label class="checkbox-row"><input id="visaFeeChanged" type="checkbox"> 本次涉及退补签证费用，发起应收调整</label><div id="visaFeeFields" class="form-grid" hidden><label class="form-group"><span class="form-label">原签证费用</span><input id="visaOriginalFee" class="form-control" readonly></label><label class="form-group"><span class="form-label">申请调整金额</span><input id="visaRequestedFee" class="form-control" type="number" placeholder="增加填正数，减少填负数"></label></div><div class="alert alert-blue">办理方式变化不会自动改变订单价；费用调整审批通过前继续使用原应收。</div></section><p id="visaModeChangeError" class="form-error" hidden></p>',
    '</div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-close-visa-mode>取消</button><button id="saveVisaModeChange" class="btn btn-primary" type="button">保存变更</button></div></section></div>'
  ].join(''));
  var drawer=document.getElementById('visaModeChangeDrawer');

  function persist(){try{sessionStorage.setItem(storageKey,JSON.stringify({records:records.reduce(function(map,item){map[item.name]=item;return map;},{}),history:history}));}catch(e){}}
  function renderSummary(){
    var counts={unselected:0,self:0,agency:0,none:0,missing:0};
    records.forEach(function(item){if(item.mode==='未选择')counts.unselected++;else if(item.mode==='游客自办')counts.self++;else if(item.mode==='随团代办'){counts.agency++;if(item.material!=='12/12项')counts.missing++;}else counts.none++;});
    document.getElementById('orderVisaSummary').innerHTML=[['未选择',counts.unselected+'人'],['游客自办',counts.self+'人'],['随团代办',counts.agency+'人'],['代办材料缺项',counts.missing+'人']].map(function(item){return '<div><span>'+item[0]+'</span><strong>'+item[1]+'</strong></div>';}).join('');
  }
  function renderRows(){
    document.getElementById('orderVisaRows').innerHTML=records.map(function(item,index){var district=index%2?'上海领区':'北京领区';var residence=index%2?'江苏南京':'北京';return '<tr><td><strong>'+esc(item.name)+'</strong></td><td>'+modeTag(item.mode)+'</td><td><div class="table-cell-main"><strong>'+residence+'</strong><span>'+district+'</span></div></td><td><div class="table-cell-main"><strong>'+esc(profile.country+' / '+profile.type)+'</strong><span>'+esc(profile.version)+'</span></div></td><td><strong>'+esc(item.material)+'</strong></td><td>'+esc(item.mode==='随团代办'?profile.deadline:'仅核验出行证件')+'</td><td><span class="'+(item.status==='材料收集中'?'tag tag-orange':item.status==='证件待核验'?'tag tag-blue':'tag tag-gray')+'">'+esc(item.status)+'</span></td><td><button class="table-action-primary" type="button" data-drawer-title="变更签证办理方式" data-change-visa-mode="'+index+'">变更方式</button></td></tr>';}).join('');
    document.getElementById('orderVisaHistoryRows').innerHTML=history.length?history.map(function(item){return '<tr><td>'+esc(item.name)+'</td><td>'+esc(item.from)+'</td><td>'+esc(item.to)+'</td><td>'+esc(item.reason)+'</td><td>'+esc(item.task)+'</td><td>'+esc(item.fee)+'</td><td>'+esc(item.time)+'</td></tr>';}).join(''):'<tr><td colspan="7" class="table-empty-cell">暂无办理方式变更</td></tr>';
    renderSummary();
  }
  renderRows();

  section.addEventListener('click',function(event){var button=event.target.closest('[data-change-visa-mode]');if(!button)return;currentIndex=Number(button.dataset.changeVisaMode);var item=records[currentIndex];document.getElementById('visaModeChangeSummary').textContent=orderNo+' / '+item.name+' / '+profile.country+'签证';document.getElementById('visaModeOriginal').value=item.mode;document.getElementById('visaModeNext').innerHTML=['未选择'].concat(profile.allowed).concat(profile.required?[]:['无需签证']).map(function(mode){return '<option'+(mode===item.mode?' selected':'')+'>'+esc(mode)+'</option>';}).join('');document.getElementById('visaModeReason').value='';document.getElementById('visaTaskHandlingField').hidden=item.mode!=='随团代办';document.getElementById('visaTaskHandling').value='';document.getElementById('visaFeeChanged').checked=false;document.getElementById('visaFeeFields').hidden=true;document.getElementById('visaOriginalFee').value='¥'+item.fee;document.getElementById('visaRequestedFee').value='';document.getElementById('visaModeChangeError').hidden=true;openLayer(drawer);});
  document.getElementById('visaFeeChanged').addEventListener('change',function(){document.getElementById('visaFeeFields').hidden=!this.checked;});
  document.getElementById('visaModeNext').addEventListener('change',function(){var item=records[currentIndex];document.getElementById('visaTaskHandlingField').hidden=!(item.mode==='随团代办'&&this.value!=='随团代办');});
  document.getElementById('saveVisaModeChange').addEventListener('click',function(){if(currentIndex<0)return;var item=records[currentIndex];var next=document.getElementById('visaModeNext').value;var reason=document.getElementById('visaModeReason').value.trim();var taskField=document.getElementById('visaTaskHandlingField');var task=document.getElementById('visaTaskHandling').value;var feeChanged=document.getElementById('visaFeeChanged').checked;var requested=Number(document.getElementById('visaRequestedFee').value||0);var error=document.getElementById('visaModeChangeError');if(next===item.mode){error.textContent='请选择不同于原方式的新办理方式。';error.hidden=false;return;}if(!reason){error.textContent='请填写变更原因。';error.hidden=false;return;}if(!taskField.hidden&&!task){error.textContent='原方式为随团代办时，请选择原代办任务处理方式。';error.hidden=false;return;}if(feeChanged&&!requested){error.textContent='涉及费用时必须填写非零申请调整金额。';error.hidden=false;return;}history.unshift({name:item.name,from:item.mode,to:next,reason:reason,task:task||'不涉及原代办任务',fee:feeChanged?('申请调整 '+(requested>0?'+':'')+'¥'+requested+'，待审批'):'订单价格不变',time:'2026-09-19 10:30'});item.previous=item.mode;item.mode=next;item.reason=reason;item.status=next==='随团代办'?'材料收集中':next==='游客自办'?'证件待核验':next==='无需签证'?'无需办理':'待选择';item.material=next==='随团代办'?'0/12项':'不适用';if(feeChanged)item.feeAdjustment={original:item.fee,requested:requested,status:'待审批'};persist();renderRows();closeLayer(drawer);});
  document.querySelectorAll('[data-close-visa-mode]').forEach(function(button){button.addEventListener('click',function(){closeLayer(drawer);});});drawer.addEventListener('click',function(event){if(event.target===drawer)closeLayer(drawer);});
  window.OrderVisaDetailTest={records:records,profile:profile,render:renderRows};
})();
