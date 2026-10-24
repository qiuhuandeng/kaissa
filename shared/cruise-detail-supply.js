(function () {
  'use strict';
  var S=window.CaesarCruiseSupply,e=S.escape;
  function number(x){return Number(String(x||'').replace(/[^\d.]/g,''))||0;}
  function prepare(config, createRecord) {
    var shared=/^CZ20261112/.test(new URLSearchParams(location.search).get('scheduleNo')||'');
    config.cruiseSharedExample=shared;
    if(shared){
      config.summary=Object.assign({},config.summary,{code:new URLSearchParams(location.search).get('scheduleNo'),depart:'2026-11-12',back:'2026-11-19',stock:24,sold:3,locked:4,available:17,route:'地中海西线8天',price:'¥28,800'});
      config.inventoryMatrix=[
        {name:'阳台 BA',rule:'标准2人／最多4人',total:'20间',sold:'2间',locked:'3间',price:'第1人¥28,800',childPrice:'儿童¥23,800',extraPrice:'第3人¥20,800／第4人¥18,800',shared:true,source:'MED-20261112 · 京沪共同使用',adultOccupancy:'4人',childOccupancy:'0人',childNoBerth:'0人'},
        {name:'阳台 BC',rule:'标准2人／最多2人',total:'4间',sold:'1间',locked:'1间',price:'第1人¥26,800',childPrice:'儿童¥23,800',source:'MED-20261112 · 本团独立分配',adultOccupancy:'2人',childOccupancy:'0人',childNoBerth:'0人'}
      ];
    }
    config.releaseBatches={};config.inventoryRows=[];
    config.inventoryMatrix.forEach(function(row,i){
      row.cruiseInitialLocked=number(row.locked);row.cruiseInitialSold=number(row.sold);
      if(!row.cruiseInitialLocked)return;
      var id='CB-'+(shared?'20261112':'20240801')+'-'+(i+1);
      var record=createRecord('DD-'+id,'ZY-'+id,shared&&row.shared?'上海团／携程':'门店','间',row.cruiseInitialLocked,row.name+'临时锁舱');
      record.remaining=row.cruiseInitialLocked;record.released=0;
      config.releaseBatches[id]={inventoryNo:id,name:row.name+'临时锁舱',cabin:row.name,rule:row.shared?'释放后回到京沪共同余量；已售间数、采购量和房号不变。':'只释放本笔临时锁定；已售间数和采购量不变。',records:[record],transactions:[]};
      config.inventoryRows.push([id,row.name+(row.shared?' · 上海团':' · 本团'),row.cruiseInitialLocked+'间',record.channel,(shared?'11-01':'07-20')+' 10:00 → 10:30（演示）','锁舱中','tag tag-orange','release']);
    });
    config.inventoryHeads=['锁舱单号','舱型／使用团期','锁定间数','渠道／联系人','锁舱／到期时间'];
    recompute(config);
  }
  function recompute(config, scheduleData) {
    var sum={stock:0,sold:0,locked:0,available:0};
    config.inventoryMatrix.forEach(function(row){
      var batch=Object.values(config.releaseBatches).find(function(b){return b.cabin===row.name;});
      var locked=batch?batch.records.reduce(function(n,r){return n+r.remaining;},0):row.cruiseInitialLocked;
      var total=number(row.total),sold=row.cruiseInitialSold,available=Math.max(0,total-sold-locked);
      row.locked=locked+'间';row.sold=sold+'间';row.available=available+'间';
      sum.stock+=total;sum.sold+=sold;sum.locked+=locked;sum.available+=available;
    });
    Object.assign(config.summary,sum);if(scheduleData)Object.assign(scheduleData,sum);
  }
  function renderMatrix(config) {
    var heads=['舱型／入住','使用来源','舱房数','已售','锁定','当前可售','成人占位','儿童占位','儿童不占位','第3／4人','每人票价／税费'];
    var html='<div class="cruise-inventory-table"><table><colgroup><col style="width:160px"><col><col style="width:75px"><col style="width:65px"><col style="width:65px"><col style="width:85px"><col style="width:80px"><col style="width:80px"><col style="width:85px"><col style="width:80px"><col style="width:240px"></colgroup><thead><tr>'+heads.map(function(t){return '<th>'+t+'</th>';}).join('')+'</tr></thead><tbody>'+config.inventoryMatrix.map(function(r){var n=number(r.available);return '<tr><td><strong>'+e(r.name)+'</strong><div class="text-muted">'+e(r.rule)+'</div></td><td>'+e(r.source||'本航次独立分配')+'</td><td>'+e(r.total)+'</td><td>'+e(r.sold)+'</td><td>'+e(r.locked)+'</td><td><span class="tag '+(n===0?'tag-gray':n<=3?'tag-orange':'tag-blue')+'">'+e(r.available)+'</span>'+(r.shared?'<div class="text-muted">各团共同余量</div>':'')+'</td><td>'+e(r.adultOccupancy||'0人')+'</td><td>'+e(r.childOccupancy||'0人')+'</td><td>'+e(r.childNoBerth||'0人')+'</td><td>'+e(r.thirdFourth||'0人')+'</td><td>'+e(r.price)+'<details><summary>价格明细</summary><div>'+e(r.childPrice||'儿童按规则')+'</div><div>'+e(r.childNoBerthPrice||'')+'</div><div>'+e(r.extraPrice||'按入住人数计价')+'</div><div>'+e((r.priceLines||[]).filter(function(line){return /单房/.test(line);}).join(' / '))+'</div><div>第2人同基础价；'+(config.cruiseSharedExample?'港务税¥1,800／服务费¥600／燃油费¥0（另收示例）':'港务税¥1,850；服务费、燃油费待船方确认')+'</div></details></td></tr>';}).join('')+'</tbody></table></div>';
    if(config.cruiseSharedExample){var ba=config.inventoryMatrix[0];html+='<p class="cruise-supply-note">船方航次 MED-20261112：BA共20间，北京团已售2间，上海团锁定'+e(ba.locked)+'，共余'+e(ba.available)+'；BC独立分配4间。共同余量不按团期重复相加。</p>';}
    document.getElementById('inventoryMatrix').innerHTML=html;
  }
  window.CaesarCruiseDetail={prepare:prepare,recompute:recompute,renderMatrix:renderMatrix};
})();
