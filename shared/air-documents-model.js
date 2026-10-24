/* 确认单、客票原件及我方费用资料；仅保存当前标签页的原型资料。 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./air-orders-model.js'):root.AirOrders);if(typeof module==='object'&&module.exports)module.exports=api;else root.AirDocuments=api;})(typeof window==='undefined'?globalThis:window,function(M){
'use strict';
const key='caesar-air-documents-v1',copy=x=>JSON.parse(JSON.stringify(x)),round=n=>Math.round(Number(n)*100)/100;
const id=p=>p+Date.now()+Math.random().toString(36).slice(2,7),unique=a=>[...new Set(a.filter(Boolean))];
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function load(){try{const d=JSON.parse(sessionStorage.getItem(key));if(d?.confirmations&&d?.documents)return d;}catch(_){}return {confirmations:[],documents:[]};}
function save(d){try{sessionStorage.setItem(key,JSON.stringify(d));}catch(_){throw Error('浏览器空间不足，资料未保存；请减少文件大小后重试');}}
function catalog(o,B,bd){const rows=o.tickets.map(t=>{const x=B&&bd?B.currentTicket(bd,o,t):t,original=o.people.find(p=>p.id===t.personId),p=B&&bd?B.currentPerson(bd,o,original):original,l=o.legs.find(l=>l.id===t.legId);return {...x,key:t.personId+'|'+t.legId,name:p?.name||'',sourceOrder:p?.sourceOrder||'',flight:x.changedFlight||l?.flight,from:x.changedFrom||l?.from,to:x.changedTo||l?.to,date:x.changedDate||l?.date};});
 if(B&&bd)for(const r of B.additionRecords(bd,o).filter(r=>r.state==='成功'))rows.push({personId:r.person.id,legId:r.leg.id,key:r.person.id+'|'+r.leg.id,name:r.person.name,ticket:r.ticket,state:'已出票',sourceOrder:r.person.sourceOrder||'',...r.leg});
 return rows;
}
function owners(o,refs){const sources=unique([...(o.sourceOrders||[]),o.sourceOrder,...o.people.map(p=>p.sourceOrder)]),out=[];let ambiguous=false;
 for(const r of refs){const source=r.sourceOrder||o.people.find(p=>p.id===r.personId)?.sourceOrder||(sources.length===1?sources[0]:'');if(source)out.push(source);else if(sources.length)ambiguous=true;}
 return {sources:unique(out),ambiguous,mixed:unique(out).length>1,self:!sources.length};
}
function sampleFile(title,lines){const svg='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="900" height="600" fill="#fff"/><text x="45" y="65" font-size="26" fill="#163558">'+E(title)+'</text><text x="45" y="105" font-size="17" fill="#68788a">预置演示资料 · 非航司原件 · 不可报销</text>'+lines.slice(0,10).map((s,i)=>'<text x="45" y="'+(155+i*36)+'" font-size="17" fill="#26364a">'+E(s)+'</text>').join('')+'</svg>';return {name:title+'-演示.svg',type:'image/svg+xml',data:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg),hash:'demo:'+svg,demo:true};}
function ensureExamples(data){if(data.confirmationDemoVersion)return;data.confirmationDemoVersion=1;
 for(let i=1;i<=2;i++){const oid='HF20261024QR0'+i;if(data.orders.some(o=>o.id===oid))continue;const o=M.blank();Object.assign(o,{id:oid,customerType:'企业',customer:'华远科技有限公司',source:'第三方票代',supplier:'北京环球票务',account:'工商银行 6688',sale:i===1?3000:1500,fare:i===1?2400:1200,tax:i===1?360:180,service:i===1?100:50,cost:i===1?2760:1380,priceBasis:'外采确认单业务演示',supplierConfirmed:true,state:'已出票',people:Array.from({length:i===1?2:1},(_,j)=>M.person('QR'+i+j,j?'李梅':'张建国')),legs:[M.leg('L1','PEK','SHA','2026-11-21','CA1501')],roster:{sourceVersion:1,claimed:1,accepted:1,pending:null}});M.syncTickets(o);o.tickets.forEach((t,j)=>Object.assign(t,{state:'已出票',ticket:'99982410000'+i+j,pnr:'QRDE0'+i,airlineNo:'QR-DEMO-'+i}));M.log(o,'预置外采汇款演示订单；已有收入及出票，采购付款尚未办理','superadmin');data.orders.push(o);}
}
function paymentRoute(o){return o.seat||o.type==='包机票'?'原机位或协议付款':o.source==='第三方票代'?'供应商汇款':o.source==='BSP'?'BSP账期对账':o.source==='航司平台'?'平台扣款核对':'采购渠道待核';}
function confirmationDraft(orders,B,bd){const o=orders.find(o=>o.source==='第三方票代'&&o.tickets.some(t=>t.state==='已出票'))||orders.find(o=>o.tickets.some(t=>t.state==='已出票'))||orders[0],ts=catalog(o,B,bd).filter(t=>t.ticket&&t.state==='已出票'),tickets=unique(ts.map(t=>t.ticket)).slice(0,2);
 const rows=tickets.map(ticket=>{const rs=ts.filter(t=>t.ticket===ticket),t=rs[0];return {id:id('R'),ticket,name:t.name,pnr:t.pnr||o.bookingPnr,flight:rs.map(t=>t.flight).join('/'),from:t.from,to:rs.at(-1).to,date:t.date,amount:1380,orderId:o.id,confidence:'价格待核',verified:true};});
 return {id:id('HFQR'),number:'QR-DEMO-'+String(Date.now()).slice(-6),company:o.company,supplier:o.supplier,currency:o.currency,files:[sampleFile('供应商确认单',[o.supplier,...rows.map(r=>r.name+' · '+r.ticket+' · '+r.flight+' · '+r.amount)])],rows,recognition:'预置识别结果（演示）',state:'待复核',created:new Date().toISOString(),history:[]};
}
function rowIssues(c,r,orders,B,bd){const issues=[],o=orders.find(o=>o.id===r.orderId);
 if(!/^\d{13}$/.test(M.ticketNo(r.ticket)))issues.push('票号待补');
 if(!r.name||!r.flight||!r.date)issues.push('乘客或航段待补');
 if(r.amount===''||r.amount==null||!Number.isFinite(Number(r.amount))||Number(r.amount)<0)issues.push('采购金额待核');
 if(!r.verified)issues.push('待人工复核');
 if(!o)issues.push('订单待匹配');else{
  if(o.company!==c.company||o.currency!==c.currency||o.supplier!==c.supplier)issues.push('订单公司、供应商或币种不一致');
  const ts=catalog(o,B,bd).filter(t=>M.ticketNo(t.ticket)===M.ticketNo(r.ticket));
  if(!ts.length||!ts.some(t=>t.name===r.name))issues.push('票号或乘客与订单不符');
 }
 if(!String(c.number||'').trim()||!String(c.supplier||'').trim())issues.push('确认单号或供应商待补');
 return unique(issues);
}
function confirm(db,c,orders,B,bd){const old=db.confirmations.find(x=>x.id===c.id);
 const duplicate=db.confirmations.find(x=>x.id!==c.id&&((x.company===c.company&&x.supplier===c.supplier&&x.number===c.number)||c.files.some(f=>!f.demo&&x.files.some(y=>y.hash===f.hash))));
 if(duplicate)return {record:duplicate,duplicate:true};
 c=copy(c);if(old?.rows.some(r=>r.confirmed)){for(const k of ['company','supplier','currency','number','files','recognition'])c[k]=copy(old[k]);for(const r of old.rows.filter(r=>r.confirmed))if(!c.rows.some(x=>x.id===r.id))c.rows.push(copy(r));}c.rows=c.rows.map(r=>{const prev=old?.rows.find(x=>x.id===r.id&&x.confirmed);if(prev)return copy(prev);const issues=rowIssues(c,r,orders,B,bd),ticket=M.ticketNo(r.ticket);
  if(db.confirmations.some(x=>x.id!==c.id&&x.rows.some(y=>y.confirmed&&M.ticketNo(y.ticket)===ticket))||c.rows.some(y=>y!==r&&M.ticketNo(y.ticket)===ticket&&c.rows.indexOf(y)<c.rows.indexOf(r)))issues.push('此票已有采购依据，请核原确认单，勿重复采购');
  return {...r,ticket,issues,paymentRoute:paymentRoute(orders.find(o=>o.id===r.orderId)||{}),confirmed:!issues.length};});
 const n=c.rows.filter(r=>r.confirmed).length;c.state=n===c.rows.length&&n?'已复核':n?'部分复核':'待补资料';c.total=round(c.rows.filter(r=>r.confirmed).reduce((s,r)=>s+Number(r.amount),0));
 c.history.unshift({time:new Date().toLocaleString('zh-CN'),text:'人工核对：'+n+'条已复核，'+(c.rows.length-n)+'条待补；未登记付款'});
 if(old)db.confirmations.splice(db.confirmations.indexOf(old),1,c);else db.confirmations.unshift(c);return {record:c,duplicate:false};
}
function syncSources(db,fd){const groups=new Map();for(const raw of db.confirmations){const c=copy(raw);c.rows=c.rows.filter(r=>r.confirmed&&r.paymentRoute==='供应商汇款'&&!fd.sources.some(s=>!s.confirmationGroup&&s.orderId===r.orderId));if(!c.rows.length)continue;c.total=round(c.rows.reduce((n,r)=>n+Number(r.amount),0));const k=[c.company,c.supplier,c.currency].join('|');if(!groups.has(k))groups.set(k,[]);groups.get(k).push(c);}
 for(const [k,cs] of groups){let s=fd.sources.find(s=>s.confirmationGroup===k);if(!s){s={id:id('SFQR'),confirmationGroup:k,company:cs[0].company,currency:cs[0].currency,type:'第三方票代',supplier:cs[0].supplier,terms:'随结',agreement:'供应商确认单',node:'已复核采购款',paid:0,account:'待财务核对',approved:false,date:new Date().toISOString().slice(0,10),invoice:'成本凭证待补',invoiceRequired:false,checked:true,platform:'',history:[]};fd.sources.unshift(s);}
  s.confirmations=cs.map(c=>({id:c.id,number:c.number,total:c.total,orderIds:unique(c.rows.filter(r=>r.confirmed).map(r=>r.orderId))}));s.total=round(cs.reduce((n,c)=>n+c.total,0));
 }return fd;
}
function storeDocument(db,o,d,available){const refs=d.refs.map(k=>available.find(r=>r.key===k&&r.ticket&&r.state==='已出票')).filter(Boolean);if(!refs.length)throw Error('尚无可交付客票；请先保存出票结果');
 const own=owners(o,refs),previous=d.previous?db.documents.find(x=>x.id===d.previous&&x.orderId===o.id):null;
 // A replacement may change files, but cannot switch to another customer's audience.
 if(previous?.replacedBy)throw Error('该资料已有新版本，请选择最新版本');
 if(previous&&JSON.stringify([...previous.recipients].sort())!==JSON.stringify([...own.sources].sort()))throw Error('新版本的来源订单与原版本不同，请另存一份资料');
 const result={id:id('HFWD'),orderId:o.id,kind:d.kind||'航司行程资料',refs:copy(refs),files:copy(d.files),recipients:own.sources,self:own.self,state:own.ambiguous||own.mixed?'待拆分核对':'已交付',created:new Date().toISOString(),version:previous?previous.version+1:1,series:previous?.series||id('FILE'),previous:previous?.id||'',note:d.note||'原始文件留存'};
 if(previous&&result.state==='已交付')previous.replacedBy=result.id;
 db.documents.unshift(result);return result;
}
function forSource(db,source){return db.documents.filter(d=>d.state==='已交付'&&d.recipients.includes(source));}
function prices(o,B,bd){const sale=o.sale===''||o.sale==null?null:Number(o.sale),tax=o.tax===''||o.tax==null?null:Number(o.tax),service=Number(o.service||0),deltas=B&&bd?bd.changes.filter(c=>c.orderId===o.id&&c.effective).map(c=>({id:c.id,label:c.type,amount:Number(c.saleDelta)||0})):[];
 const lines=sale===null?[]:tax!==null&&tax>=0&&tax<=sale?[{label:'票款（不含税费）',amount:round(sale-tax)},{label:'税费',amount:tax}]:[{label:'含税票款报价（税费待拆分）',amount:sale}];
 lines.push({label:'服务费',amount:service});lines.push(...deltas.map(c=>({label:c.label+' · '+c.id,amount:c.amount})));
 if(o.cancellation){if(o.cancellation.state!=='已确认')return {lines,total:null,note:'取消费用待定损，不能形成确定合计'};return {lines:[{label:'取消最终费用',amount:Number(o.cancellation.sale)}],total:Number(o.cancellation.sale),note:'引用原取消结果，原报价与服务费见原订单'};}
 return {lines,total:sale===null?null:round(sale+service+deltas.reduce((n,c)=>n+c.amount,0)),note:tax===null?'票款按订单销售价，不以采购票面价推算报价':'税费引用原订单，票款加税费等于本单销售价'};
}
function customerHTML(o,kind,p){return '<!doctype html><html lang="zh-CN"><meta charset="UTF-8"><title>'+E(kind+' '+o.id)+'</title><style>body{font:16px/1.7 system-ui;margin:42px;color:#24354b}h1{font-size:24px}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #ddd;padding:12px;text-align:left}td:last-child{text-align:right}.note{color:#68788a;font-size:13px}@media print{button{display:none}}</style><h1>'+E(kind)+'</h1><p>'+E(o.company)+'<br>订单：'+E(o.id)+'<br>结算客户：'+E(o.customer)+'<br>币种：'+E(o.currency)+'</p><table><thead><tr><th>费用项目</th><th>金额</th></tr></thead><tbody>'+p.lines.map(l=>'<tr><td>'+E(l.label)+'</td><td>'+Number(l.amount).toFixed(2)+'</td></tr>').join('')+'<tr><th>合计</th><td>'+ (p.total===null?'待确认':p.total.toFixed(2))+'</td></tr></tbody></table><p class="note">'+E(p.note)+'。本资料为我方费用说明，不是航司行程单、发票或报销凭证。报价调整请回原订单办理。</p><p class="note">生成时间：'+E(new Date().toLocaleString('zh-CN'))+'</p></html>';}
return {key,load,save,copy,id,unique,E,catalog,owners,sampleFile,ensureExamples,paymentRoute,confirmationDraft,rowIssues,confirm,syncSources,storeDocument,forSource,prices,customerHTML};
});
