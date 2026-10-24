(function(){
 'use strict';const R=window.CaesarCruiseSalesRules,e=R.escape;
 function prepare(product){
  const item=product.schedules[0];item.cruiseCabins=['内舱 IC','海景 OV','阳台 BA','套房 SU'].map((name,i)=>({name,quota:[6,4,6,2][i],mode:'供应商配额'}));
  item.priceItems=item.priceItems.flatMap((p,i)=>['第1人','第2人','第3人','第4人','儿童','单人附加费'].map((label,j)=>({cabin:item.cruiseCabins[i].name,name:item.cruiseCabins[i].name+' · '+label,settlement:j===5?6000:p.settlement-[0,0,3000,4000,2000][j],public:j===5?8000:p.public-[0,0,3000,4000,2000][j],sale:j===5?8800:p.sale-[0,0,3000,4000,2000][j]})));
  item.priceItems.push(...[['港务税',1800],['服务费',600],['燃油费',0]].map(([name,value])=>({name:name+'／人',settlement:value,public:value,sale:value,tax:true})));item.feeMode='另收';
  const request=R.clone(item);Object.assign(request,{no:'AGY-CR-20261126-002',depart:'2026-11-26',back:'2026-12-03',deadline:'2026-11-10',quota:0,priceStatus:'待提交',confirm:'逐单询位',confirmNo:'每单以供应商回复为准',orders:[],logs:[['2026-10-23 10:00','代理安排按单询位，无固定舱房配额。']]});request.cruiseCabins.forEach(c=>{c.mode='逐单询位';c.quota=0;});product.schedules.push(request);
 }
 function info(item){return '<div class="cruise-agency-info"><p class="cruise-booking-note">船方航次 '+e(item.depart)+' · 税费'+e(item.feeMode)+' · 按人报价、按间核舱</p><div class="table-wrap"><table><thead><tr><th>舱型</th><th>供应方式</th><th>可用舱房</th></tr></thead><tbody>'+item.cruiseCabins.map(c=>'<tr><td>'+e(c.name)+'</td><td>'+e(c.mode)+'</td><td>'+e(c.mode==='逐单询位'?'待供应商逐单回复':c.quota+'间')+'</td></tr>').join('')+'</tbody></table></div></div>';}
 function open(item){
  const target=document.getElementById('schedulePriceSummary');target.insertAdjacentHTML('afterend','<div id="cruiseAgencyInfo">'+info(item)+'<div class="form-grid"><div class="form-group"><label class="form-label">查看舱型</label><select class="form-control" id="cruiseAgencyCabin">'+item.cruiseCabins.map(c=>'<option>'+e(c.name)+'</option>').join('')+'</select></div><div class="form-group"><label class="form-label">港务税／服务费／燃油费</label><select id="cruiseAgencyFeeMode" class="form-control"><option>另收</option><option>已含</option></select></div></div></div>');
  document.getElementById('cruiseAgencyFeeMode').value=item.feeMode;
  function filter(){const selected=document.getElementById('cruiseAgencyCabin').value;document.querySelectorAll('#schedulePriceMatrixRows tr').forEach((tr,i)=>{tr.hidden=!!item.priceItems[i].cabin&&item.priceItems[i].cabin!==selected;});}
  document.getElementById('cruiseAgencyCabin').onchange=filter;filter();
 }
 window.CaesarCruiseAgencyPrices={prepare,info,open};
})();
