(function () {
  'use strict';
  var S=window.CaesarCruiseSupply,e=S.escape;
  function $(id){return document.getElementById(id);}
  function voyageRows(){var M=window.CaesarCruiseInventory,s=M.read();return s.voyages.filter(v=>v.ship==='ideal'&&['预售','在售'].includes(v.status)&&s.stocks.some(st=>st.voyage===v.id)).map(v=>{var ba=s.stocks.find(st=>st.voyage===v.id&&st.code==='BA'),bc=s.stocks.find(st=>st.voyage===v.id&&st.code==='BC'),n=ba?M.count(s,ba):{total:0,sold:0,hold:0,booked:0,assigned:0};return {...v,depart:v.date,shared:n.total,sold:n.sold+n.assigned,locked:n.hold+n.booked,independent:bc?M.count(s,bc).available:0};});}
  function voyage(){return voyageRows().find(v=>v.id===$('batchTrafficResource').value)||voyageRows()[0];}
  function options(){return voyageRows().map(v=>({value:v.id,label:'理想号 '+v.id+' · '+v.depart,depart:v.depart,back:v.back,qty:v.shared-v.sold-v.locked+v.independent,unit:'间'}));}
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
    var A=window.CaesarCruiseSalesSupply,c=A.context({voyage:v.id,product:'BJ'});
    rows().forEach(function(row,i){var use=row.querySelector('[data-cruise-use]');
      // A cabin code always references its own procurement quantity.
      use.value=i?'independent':'shared';use.disabled=true;
      var free=A.allowance(c,i?'BC':'BA').available,qty=row.querySelector('[data-batch-matrix-field="间数"]');
      if(reset)qty.value=free;
      qty.max=free;capacity+=Number(qty.value)||0;
      row.dataset.cruiseAvailable=free;
      var rate=A.rates(c,i?'BC':'BA'),keys={'第1人':'first','第2人':'second','第3人':'third','第4人':'fourth','儿童价':'child','单人附加费':'single','港务税':'port','服务费':'service','燃油费':'fuel','税费方式':'feeMode'};
      Object.entries(keys).forEach(([label,key])=>{var el=row.querySelector('[data-batch-matrix-field="'+label+'"]');if(!el)return;if(el.tagName==='SELECT'){el.value=rate?rate[key]:'另收';el.disabled=true;}else {el.value=rate?rate[key]:'';el.readOnly=true;el.placeholder='待定价';}});

      row.querySelector('[data-cruise-source-note]').innerHTML=e(v.id+' · 本使用方可申请'+free+'间；舱价采用航次已生效价格。')+' <a class="table-link" target="_top" href="../cruise/price-calendar.html?voyage='+encodeURIComponent(v.id)+'">维护航次价格</a>';
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
    var A=window.CaesarCruiseSalesSupply,c=A.context({voyage:supply.voyage.id}),keys={'第1人':'first','第2人':'second','第3人':'third','第4人':'fourth','儿童价':'child','单人附加费':'single','港务税':'port','服务费':'service','燃油费':'fuel','税费方式':'feeMode'};
    if(c.v){supply.cabins.forEach(cabin=>{var p=A.rates(c,cabin.name);if(p)Object.entries(keys).forEach(([k,v])=>cabin.fields[k]=String(p[v]));});return supply;}
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
