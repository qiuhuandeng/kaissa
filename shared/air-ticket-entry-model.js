/* 票务资料录入原型：订座复核建草稿；PDF仅保留账单核对结果。 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./air-orders-model.js'):root.AirOrders);if(typeof module==='object'&&module.exports)module.exports=api;else root.AirTicketEntry=api;})(typeof window==='undefined'?globalThis:window,function(M){
'use strict';
const kinds=[['daily','BSP 日报导入'],['pdf','IATA PDF账单对账'],['pnr','PNR订座文本'],['image','截图识别录入'],['screen','白屏订座录入']];
const sample='PNR: QWERTY\n1.ZHANG/JIANGUO\n2.LI/MEI\n3.CA1333 Y 2026-11-05 PEKSYX HK2 0800\n4.CA1334 Y 2026-11-10 SYXPEK HK2 1300\nDOC 1|护照|DEMOPNR01|1985-06-15|2030-05-20|男|中国|张建国\nDOC 2|护照|DEMOPNR02|1990-03-12|2031-07-18|女|中国|李梅';
const copy=M.copy,id=p=>p+Date.now()+Math.random().toString(36).slice(2,6);
function parse(text){let pnr='';const people=[],legs=[],docs=[],notes=[];String(text||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean).forEach((s,i)=>{let m;if(m=s.match(/^PNR\s*[:：|]\s*([A-Z0-9]+)$/i))pnr=m[1].toUpperCase();else if(m=s.match(/^(\d+)\.\s*([A-Z]+)\/([A-Z ]+)$/i))people.push({no:m[1],name:m[2]+'/'+m[3],english:m[2]+'/'+m[3],docType:'护照',docNo:'',birth:'',expiry:'',nationality:''});else if(m=s.match(/^\d+\.\s*([A-Z0-9]{2}\d{3,4})\s+([A-Z])\s+(\d{4}-\d{2}-\d{2})\s+([A-Z]{3})([A-Z]{3})\s+HK\d+\s+(\d{2})(\d{2})$/i))legs.push({flight:m[1],bookingClass:m[2],date:m[3],from:m[4],to:m[5],time:m[6]+':'+m[7],cabin:['C','J'].includes(m[2])?'商务舱':m[2]==='F'?'头等舱':'经济舱'});else if(/^DOC \d+\|/.test(s))docs.push(s.slice(4).split('|'));else if(s.startsWith('PAX|')){const a=s.split('|');people.push({no:String(people.length+1),name:a[1],english:a[2]||'',docNo:a[3]||'',docType:'护照',birth:'',expiry:'',nationality:''});}else if(s.startsWith('SEG|')){const a=s.split('|');legs.push({flight:a[1],date:a[2],from:a[3],to:a[4],time:'',cabin:'经济舱'});}else notes.push('第'+(i+1)+'行未识别，可在下方补充');});
 docs.forEach(d=>{const p=people.find(p=>p.no===d[0]);if(p)Object.assign(p,{docType:d[1],docNo:d[2],birth:d[3],expiry:d[4],nationality:d[6],name:d[7]||p.name});else notes.push('证件资料 '+d[0]+' 未找到乘客');});
 if(!pnr)notes.push('订座编号待补');if(!people.length)notes.push('乘客名单待补');if(!legs.length)notes.push('航段待补');return {pnr,people,legs,notes};
}
function draft(data,source,values,kind){const signature=[source.pnr,source.people.map(p=>[p.name,p.docNo].join(':')).sort().join('|'),source.legs.map(l=>[l.flight,l.date,l.from,l.to].join(':')).join('|')].join('#');const old=data.orders.find(o=>o.ticketEntrySignature===signature);if(old)return{order:old,existing:true};const o=M.blank();Object.assign(o,{id:id('HFIM'),type:'BSP散票',customer:values.customer||'华远科技有限公司',customerType:'企业',bookingPnr:source.pnr,currency:values.currency||'CNY',sale:values.sale===''?'':Number(values.sale),fare:values.fare===''?'':Number(values.fare),tax:values.tax===''?'':Number(values.tax),cost:values.cost===''?'':Number(values.cost),supplier:values.supplier||'中国国际航空',carrier:values.carrier||'中国国际航空',priceBasis:values.basis||'订座资料复核后填写',ticketEntrySignature:signature,ticketEntryKind:kind,state:'草稿'});
 o.people=source.people.map((p,i)=>({...M.person('P'+(i+1),p.name),...copy(p),id:'P'+(i+1)}));o.legs=source.legs.map((l,i)=>({...M.leg('L'+(i+1),l.from,l.to,l.date,l.flight),...copy(l),id:'L'+(i+1)}));M.syncTickets(o);M.log(o,'通过'+kinds.find(k=>k[0]===kind)?.[1]+'建立草稿','superadmin');data.orders.unshift(o);return{order:o,existing:false};
}
function statementRows(data){const txs=(data.transactions||[]).filter(t=>t.row?.ticket).slice(0,2);return [0,1,2].map(i=>{const t=txs[i],cost=t&&Number.isFinite(Number(t.row.cost))?Number(t.row.cost):1380;return {ticket:t?.row.ticket||'999900000000'+i,name:t?.row.name||['张建国','李梅','赵明'][i],fare:Math.max(0,cost-180),tax:180,amount:cost+(i===1?50:0),order:t?.order||'',note:i===1?'账单与原记录金额不同':''};});}
function compare(data,rows,meta={}){return rows.map(r=>{
 const hasAmount=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
 const tx=(data.transactions||[]).find(t=>M.ticketNo(t.row?.ticket)===M.ticketNo(r.ticket)),order=data.orders?.find(o=>o.id===tx?.order);
 const currency=meta.currency||r.currency||'CNY',systemCurrency=tx?.row?.currency||tx?.currency||order?.currency||'';
 const cost=tx&&hasAmount(tx.row.cost)?Number(tx.row.cost):null;
 const comparable=cost!==null&&systemCurrency===currency,delta=comparable&&hasAmount(r.amount)?M.money(Number(r.amount)-cost):null;
 return {...copy(r),order:tx?.order||r.order,currency,systemCurrency,systemCost:cost,delta,result:cost===null?'待匹配':!systemCurrency?'币种待核':systemCurrency!==currency?'币种不一致':delta===null?'金额待核':delta===0?'金额一致':'金额差异'};
});}
function statementCounts(rows){return {same:rows.filter(r=>r.result==='金额一致').length,different:rows.filter(r=>r.result==='金额差异').length,unmatched:rows.filter(r=>r.result==='待匹配').length,pending:rows.filter(r=>!['金额一致','金额差异','待匹配'].includes(r.result)).length};}
function statementRecord(data,record){return record.version===2?copy(record):{...copy(record),rows:compare(data,record.rows,record.meta)};}
function orderEntry(o){const editable=['草稿','待确认'].includes(o.state);return {title:o.state==='草稿'?'已找到原草稿':'已找到原订单',label:editable?(o.state==='草稿'?'完善订单':'编辑订单'):'查看原订单',href:(editable?'air-order-edit.html':'air-order-detail.html')+'?id='+encodeURIComponent(o.id)};}
return {kinds,sample,parse,draft,statementRows,compare,statementCounts,statementRecord,orderEntry,id};
});
