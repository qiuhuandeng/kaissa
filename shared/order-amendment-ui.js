(function(){
  'use strict';
  var M=window.OrderAmendmentModel, records=[], mounts=[];
  function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function field(name,label,input,wide){return '<label class="form-group'+(wide?' amend-wide':'')+'"><span class="form-label">'+label+'</span>'+input.replace('<input','<input name="'+name+'"').replace('<select','<select name="'+name+'"').replace('<textarea','<textarea name="'+name+'"')+'</label>';}
  function opts(values){return values.map(function(x){return '<option>'+esc(x)+'</option>';}).join('');}
  function list(orderNo){return records.filter(function(r){return r.orderNo===orderNo;});}
  function recordsHTML(context){
    var rows=list(context.orderNo);
    return '<section class="amend-records"><h3 class="detail-section-title">应收及服务变更记录</h3><div class="table-wrap"><table><colgroup><col style="width:220px"><col><col style="width:125px"><col style="width:125px"><col style="width:72px"></colgroup><thead><tr><th>申请单／时间</th><th>业务项目</th><th>应收差额</th><th>处理状态</th><th class="amend-action">操作</th></tr></thead><tbody>'+ (rows.length?rows.map(function(r){return '<tr><td>'+esc(r.no)+'<span class="text-muted">'+esc(r.createdAt)+'</span></td><td>'+esc(r.item)+'<span class="text-muted">'+esc(r.traveler||r.reason)+'</span></td><td>'+esc(r.delta===null?'待报价':M.money(r.delta))+'</td><td>'+esc(r.status)+'</td><td class="amend-action"><button class="table-link" type="button" data-amend-view="'+r.no+'">查看</button></td></tr>';}).join(''):'<tr><td colspan="5" class="table-empty-cell">暂无调整申请</td></tr>')+'</tbody></table></div></section>';
  }
  function refresh(){mounts.forEach(function(m){if(m.host.isConnected)m.host.innerHTML=recordsHTML(m.context);});document.dispatchEvent(new CustomEvent('order-amendments-changed'));}
  function watch(host,context){mounts=mounts.filter(function(m){return m.host.isConnected&&m.host!==host;});mounts.push({host:host,context:context});host.innerHTML=recordsHTML(context);}
  function mount(host,context,button,preset){
    preset=preset||{};context=Object.assign({},context,{originalItems:context.originalItems||M.originalItems(context.type,context.originalAmount)});
    host.classList.remove('order-drawer-form');host.classList.add('amend-host');host.dataset.dirty='false';
    host.innerHTML='<div class="amend-form">'+
      field('item','业务款项','<select class="form-control">'+opts(M.items(context.type))+'</select>')+
      field('direction','调整方向','<select class="form-control">'+opts(['新增项目','修改原项目','减免应收'])+'</select>')+
      field('originalItemId','原应收项目','<select class="form-control">'+(context.originalItems||M.originalItems(context.type,context.originalAmount)).map(function(i){return '<option value="'+esc(i.id)+'">'+esc(i.label)+' · '+M.money(i.amount)+'</option>';}).join('')+'</select>')+
      '<div class="amend-wide" data-amend-before hidden></div>'+
      field('priceMode','收费方式','<select class="form-control">'+opts(['收费','免费','待报价'])+'</select>')+
      field('quantity','数量','<input class="form-control" type="number" min="1" max="9999" step="1" value="1">')+
      field('price','本次单价（元）','<input class="form-control" type="number" min="0" step="0.01" placeholder="请输入">')+
      field('unit','计量单位','<select class="form-control">'+opts(['项','人','人/晚','段','舱'])+'</select>')+
      '<div class="form-group amend-wide"><span class="form-label">本次应收差额</span><strong data-amend-total>—</strong></div>'+
      '<div class="amend-resources">'+field('traveler','涉及游客','<input class="form-control" placeholder="游客姓名或全体游客">')+
      field('operator','负责计调','<select class="form-control"><option value="">请选择</option>'+opts(['计调张敏','计调李强'])+'</select>')+
      field('request','服务安排','<textarea class="form-control" rows="2" placeholder="如联运日期、上下车地点、房型及入住日期"></textarea>',true)+'</div>'+
      field('reason','调整原因及客户确认依据','<textarea class="form-control" rows="2" placeholder="填写变更原因、客户确认及报价依据"></textarea>',true)+
      '</div><p class="amend-error" role="alert" hidden></p><p class="amend-feedback" aria-live="polite"></p><div data-amend-records></div>';
    var form=host.querySelector('.amend-form'),at=function(n){return form.querySelector('[name="'+n+'"]');};
    Object.keys(preset).forEach(function(k){if(at(k))at(k).value=preset[k];});
    button.textContent='提交业务审批';button.disabled=false;
    function sync(){
      var modifying=at('direction').value==='修改原项目', before=context.originalItems.find(function(i){return i.id===at('originalItemId').value;});
      at('originalItemId').closest('label').hidden=!modifying;at('item').disabled=modifying;
      if(modifying&&before)at('item').value=before.item;
      var previous=host.querySelector('[data-amend-before]');previous.hidden=!modifying;previous.textContent=modifying&&before?'原数量 '+before.quantity+' × 原单价 '+M.money(before.price)+' = '+M.money(before.amount):'';
      var mode=at('priceMode').value,resource=M.needsResource(at('item').value)||mode!=='收费';
      host.querySelector('.amend-resources').hidden=!resource;
      at('price').disabled=mode!=='收费';
      if(mode!=='收费')at('price').value=mode==='免费'?'0':'';
      var n=mode==='免费'?0:Number(at('price').value)*Number(at('quantity').value)*(at('direction').value==='减免应收'?-1:1);
      if(modifying&&before)n-=before.amount;
      host.querySelector('[data-amend-total]').textContent=mode==='待报价'?'待计调报价':!Number.isFinite(n)?'—':M.money(n);
      host.querySelector('.amend-feedback').textContent=resource?(mode==='免费'&&!modifying?'免费服务仍须计调确认并保留记录。':'计调确认服务安排后，进入应收业务审批；原应收暂不改变。'):'所有应收变更须业务审批；审批岗位待配置，批准前原应收不变。';
      button.textContent=resource?'提交变更申请':'提交业务审批';
      button.disabled=false;
    }
    host.oninput=host.onchange=function(e){host.dataset.dirty='true';if(e&&['direction','originalItemId'].includes(e.target.name)&&at('direction').value==='修改原项目'){var b=context.originalItems.find(function(i){return i.id===at('originalItemId').value;});if(b){at('quantity').value=b.quantity;at('price').value=b.price;at('priceMode').value='收费';}}sync();};sync();watch(host.querySelector('[data-amend-records]'),context);
    button.onclick=function(){
      var error=host.querySelector('.amend-error');error.hidden=true;
      try{
        var input=Object.assign({},context);['item','direction','originalItemId','priceMode','quantity','price','unit','traveler','operator','request','reason'].forEach(function(k){input[k]=at(k).value;});
        var r=M.create(input,records);records.push(r);refresh();button.disabled=true;host.dataset.dirty='false';
        host.querySelector('.amend-feedback').textContent=r.no+' 已提交，'+r.status+(r.delta===0?'；应收无变化，服务仍须计调确认。':'；原订单应收暂不改变。');
      }catch(e){error.textContent=e.message;error.hidden=false;}
    };
  }
  var drawer;
  function view(no){
    var r=records.find(function(x){return x.no===no;});if(!r)return;
    if(!drawer){document.body.insertAdjacentHTML('beforeend','<div id="amendmentRecordDrawer" class="modal-overlay drawer-overlay" aria-hidden="true"><section class="modal drawer-modal amend-detail" role="dialog" aria-modal="true" aria-labelledby="amendmentRecordTitle"><div class="modal-header"><h2 id="amendmentRecordTitle" class="modal-title">变更申请详情</h2><button type="button" class="modal-close" data-amend-close aria-label="关闭">×</button></div><div class="modal-body"></div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-amend-close>关闭</button><button class="btn btn-secondary" type="button" data-amend-withdraw>撤回申请</button></div></section></div>');drawer=document.getElementById('amendmentRecordDrawer');}
    var pairs=[['申请单号',r.no],['原订单',r.orderNo],['产品类型',r.type],['业务款项',r.item],['申请状态',r.status],['收费方式',r.priceMode],['数量／单位',r.quantity+' '+r.unit],['本次单价',r.price===null?'待报价':M.money(r.price)],['应收差额',r.delta===null?'待报价':M.money(r.delta)],['应收调整单',r.adjustmentNo],['业务审批',r.approvalStatus],['计调确认',r.resourceStatus],['应收生效',r.status==='已撤回'?'已撤回':r.finance],['原订单应收',M.money(r.originalAmount||0)],['申请后应收（未生效）',r.delta===null?'待报价':M.money(Number(r.originalAmount||0)+r.delta)],['涉及游客',r.traveler||'—'],['负责计调',r.resource?r.operator:'无需资源确认'],['服务安排',r.request||'—'],['调整依据',r.reason],['申请人／时间',r.applicant+' / '+r.createdAt]];
    if(r.before)pairs.splice(8,0,['原项目',r.before.label],['调整前数量／单价／金额',r.before.quantity+' / '+M.money(r.before.price)+' / '+M.money(r.before.amount)],['调整后数量／单价／金额',r.quantity+' / '+M.money(r.price)+' / '+M.money(r.quantity*r.price)]);
    drawer.querySelector('.modal-body').innerHTML='<div class="description-grid">'+pairs.map(function(p){return '<div class="description-item"><div class="description-label">'+esc(p[0])+'</div><div class="description-value">'+esc(p[1])+'</div></div>';}).join('')+'</div>'+(r.resource?'<p class="amend-notice">'+esc(r.status==='已撤回'?'申请已撤回，不再安排服务。':r.operator+' · '+r.status+'。应收为0也须确认服务安排。')+'</p>':'')+(r.delta&&r.status!=='已撤回'?'<div class="amend-links"><a href="../approval/approvals.html?matter='+encodeURIComponent('订单应收变更')+'&sourceNo='+encodeURIComponent(r.adjustmentNo)+'">审批记录</a><a href="../finance/finance-receivable.html?orderNo='+encodeURIComponent(r.orderNo)+'&sourceNo='+encodeURIComponent(r.adjustmentNo)+'">应收管理</a><a href="../finance/finance-settlement.html?orderNo='+encodeURIComponent(r.orderNo)+'&sourceNo='+encodeURIComponent(r.adjustmentNo)+'">未结算：业务结算</a><a href="../finance/finance-settlement-adjustment.html?orderNo='+encodeURIComponent(r.orderNo)+'&sourceNo='+encodeURIComponent(r.adjustmentNo)+'">已结算：追加调整</a></div>':'');
    drawer.dataset.no=no;drawer.querySelector('[data-amend-withdraw]').hidden=['已撤回','已生效','已驳回'].includes(r.status);window.caesarUI.openLayer(drawer);
  }
  document.addEventListener('click',function(e){var b=e.target.closest('[data-amend-view]');if(b){view(b.dataset.amendView);return;}if(e.target.closest('[data-amend-close]'))window.caesarUI.closeLayer(drawer);if(e.target.closest('[data-amend-withdraw]')){var r=records.find(function(x){return x.no===drawer.dataset.no;});if(r){if(['已生效','已驳回','已撤回'].includes(r.status))return;r.status='已撤回';r.approvalStatus='已撤回';refresh();view(r.no);}}});
  document.addEventListener('click',function(e){
    var layer=e.target.closest('.modal-overlay');if(!layer)return;
    if(!e.target.closest('.modal-close,[data-close-modal],[data-close-receivable],[data-close-service-application]')&&e.target!==layer)return;
    var dirty=layer.querySelector('.amend-host[data-dirty="true"]');
    if(dirty&&!window.confirm('当前申请尚未提交，确认关闭吗？')){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  window.OrderAmendmentUI={mount:mount,watch:watch,list:list,view:view,add:function(input){var r=M.create(input,records);records.push(r);refresh();return r;}};
})();
