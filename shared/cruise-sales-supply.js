/* Existing booking and schedule pages consume the same voyage supply and approved fares. */
(function(root){
 'use strict';
 const M=root.CaesarCruiseInventory,R=root.CaesarCruiseResources;
 const code=spec=>(String(spec).match(/\b(BA|BC|OV|IC|IR|SU)\b/)||[])[1]||String(spec).trim().split(/\s+/).at(-1);
 function context(input={}){
  const s=M.read(),p=M.products.find(p=>p.id===input.product)||M.products.find(p=>p.schedule===input.schedule)||(input.product?{id:input.product,name:'产品待关联',origin:''}:M.products[0]);
  const date=input.date||String(input.schedule||'').replace(/^CZ(\d{4})(\d{2})(\d{2}).*$/,'$1-$2-$3');
  const v=input.voyage?s.voyages.find(v=>v.id===input.voyage):s.voyages.find(v=>v.ship===(input.ship||'ideal')&&v.date===date);
  const channel=input.channel==='分销'?'B2B':input.channel==='同业'?'同业':'B2C',priceChannel=input.priceChannel||(input.channel==='分销'?'分销商净价':input.channel==='同业'?'B2B同业价':'B2C零售价');
  return {s,v,p,channel,priceChannel,origin:p.origin,product:p.id,stocks:v?s.stocks.filter(st=>st.voyage===v.id):[],linked:!!v&&v.products.includes(p.id)};
 }
 function cabin(c,spec){return c.stocks.find(st=>st.code===code(spec));}
 function name(st){const categories={BA:'阳台舱',BC:'阳台舱',OV:'海景',IC:'内舱',IR:'内舱',SU:'套房'};return (categories[st.code]||'舱型')+' '+st.code;}
 function rates(c,spec){const st=cabin(c,spec);if(!st||st.priceReady&&!st.priceReady[c.priceChannel])return null;const p=st.prices[c.priceChannel];if(!p)return null;
  const maximum=R?.ships.find(x=>x.id===c.v.ship)?.cabins.find(x=>x.code===st.code)?.maximum|| (st.code==='BC'?2:st.code==='SU'?3:4);
  return {...p,portTax:p.port,maximum,childNoBerth:p.childNoBerth,source:'航次价格',stock:st.id,priceChannel:c.priceChannel};
 }
 function allowance(c,spec){const st=cabin(c,spec);if(!st)return {physical:0,available:0,reason:'舱位待确认'};const a=M.availability(c.s,st,c);if(!c.linked)return {...a,available:0,reason:'该产品尚未关联航次'};if(!['预售','在售'].includes(c.v.status))return {...a,available:0,reason:'航次已停止销售'};return a;}
 function issues(c,rows){const errors=[];const totals={};rows.forEach(row=>totals[row.spec]=(totals[row.spec]||0)+Number(row.cabinCount));for(const [spec,n] of Object.entries(totals)){const a=allowance(c,spec),r=rates(c,spec);if(!r)errors.push(spec+'售价待确认');else if(r.currency!=='CNY')errors.push(spec+'为'+r.currency+'报价，请先确认本单人民币报价');if(n>a.available)errors.push(spec+'本次可申请'+a.available+'间（'+a.reason+'），可提交待确认');}return errors;}
 function stockRows(productId='BJ',ship='ideal'){
  const c=context({product:productId}),vs=c.s.voyages.filter(v=>v.ship===ship&&v.products.includes(c.p.id)&&['预售','在售','截止'].includes(v.status));
  return vs.map(v=>{const ss=c.s.stocks.filter(st=>st.voyage===v.id),available=ss.reduce((n,st)=>n+M.count(c.s,st).available,0),p=ss.find(st=>!st.priceReady||st.priceReady['B2C零售价'])?.prices['B2C零售价'];return [v.date,v.id,'航次余'+available+'间',p?.first||0,v.status==='截止'?'已关闭':v.status,'tag tag-blue'];});
 }
 function summary(c,rows){return '<div class="cruise-booking-note">'+M.esc(c.v?c.v.id+' · '+c.p.name+' · '+c.priceChannel:'尚未关联航次供给')+'</div><div class="table-wrap"><table><thead><tr><th>舱型</th><th>航次余量</th><th>本次可申请</th><th>限制依据</th><th>本单间数</th></tr></thead><tbody>'+rows.map(row=>{const a=allowance(c,row.spec);return '<tr><td>'+M.esc(row.spec)+'</td><td>'+a.physical+'间</td><td>'+a.available+'间</td><td>'+M.esc(a.reason)+'</td><td>'+Number(row.cabinCount)+'间</td></tr>';}).join('')+'</tbody></table></div>';}
 function hold(c,rows,order,customer,expires){const s=M.read(),live=context({voyage:c.v?.id,product:c.product,channel:c.channel==='B2B'?'分销':c.channel==='同业'?'同业':'直客',priceChannel:c.priceChannel});const errors=issues(live,rows);if(errors.length)throw Error(errors.join('；'));const at=new Date(expires).getTime();if(!Number.isFinite(at)||at<=Date.now()||at>Date.now()+s.rules.minutes*60000+60000)throw Error('请按当前锁位规则重新核对保舱到期时间');
  if(s.positions.some(p=>p.order===order))throw Error('该订单已有占用，请查看原记录');
  const positions=[];for(const row of rows){const st=s.stocks.find(st=>st.id===cabin(live,row.spec).id),a=M.availability(s,st,live);if(Number(row.cabinCount)>a.available)throw Error(row.spec+'当前可申请量已变化，请重新核对');const pos={id:'SD-'+(++s.serial),stock:st.id,quantity:Number(row.cabinCount),status:'临时锁定',kind:'临时锁位',order,customer,product:c.product,origin:c.origin,channel:c.channel,created:Date.now(),expires:at,demand:st.code,reason:'销售预订保舱',history:[{at:M.stamp(),text:'原销售预订 '+order+' 临时保舱'}]};s.positions.push(pos);positions.push(pos);s.logs.unshift({id:'JL-'+(++s.serial),at:M.stamp(),user:'当前用户',type:'库存锁定',object:st.id,text:order+' 临时保舱 '+pos.quantity+'间'});}
  M.write(s);return positions;
 }
 root.CaesarCruiseSalesSupply={context,code,cabin,name,rates,allowance,issues,stockRows,summary,hold};
})(typeof window==='undefined'?globalThis:window);
