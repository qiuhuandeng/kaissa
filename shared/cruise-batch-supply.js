(function () {
  'use strict';
  var S=window.CaesarCruiseSupply,e=S.escape;
  function $(id){return document.getElementById(id);}
  function voyage(){return S.voyages.find(function(v){return v.id===$('batchTrafficResource').value;})||S.voyages[0];}
  function options(){return S.voyages.map(function(v){return {value:v.id,label:'理想号 '+v.id+' · '+v.depart+' · BA共同使用／BC独立分配',depart:v.depart,back:v.back,qty:v.shared-v.sold-v.locked+v.independent,unit:'间'};});}
  function input(name,value,type){return '<input class="form-control" type="'+(type||'number')+'" min="0" data-batch-matrix-field="'+e(name)+'" value="'+e(value)+'" aria-label="'+e(name)+'">';}
  function matrix(){
    var heads=['舱型／使用方式','本团上限（间）','第1人','儿童价','单人附加','港务税','服务费'];
    return '<div class="cruise-batch-matrix"><section class="batch-type-matrix"><div class="batch-type-matrix-head" style="--batch-matrix-columns:180px repeat(6,minmax(95px,1fr))">'+heads.map(function(t){return '<span>'+t+'</span>';}).join('')+'</div>'+['阳台 BA','阳台 BC'].map(function(name,i){var p=S.prices();return '<div class="batch-type-matrix-row" style="--batch-matrix-columns:180px repeat(6,minmax(95px,1fr))" data-batch-matrix-row="'+name+'"><strong>'+name+'<select class="form-control" data-cruise-use><option value="shared"'+(!i?' selected':'')+'>共同使用</option><option value="independent"'+(i?' selected':'')+'>独立分配</option></select></strong>'+input('间数',i?2:15)+input('第1人',i?26800:p.first)+input('儿童价',p.child)+input('单人附加费',p.single)+input('港务税',p.port)+input('服务费',p.service)+'<details class="cruise-price-more"><summary>第2／3／4人、税费方式及来源</summary><div class="form-grid">'+[['第2人',p.second],['第3人',i?'不适用':p.third],['第4人',i?'不适用':p.fourth],['燃油费',p.fuel]].map(function(pair){return '<label class="form-label">'+pair[0]+(pair[1]==='不适用'?'<input class="form-control" value="不适用" readonly data-batch-matrix-field="'+pair[0]+'">':input(pair[0],pair[1]))+'</label>';}).join('')+'<label class="form-label">税费方式<select class="form-control" data-batch-matrix-field="税费方式"><option>另收</option><option>已含</option></select></label></div><p class="form-hint" data-cruise-source-note></p><p class="form-hint" data-cruise-price-total></p></details></div>';}).join('')+'</section></div>';
  }
  function rows(){return Array.from(document.querySelectorAll('#batchTypeSpecificGrid [data-batch-matrix-row]'));}
  function sync(reset){
    if(!rows().some(function(r){return r.querySelector('[data-cruise-use]');}))return;
    $('batchTrafficResource').disabled=false;$('batchTrafficQty').disabled=false;$('batchTrafficQty').readOnly=true;
    $('batchQuotaSource').value='绑定已采购交通';
    var field=$('batchTrafficResource').closest('.form-group');if(field)field.hidden=false;
    var v=voyage(),capacity=0;
    rows().forEach(function(row,i){var use=row.querySelector('[data-cruise-use]');
      // A cabin code always references its own procurement quantity.
      use.value=i?'independent':'shared';use.disabled=true;
      var free=i?v.independent:v.shared-v.sold-v.locked,qty=row.querySelector('[data-batch-matrix-field="间数"]');
      if(reset)qty.value=free;
      qty.max=free;capacity+=Number(qty.value)||0;
      row.dataset.cruiseAvailable=free;
      row.querySelector('[data-cruise-source-note]').textContent=v.id+' · '+(i?'BC未分配 '+free+'间，保存后独立占用':'BA共同 '+v.shared+'间，已售'+v.sold+'间、锁定'+v.locked+'间，共余'+free+'间；关联本团不复制库存');
      var get=function(k){return row.querySelector('[data-batch-matrix-field="'+k+'"]').value;};
      var total=S.priceTotal({first:get('第1人'),port:get('港务税'),service:get('服务费'),fuel:get('燃油费'),feeMode:get('税费方式')});
      row.querySelector('[data-cruise-price-total]').textContent='第1人应收参考 ¥'+total.toLocaleString()+'；第二至第四人与儿童价按适用规则择一计价。';
    });
    $('batchCapacityLimit').value=capacity;$('batchCapacityLimit').readOnly=true;$('batchTrafficQty').value=capacity;
    $('batchTrafficBindingPill').textContent=invalid()?'数量待核':'已关联';$('batchTrafficBindingPill').className=invalid()?'tag tag-orange':'tag tag-green';
    $('batchTrafficBindHint').textContent='船方航次 '+v.id+'（'+v.depart+' 至 '+v.back+'）；共同使用舱房以各团合计占用后的余量为准。';
    $('batchPriceGroup').value='¥'+Number(rows()[0].querySelector('[data-batch-matrix-field="第1人"]').value).toLocaleString();
  }
  function invalid(){return rows().some(function(row){var n=row.querySelector('[data-batch-matrix-field="间数"]').value;return !S.whole(n)||Number(n)>Number(row.dataset.cruiseAvailable);});}
  function data(){return {voyage:cloneVoyage(),cabins:rows().map(function(row){var fields={};row.querySelectorAll('[data-batch-matrix-field]').forEach(function(el){fields[el.dataset.batchMatrixField]=el.value;});return {name:row.dataset.batchMatrixRow,mode:row.querySelector('[data-cruise-use]').value,fields:fields};})};}
  function cloneVoyage(){return S.clone(voyage());}
  function preview(dates){var v=voyage();dates.forEach(function(row){var match=row.dataset.batchPreviewDate===v.depart;row.dataset.cruiseVoyage=match?v.id:'';var cell=row.cells[0];cell.insertAdjacentHTML('beforeend','<span class="text-muted cruise-voyage-check">'+(match?e(v.id):'此日期未关联采购航次')+'</span>');});}
  function datesValid(dates){return dates.every(function(row){return row.dataset.batchPreviewDate===voyage().depart;});}
  var priceFields=['第1人','第2人','第3人','第4人','儿童价','单人附加费','港务税','服务费','燃油费'];
  var editLabels={'成人价':'第1人','儿童价':'儿童价','单房差':'单人附加费','港务税':'港务税','服务费':'服务费'};
  function currentSupply(item){
    var supply=S.clone(item.cruiseSupply);
    supply.cabins.forEach(function(cabin,i){priceFields.filter(function(k){return cabin.fields[k]!=='不适用';}).forEach(function(k,j){var value=item['cruise_'+i+'_'+j];if(value!=null)cabin.fields[k]=String(S.number(String(value).replace(/[^\d.]/g,'')));});});
    return supply;
  }
  function editConfig(item,config){
    var supply=currentSupply(item),heads=Object.keys(editLabels);
    return Object.assign({},config,{matrixHeads:['舱房售卖'].concat(heads),matrixRows:supply.cabins.map(function(c){return [c.name].concat(heads.map(function(label){return '¥'+Number(c.fields[editLabels[label]]||0).toLocaleString('zh-CN');}));})});
  }
  function editedSchedule(item,next){
    var supply=currentSupply(item),result=Object.assign({},item,next,{cruiseSupply:supply});
    document.querySelectorAll('#createTypeSpecificGrid [data-create-matrix-row]').forEach(function(row){var c=supply.cabins.find(function(c){return c.name===row.dataset.createMatrixRow;});if(!c)return;row.querySelectorAll('[data-create-matrix-field]').forEach(function(input){var key=editLabels[input.dataset.createMatrixField];if(key)c.fields[key]=String(S.number(input.value.replace(/[^\d.]/g,'')));});});
    supply.cabins.forEach(function(c,i){priceFields.filter(function(k){return c.fields[k]!=='不适用';}).forEach(function(k,j){result['cruise_'+i+'_'+j]='¥'+Number(c.fields[k]||0).toLocaleString('zh-CN');});});
    return result;
  }
  window.CaesarCruiseBatch={editConfig:editConfig,editedSchedule:editedSchedule,options:options,matrix:matrix,sync:sync,invalid:invalid,data:data,voyage:cloneVoyage,preview:preview,datesValid:datesValid};
})();
