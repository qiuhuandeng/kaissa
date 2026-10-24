(function () {
  'use strict';
  var S=window.CaesarCruiseSupply, e=S.escape, api;
  function $(id){return document.getElementById(id);}
  function field(id,label,html){return '<div class="form-group"><label class="form-label" for="'+id+'">'+label+'</label>'+html+'</div>';}
  function unit(n){return n+'间';}
  function scheduleLink(id){return '<a href="schedules-detail.html?type=cruise&scheduleNo='+encodeURIComponent(id)+'&tab=inventory">'+e(id)+'</a>';}
  function groupName(id){var s=S.schedules.find(function(x){return x.code===id;});return s?s.name:id;}
  function refresh(){api.detail(api.current());api.list();}
  function renderDetail(contract) {
    if(contract.type!=='邮轮')return;
    $('detailOpenReturn').textContent='申请退舱';
    $('allocationRows').closest('.table-wrap').classList.add('cruise-allocation-table');
    $('inventoryRows').closest('.table-wrap').classList.add('cruise-procurement-inventory');
    $('inventoryRows').closest('table').querySelector('thead tr').innerHTML=['舱型','采购总量','已分配','未分配','已售／锁定','旅客人数','已确认','成本单价','采购金额','入住规则','已退船方','操作'].map(function(t,i){return '<th'+(i===0?' id="detailInventorySubtypeHead"':'')+'>'+t+'</th>';}).join('');
    $('inventoryRows').innerHTML=contract.subtypes.map(function(r){return '<tr data-inventory-subtype="'+e(r.name)+'"><td>'+e(r.name)+'</td><td>'+unit(r.total)+'</td><td>'+unit(r.allocated)+'</td><td>'+unit(S.unallocated(r))+'</td><td>'+unit(r.sold)+' / '+unit(r.locked||0)+'</td><td>'+((r.adultOccupancy||0)+(r.childOccupancy||0)+(r.childNoBerthSold||0))+'人</td><td>'+unit(r.issued)+'</td><td>¥'+r.unitPrice.toLocaleString()+'</td><td>¥'+(r.total*r.unitPrice).toLocaleString()+'</td><td>标准'+(r.capacity||2)+'人／最多'+(r.maxCapacity||2)+'人</td><td>'+unit(r.returned)+'</td><td><button class="table-link" data-open-inventory-adjust>库存调整</button></td></tr>';}).join('');
    $('allocationRows').closest('table').querySelector('thead tr').innerHTML=['使用团期','产品／出发地','舱型','分配方式／间数','已售','锁定','已确认','可售','主状态','操作'].map(function(t,i){return '<th'+(i===2?' id="detailAllocationSubtypeHead"':'')+'>'+t+'</th>';}).join('');
    var rows=contract.allocations.map(function(r,i){var free=Math.max(0,r.allocated-r.sold-(r.locked||0)-(r.returned||0));return '<tr><td>'+e(r.scheduleNo)+'</td><td>'+e(r.scheduleName)+'</td><td>'+e(r.subtype)+'</td><td>独立分配 '+unit(r.allocated-(r.returned||0))+'</td><td>'+unit(r.sold)+'</td><td>'+unit(r.locked||0)+'</td><td>'+unit(r.issued)+'</td><td>'+unit(free)+'</td><td>'+e(r.status)+'</td><td>'+(free?'<button class="table-link" data-cruise-return-allocation="'+i+'">归还余舱</button>':'—')+'</td></tr>';});
    (contract.sharedCabins||[]).forEach(function(g){rows.push('<tr><td>'+g.members.map(scheduleLink).join('<br>')+'</td><td>'+g.members.map(function(id){return '<span class="cruise-member-line">'+e(groupName(id))+'</span>';}).join('')+'</td><td>'+e(g.name)+'</td><td>共同使用 '+unit(g.quantity)+'</td><td>'+unit(g.sold)+'</td><td>'+unit(g.locked)+'</td><td>—</td><td>'+unit(S.available(g))+'</td><td>开放报名</td><td><button class="table-link" data-cruise-group="'+e(g.id)+'">占用明细</button></td></tr>');});
    $('allocationRows').innerHTML=rows.join('')||'<tr><td colspan="10">暂无分配记录</td></tr>';
    if(!$('cruiseReturnRecords'))$('changeRows').closest('.table-wrap').insertAdjacentHTML('afterend','<section id="cruiseReturnRecords" class="drawer-section"><h3 class="drawer-section-title">退舱申请与船方结果</h3><div class="table-wrap"><table><thead><tr><th>申请／舱型</th><th>申请间数</th><th>主状态</th><th>确认损失／依据</th><th>操作</th></tr></thead><tbody id="cruiseReturnRows"></tbody></table></div></section>');
    $('cruiseReturnRows').innerHTML=(contract.cruiseReturns||[]).map(function(r){return '<tr><td>'+e(r.id+' / '+r.name)+'</td><td>'+unit(r.quantity)+'</td><td>'+e(r.status)+'</td><td>'+(r.amount===null?'待确认':'¥'+r.amount.toLocaleString())+'<div class="text-muted">'+e(r.evidence)+'</div></td><td>'+(r.status==='待船方确认'?'<button class="table-link" data-cruise-confirm-return="'+e(r.id)+'">登记结果</button>':'查看原记录')+'</td></tr>';}).join('')||'<tr><td colspan="5">暂无退舱申请</td></tr>';
  }
  function prepareAllocation(contract) {
    if(contract.type!=='邮轮')return;
    if(!$('cruiseAllocationMode'))$('allocationScheduleSummary').insertAdjacentHTML('beforebegin','<div class="form-grid cruise-supply-fields">'+field('cruiseAllocationMode','分配方式','<select id="cruiseAllocationMode" class="form-control"><option value="independent">独立分配给所选团期</option><option value="shared">多个团期共同使用</option></select>')+field('cruiseAllocationGroup','共同使用来源','<select id="cruiseAllocationGroup" class="form-control"></select>')+'<div class="form-group form-group-full" id="cruiseAllocationMembers"></div></div>');
    $('cruiseAllocationMode').value='independent';
    var matching=Array.from($('allocationSchedule').options).find(function(o){return o.dataset.depart===contract.departDate;});if(matching)$('allocationSchedule').value=matching.value;
    $('cruiseAllocationGroup').innerHTML='<option value="">新建共同使用份额</option>'+(contract.sharedCabins||[]).map(function(g){return '<option value="'+e(g.id)+'">'+e(g.name)+' · '+g.quantity+'间 · 共余'+S.available(g)+'间</option>';}).join('');
    $('cruiseAllocationMembers').innerHTML='<label class="form-label">共同使用团期</label>'+Array.from($('allocationSchedule').options).filter(function(o){return o.dataset.depart===contract.departDate;}).map(function(o,i){return '<label class="cruise-supply-member"><input type="checkbox" data-cruise-member value="'+e(o.value)+'"'+(i<2?' checked':'')+'> '+e(o.textContent.split(' | 已分配')[0])+'</label>';}).join('');
    var filled=false;$('allocationSubtypeRows').querySelectorAll('[data-allocation-qty]').forEach(function(input){input.value=!filled&&Number(input.max)>0?1:0;if(Number(input.value))filled=true;});
    updateAllocation(contract);api.scheduleSummary();
  }
  function updateAllocation(contract) {
    if(contract.type!=='邮轮'||!$('cruiseAllocationMode'))return;
    var shared=$('cruiseAllocationMode').value==='shared', id=$('cruiseAllocationGroup').value, group=(contract.sharedCabins||[]).find(function(g){return g.id===id;});
    $('cruiseAllocationGroup').closest('.form-group').hidden=!shared;$('cruiseAllocationMembers').hidden=!shared;
    $('allocationSchedule').closest('.form-group').hidden=shared;
    $('allocationScheduleSummary').hidden=shared;
    $('allocationSubtypeRows').querySelectorAll('tr').forEach(function(row){var input=row.querySelector('[data-allocation-qty]');input.disabled=shared&&!!group;if(shared&&group)input.value=0;});
    $('saveAllocation').textContent=shared&&group?'加入共同使用':'确认分配';
  }
  function saveAllocation(contract) {
    if(contract.type!=='邮轮')return false;
    var shared=$('cruiseAllocationMode').value==='shared';
    if(!shared){
      if(Array.from($('allocationSubtypeRows').querySelectorAll('[data-allocation-qty]')).some(function(input){return !S.whole(input.value);})){api.toast('分配间数须为非负整数，原记录未改变','warning');return true;}
      return false; // Preserve the original independent allocation and batch bookkeeping.
    }
    if(api.daysUntil(contract.dlDate)<0){api.toast('当前协议已过DL，分配需先走超DL审批','warning');return true;}
    var names=shared?Array.from(document.querySelectorAll('[data-cruise-member]:checked')).map(function(n){return n.value;}):[$('allocationSchedule').value];
    var entries=Array.from($('allocationSubtypeRows').rows).map(function(row){return {name:row.dataset.allocationSubtype,quantity:row.querySelector('[data-allocation-qty]').value};});
    var matching=Array.from($('allocationSchedule').options).filter(function(o){return names.includes(o.value);}).every(function(o){return o.dataset.depart===contract.departDate;});
    if(!matching){api.toast('团期与船方航次日期不一致，请核对来源','warning');return true;}
    var result=S.allocate(contract,names,entries,shared,$('cruiseAllocationGroup').value);
    if(!result.ok){api.toast(result.message,'warning');return true;}
    window.caesarUI.closeLayer($('allocationDrawer'));refresh();api.toast(shared?'共同使用关系已保存，舱房只分配一次':'已独立分配到团期');return true;
  }
  function prepareReturn(contract) {
    if(contract.type!=='邮轮')return;
    var available=contract.subtypes.find(function(r){return S.unallocated(r)>0;});if(available)$('returnSubtypeSelect').value=available.name;
    $('returnTitle').textContent='申请退舱';$('saveReturn').textContent='提交申请';
    if(!$('cruiseReturnNote'))$('returnDrawer').querySelector('.readonly-summary').insertAdjacentHTML('afterend','<p class="form-hint" id="cruiseReturnNote">提交后保留原采购量；船方确认同意后减少可用量，损失按船方结果登记。</p>');
  }
  function saveReturn(contract) {
    if(contract.type!=='邮轮')return false;
    var result=S.requestReturn(contract,$('returnSubtypeSelect').value,$('returnQtyInput').value,$('returnReasonInput').value);
    if(!result.ok){api.toast(result.message,'warning');return true;}
    window.caesarUI.closeLayer($('returnDrawer'));refresh();api.tab('payment');api.toast('退舱申请已记录，采购量与损失未改变');return true;
  }
  function openResult(id) {
    var r=api.current().cruiseReturns.find(function(r){return r.id===id;});
    var layer=$('cruiseSupplyResult');
    if(!layer){document.body.insertAdjacentHTML('beforeend','<div id="cruiseSupplyResult" class="modal-overlay drawer-overlay" hidden><section class="modal drawer-modal drawer-md"><div class="modal-header"><h3 class="modal-title">船方退舱结果</h3><button class="modal-close" data-cruise-close-result>×</button></div><div class="modal-body"></div><div class="modal-footer"><button class="btn btn-secondary" data-cruise-close-result>取消</button><button class="btn btn-primary" id="cruiseSaveReturnResult">保存结果</button></div></section></div>');layer=$('cruiseSupplyResult');}
    layer.querySelector('.modal-body').innerHTML='<p>'+e(r.id+' / '+r.name+' / '+r.quantity+'间')+'</p><div class="form-grid">'+field('cruiseReturnAccepted','船方结果','<select id="cruiseReturnAccepted" class="form-control"><option value="yes">同意退舱</option><option value="no">未同意</option></select>')+field('cruiseReturnAmount','船方确认损失（元）','<input id="cruiseReturnAmount" class="form-control" type="number" min="0" value="0">')+field('cruiseReturnEvidence','确认依据','<input id="cruiseReturnEvidence" class="form-control" value="船方确认单（演示）">')+'</div>';
    $('cruiseSaveReturnResult').onclick=function(){var result=S.confirmReturn(api.current(),id,$('cruiseReturnAccepted').value==='yes',$('cruiseReturnAmount').value,$('cruiseReturnEvidence').value);if(!result.ok)return api.toast(result.message,'warning');window.caesarUI.closeLayer(layer);refresh();api.toast('船方结果已保存；费用仍由原成本确认办理');};
    window.caesarUI.openLayer(layer);
  }
  function install(context) {
    api=context;
    document.addEventListener('change',function(ev){if(ev.target.matches('#cruiseAllocationMode,#cruiseAllocationGroup')){updateAllocation(api.current());api.updateAllocation();}});
    document.addEventListener('click',function(ev){
      var t=ev.target, button=t.closest('[data-cruise-return-allocation]');
      if(button){var n=S.releaseAllocation(api.current(),Number(button.dataset.cruiseReturnAllocation));refresh();api.toast('已归还未售未锁舱房 '+n+'间；采购量不变');}
      button=t.closest('[data-cruise-group]');if(button){var group=api.current().sharedCabins.find(function(g){return g.id===button.dataset.cruiseGroup;});var row=button.closest('tr');var next=row.nextElementSibling;if(next&&next.dataset.cruiseUsage){next.remove();return;}row.insertAdjacentHTML('afterend','<tr data-cruise-usage><td colspan="10">'+group.members.map(function(id){var u=group.usage.find(function(x){return x.schedule===id;})||{sold:0,locked:0};return e(groupName(id))+'：已售'+u.sold+'间，锁定'+u.locked+'间';}).join('；')+'。共同余量 '+S.available(group)+'间，不能按团期相加。</td></tr>');}
      button=t.closest('[data-cruise-confirm-return]');if(button)openResult(button.dataset.cruiseConfirmReturn);
      if(t.closest('[data-cruise-close-result]'))window.caesarUI.closeLayer($('cruiseSupplyResult'));
    });
  }
  window.CaesarCruiseProcurement={install:install,renderDetail:renderDetail,prepareAllocation:prepareAllocation,updateAllocation:updateAllocation,saveAllocation:saveAllocation,prepareReturn:prepareReturn,saveReturn:saveReturn};
})();
