/* Cruise procurement prototype: one browser session, shared with the existing approval center. */
(function (root) {
  'use strict';
  const KEY='caissa.cruise.purchase.v1';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const sum=(rows,key)=>rows.reduce((n,r)=>n+Number(r[key]||0),0);
  const money=n=>Number(n||0).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
  const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const types=['包船','切舱','保底切舱','散位代理'];
  const scopes=['单航次采购','多航次打包','整季／整年框架'];
  const states={contracts:['草稿','待审批','已退回','待签订','已签订'],orders:['草稿','待审批','已退回','待执行','部分入库','已入库'],receipts:['待入库','异常待处理','待审核','已退回','已入库']};
  const pages={contracts:'procurement-contracts.html',orders:'procurement-orders.html',receipts:'procurement-receipts.html'};
  const matters={contracts:'邮轮采购合同',orders:'邮轮采购订单',receipts:'邮轮采购入库'};
  let memory;
  function now(){return new Date().toLocaleString('sv-SE',{timeZone:'Asia/Shanghai'});}
  function log(row,text){(row.history||(row.history=[])).push({at:now(),text,user:'当前用户'});}
  function uid(s,prefix){s.serial=(s.serial||100)+1;return prefix+'-'+s.serial;}
  function find(s,kind,id){const row=s[kind].find(r=>r.id===id);if(!row)throw Error('未找到对应单据');return row;}
  function total(lines){return lines.reduce((n,l)=>n+Number(l.quantity||0)*(Number(l.price||0)+Number(l.tax||0)+Number(l.fuel||0)+Number(l.other||0)),0);}
  function contractTotal(c){return total(c.lines)*(c.scope===scopes[2]?Number(c.maxVoyages||1):c.voyages.length);}
  function freshContract(){return {id:'',title:'地中海邮轮舱位采购',type:'切舱',company:'地中海邮轮',ship:'ideal',supplier:'地中海邮轮中国销售中心',scope:scopes[0],currency:'CNY',start:'2026-11-01',end:'2027-03-31',maxVoyages:10,
    voyages:[{date:'2026-11-26',back:'2026-12-03',port:'barcelona',endPort:'rome'}],lines:[{code:'BA',category:'阳台',quantity:15,price:20000,tax:1600,fuel:400,other:0}],
    payments:[{name:'大额定金',amount:66000,due:'2026-10-30'},{name:'尾款',amount:264000,due:'2026-11-12'}],settlement:'按船方确认舱位及费用账单核对，已付定金冲抵尾款。',
    penalties:[{days:45,rate:0},{days:30,rate:30},{days:14,rate:100}],upgrade:'同航次升舱须船方确认并补差；降舱不自动退差。',roster:'2026-11-12',guarantee:80,shortfall:60,guaranteeRule:'未达保底间数 × 每间船票成本 × 补差比例，最终以双方结算为准。',attachments:[{name:'船方采购合同（示例）.pdf',example:true}],status:'草稿',history:[]};}
  function source(s,r){return find(s,r.sourceKind,r.sourceId);}
  function contractFor(s,r,kind){return kind==='contracts'?r:kind==='orders'?find(s,'contracts',r.contractId):r.sourceKind==='contracts'?source(s,r):find(s,'contracts',source(s,r).contractId);}
  function receiptUse(s,r){const c=contractFor(s,r,'receipts'),o=r.sourceKind==='orders'?source(s,r):null;return {dedicated:c.type==='散位代理',salesOrder:r.salesOrder||o?.salesOrder||'',label:c.type==='散位代理'?'指定订单订舱':'公共可售配额'};}
  function ensureReceipts(s,kind,id){
    const obj=find(s,kind,id),c=contractFor(s,obj,kind);
    if(kind==='contracts'&&(c.scope===scopes[2]||c.type==='散位代理'||c.status!=='已签订'))return;
    const voyages=kind==='contracts'?c.voyages:[obj.voyage];
    voyages.forEach(v=>{
      const related=s.receipts.filter(r=>r.sourceKind===kind&&r.sourceId===id&&r.voyage.date===v.date);
      if(related.some(r=>r.status!=='已入库'))return;
      const lines=(kind==='contracts'?c.lines:obj.lines).map(l=>{const received=related.reduce((n,r)=>n+sum(r.lines.filter(x=>x.code===l.code),'accepted'),0);const remaining=Math.max(0,Number(l.quantity)-received);return {...clone(l),quantity:remaining,received:remaining,receivedCode:l.code,accepted:0};}).filter(l=>l.quantity>0);
      if(!lines.length)return;
      const receipt={id:uid(s,'RK-YL'),sourceKind:kind,sourceId:id,contractId:c.id,voyage:clone(v),lines,status:'待入库',supplierRef:'船方舱位确认单（示例）',resolution:'',history:[]};log(receipt,'采购已确定，等待舱位核对');s.receipts.unshift(receipt);
    });
  }
  function request(s,kind,row){
    row.status=kind==='receipts'?'待审核':'待审批';
    row.approvalNo=uid(s,'APR-YL');
    s.approvals.push({id:row.approvalNo,kind,sourceId:row.id,status:'待审批',submitted:now(),opinion:'',review:clone(row)});log(row,'提交'+matters[kind]+'审批');
  }
  function seed(){
    const s={version:1,serial:100,contracts:[],orders:[],receipts:[],approvals:[],pools:[],voyages:[]};
    const c1={...freshContract(),id:'HT-YL-001',title:'地中海冬季框架协议',scope:scopes[2],status:'已签订'};
    const c2={...freshContract(),id:'HT-YL-002',title:'日韩线10航次×15间',ship:'glory',type:'保底切舱',scope:scopes[1],status:'已签订',voyages:Array.from({length:10},(_,i)=>{let d=new Date('2026-11-12T00:00:00Z');d.setUTCDate(d.getUTCDate()+7*i);let b=new Date(d);b.setUTCDate(b.getUTCDate()+6);return {date:d.toISOString().slice(0,10),back:b.toISOString().slice(0,10),port:'shanghai',endPort:'shanghai'};})};
    const c3={...freshContract(),id:'HT-YL-003',title:'地中海西线已采购舱位',status:'已签订',voyages:[{date:'2026-11-12',back:'2026-11-19',port:'barcelona',endPort:'rome'}],lines:[{code:'BA',category:'阳台',quantity:20,price:22000,tax:0,fuel:0,other:0},{code:'BC',category:'阳台',quantity:6,price:20000,tax:0,fuel:0,other:0}]};
    const c4={...freshContract(),id:'HT-YL-004',title:'暑期整船采购（示例）',type:'包船',lines:[{code:'IC',category:'内舱',quantity:300,price:12000,tax:1600,fuel:400,other:0},{code:'OV',category:'海景',quantity:200,price:15000,tax:1600,fuel:400,other:0},{code:'BA',category:'阳台',quantity:500,price:20000,tax:1600,fuel:400,other:0},{code:'SU',category:'套房',quantity:60,price:40000,tax:1600,fuel:400,other:0}]};
    const c5={...freshContract(),id:'HT-YL-005',title:'春节保底切舱采购',type:'保底切舱'};
    const c6={...freshContract(),id:'HT-YL-006',title:'歌诗达散位代理协议',type:'散位代理',company:'歌诗达邮轮',ship:'venice',supplier:'歌诗达邮轮华东销售部',scope:scopes[2],status:'已签订'};
    s.contracts=[c1,c2,c3,c4,c5,c6];s.contracts.forEach(c=>log(c,'合同资料示例'));request(s,'contracts',c5);
    const o1={id:'PO-YL-001',contractId:c1.id,voyage:{date:'2026-12-03',back:'2026-12-10',port:'barcelona',endPort:'rome'},lines:clone(c1.lines),status:'待执行',supplierRef:'MSC-DEC03-15',salesOrder:'',history:[],changes:[]};log(o1,'采购订单已通过，等待船方舱位入库');
    const o2={...clone(o1),id:'PO-YL-002',voyage:{...o1.voyage,date:'2026-12-10',back:'2026-12-17'},history:[]};s.orders=[o1,o2];request(s,'orders',o2);ensureReceipts(s,'orders',o1.id);ensureReceipts(s,'contracts',c2.id);
    const exception=s.receipts.find(r=>r.sourceId===c2.id);exception.lines[0].received=13;exception.lines[0].receivedCode='OV';exception.status='异常待处理';log(exception,'船方确认13间海景，与采购15间阳台不符');
    s.receipts.unshift({id:'RK-YL-003',sourceKind:'contracts',sourceId:c3.id,contractId:c3.id,voyage:clone(c3.voyages[0]),lines:c3.lines.map(l=>({...l,received:l.quantity,receivedCode:l.code,accepted:l.quantity})),status:'已入库',supplierRef:'MSC-MED-1112',resolution:'',legacyNo:'CRU-BLK-20261112-005',poolIds:[],history:[{at:'2026-10-23 10:00',user:'邮轮采购',text:'已入库；原共同使用与独立分配记录保留'}]});
    return s;
  }
  function read(){try{const data=JSON.parse(root.sessionStorage.getItem(KEY));if(data&&data.version===1)return data;}catch(e){}if(!memory)memory=seed();return clone(memory);}
  function write(s){memory=clone(s);try{root.sessionStorage.setItem(KEY,JSON.stringify(s));}catch(e){}return s;}
  function edit(kind,data,submit){
    const s=read();let row=data.id?s[kind].find(r=>r.id===data.id):null;
    if(row&&!['草稿','已退回'].includes(row.status))throw Error('当前状态不能编辑，请查看原单');
    if(!row){row={id:uid(s,kind==='contracts'?'HT-YL':'PO-YL'),history:[],status:'草稿'};s[kind].unshift(row);}
    const history=row.history, id=row.id;Object.assign(row,clone(data),{id,history,status:'草稿'});
    // A new draft keeps the generated number even when the form has an empty id.
    if(!row.id)row.id=uid(s,kind==='contracts'?'HT-YL':'PO-YL');
    if(kind==='orders'&&submit)checkOrder(s,row);
    log(row,'保存'+(kind==='contracts'?'采购合同':'采购订单'));
    if(submit){validate(s,kind,row);request(s,kind,row);}write(s);return clone(row);
  }
  function validate(s,kind,row){
    const lines=row.lines;if(!lines.length||lines.some(l=>!Number.isInteger(Number(l.quantity))||Number(l.quantity)<=0||['price','tax','fuel','other'].some(k=>!Number.isFinite(Number(l[k]))||Number(l[k])<0)))throw Error('请核对舱位数量及采购金额，未改变已确认记录');
    if(new Set(lines.map(l=>l.code)).size!==lines.length)throw Error('同一采购明细内舱型重复，请合并数量');
    if(kind==='contracts'){
      if(!row.voyages.length)throw Error('请保留至少一个采购航次或框架参考航次');
      if(row.scope===scopes[0]&&row.voyages.length!==1)throw Error('单航次采购只能包含一个航次');
      if(row.scope===scopes[2]&&(!Number.isInteger(Number(row.maxVoyages))||Number(row.maxVoyages)<1||row.end<row.start))throw Error('请核对框架有效期间与航次数量');
      if(row.penalties.some(p=>p.days<0||p.rate<0||p.rate>100))throw Error('请核对退舱节点及罚金比例');
      if(row.voyages.some(v=>v.back<v.date)||new Set(row.voyages.map(v=>v.date)).size!==row.voyages.length)throw Error('请核对航次日期，不能重复或返航早于出发');
      if(row.type==='保底切舱'&&(row.guarantee<0||row.guarantee>100||row.shortfall<0||row.shortfall>100))throw Error('保底及补差比例须在0到100之间');
      if(row.payments.some(p=>Number(p.amount)<0)||sum(row.payments,'amount')>contractTotal(row))throw Error('付款计划超过合同金额／预算，请核对分期金额');
    }else checkOrder(s,row);
  }
  function checkOrder(s,o){
    const c=find(s,'contracts',o.contractId);if(c.status!=='已签订')throw Error('仅已签订合同可拆采购订单');
    if(c.scope!==scopes[2]&&c.type!=='散位代理')throw Error('单航次及打包合同已按约定形成待入库，不再重复拆单');
    if(o.voyage.date<c.start||o.voyage.date>c.end||o.voyage.back<o.voyage.date)throw Error('航次日期超出合同有效期或返航早于出发');
    const others=s.orders.filter(x=>x.id!==o.id&&x.contractId===c.id&&!['草稿','已退回'].includes(x.status));
    o.lines.forEach(l=>{const limit=c.lines.find(x=>x.code===l.code);if(!limit)throw Error('舱型未在合同范围内');const used=others.filter(x=>x.voyage.date===o.voyage.date).reduce((n,x)=>n+sum(x.lines.filter(y=>y.code===l.code),'quantity'),0);if(used+Number(l.quantity)>Number(limit.quantity))throw Error('本航次采购间数超过合同约定，不能重复拆单');});
    const dates=new Set(others.map(x=>x.voyage.date).concat(o.voyage.date));if(dates.size>Number(c.maxVoyages))throw Error('采购航次数超过框架约定');
  }
  function submit(kind,id){const s=read(),r=find(s,kind,id);if(!['草稿','已退回'].includes(r.status))throw Error('该单据已提交或完成');validate(s,kind,r);request(s,kind,r);write(s);return r;}
  function sign(id,reference,date){const s=read(),c=find(s,'contracts',id);if(c.status!=='待签订')throw Error('请先完成合同审批');c.status='已签订';c.signedRef=reference;c.signedDate=date;log(c,'登记双方签订：'+reference);ensureReceipts(s,'contracts',id);write(s);return c;}
  function remove(kind,id){const s=read(),r=find(s,kind,id);if(r.status!=='草稿'||s.approvals.some(a=>a.kind===kind&&a.sourceId===id))throw Error('仅从未提交审批的草稿可删除，已有审批记录须保留');s[kind]=s[kind].filter(x=>x.id!==id);write(s);}
  function changeOrder(id,lines,reason){const s=read(),o=find(s,'orders',id);if(o.status!=='待执行')throw Error('仅未入库采购订单可变更');const related=s.receipts.filter(r=>r.sourceKind==='orders'&&r.sourceId===id);if(related.some(r=>r.status==='待审核'||r.status==='已入库'||s.approvals.some(a=>a.kind==='receipts'&&a.sourceId===r.id)))throw Error('入库已有审核记录，不能覆盖采购变更，请先核对原入库事项');const before=clone(o.lines);o.lines=clone(lines);validate(s,'orders',o);o.changes.push({at:now(),reason,before,after:clone(lines)});s.receipts=s.receipts.filter(r=>!related.includes(r));request(s,'orders',o);log(o,'提交采购变更：'+reason);write(s);return o;}
  function receive(id,rows,reference,resolution){const s=read(),r=find(s,'receipts',id);if(!['待入库','异常待处理','已退回'].includes(r.status))throw Error('该入库单已提交或完成');
    r.lines.forEach((l,i)=>{l.received=Number(rows[i].received);l.receivedCode=rows[i].receivedCode;l.accepted=0;});r.supplierRef=reference;r.resolution=resolution;
    const diff=r.lines.some(l=>l.received!==Number(l.quantity)||l.receivedCode!==l.code);
    if(r.lines.some(l=>!Number.isInteger(l.received)||l.received<0||l.received>Number(l.quantity)||l.receivedCode!==l.code)||!r.lines.some(l=>l.received>0)||diff&&!resolution){r.status='异常待处理';log(r,'登记入库差异，原采购及库存不变');write(s);return r;}
    if(diff)log(r,'处理差异：'+resolution+'；差额保持待入库');request(s,'receipts',r);write(s);return r;
  }
  function book(s,r){
    if(r.status==='已入库')throw Error('该入库单已经完成，不能重复增加库存');
    const c=contractFor(s,r,'receipts'),use=receiptUse(s,r);r.poolIds=[];r.supplyUse=use.label;r.salesOrder=use.salesOrder;
    if(!s.voyages)s.voyages=[];
    let voyage=s.voyages.find(v=>v.ship===c.ship&&v.date===r.voyage.date);
    if(!voyage){voyage={...clone(r.voyage),ship:c.ship,id:'HC-'+c.ship.toUpperCase()+'-'+r.voyage.date.replaceAll('-','')};s.voyages.push(voyage);}
    r.voyageNo=voyage.id;
    r.lines.forEach(l=>{l.accepted=Number(l.received);if(!l.accepted)return;const key=c.ship+'|'+r.voyage.date+'|'+l.code;let pool=s.pools.find(p=>p.key===key);if(!pool){pool={id:uid(s,'CW-YL'),key,ship:c.ship,date:r.voyage.date,code:l.code,category:l.category,quantity:0,receipts:[]};s.pools.push(pool);}if(!pool.receipts.includes(r.id)){pool.quantity+=l.accepted;pool.receipts.push(r.id);}r.poolIds.push(pool.id);});
    r.status='已入库';r.legacyNo='CRU-RK-'+r.id;log(r,'审核通过，生成航次 '+r.voyageNo+' 及舱位库存');
    if(r.sourceKind==='orders'){const o=source(s,r),received=s.receipts.filter(x=>x.sourceKind==='orders'&&x.sourceId===o.id&&x.status==='已入库').reduce((n,x)=>n+sum(x.lines,'accepted'),0);o.status=received>=sum(o.lines,'quantity')?'已入库':'部分入库';log(o,'入库 '+r.id+'：'+sum(r.lines,'accepted')+'间');}
    ensureReceipts(s,r.sourceKind,r.sourceId);
  }
  function decide(no,decision,opinion){const s=read(),a=s.approvals.find(x=>x.id===no);if(!a||a.status!=='待审批')throw Error('该审批已处理');const r=find(s,a.kind,a.sourceId);if(!['待审批','待审核'].includes(r.status))throw Error('来源单据状态已改变');
    if(decision==='通过'){if(a.kind==='contracts'){validate(s,a.kind,r);r.status='待签订';}if(a.kind==='orders'){validate(s,a.kind,r);r.status='待执行';ensureReceipts(s,'orders',r.id);}if(a.kind==='receipts')book(s,r);a.status='已通过';}else{r.status='已退回';a.status='已退回';}
    a.opinion=opinion||'资料已核对（原型）';log(r,a.status+'：'+a.opinion);write(s);return r;
  }
  function approvalRecords(){const s=read();return s.approvals.map(a=>{const live=find(s,a.kind,a.sourceId),r=a.review||live,c=contractFor(s,r,a.kind);return {no:a.id,cruisePurchase:true,matter:matters[a.kind],source:'邮轮中心',scopes:['todo','mine','overview'],status:a.status,applicant:'邮轮采购王强',applicantRole:'邮轮采购',businessTitle:c.title,businessNo:r.id,context:c.company+' / '+c.type,impact:c.currency+' '+money(a.kind==='contracts'?contractTotal(c):total(a.kind==='receipts'?r.lines.map(l=>({...l,quantity:l.received})):r.lines)),risk:'',riskLevel:'normal',node:a.status==='待审批'?'采购负责人':'已处理',due:a.status==='待审批'?'待处理':'已完成',appliedAt:a.submitted.slice(0,10),sourceHref:'../cruise/'+pages[a.kind]+'?id='+encodeURIComponent(r.id),detail:[['采购合同',c.id],['采购范围',c.scope],['采购类型',c.type],['关联单据',r.id],['生效结果',a.kind==='contracts'?'审批通过后登记签订':a.kind==='orders'?'审批通过后形成待入库事项':'审核通过后生成航次与舱位库存']],flow:live.history.map(h=>[h.at,h.text]),opinion:a.opinion||'资料已核对（原型）'};});}
  function approvalHtml(item){const s=read(),a=s.approvals.find(x=>x.id===item.no),r=a.review||find(s,a.kind,a.sourceId),c=contractFor(s,r,a.kind);return '<div class="table-wrap"><table><thead><tr><th>舱型</th><th>采购间数</th><th>本次接收</th><th>船票成本／间</th><th>税费／燃油／其他</th></tr></thead><tbody>'+r.lines.map(l=>'<tr><td>'+esc(l.category+' '+l.code)+'</td><td>'+l.quantity+'</td><td>'+(a.kind==='receipts'?l.received:'—')+'</td><td>'+money(l.price)+'</td><td>'+money(l.tax)+' / '+money(l.fuel)+' / '+money(l.other)+'</td></tr>').join('')+'</tbody></table></div><p>'+esc(a.kind==='receipts'?'船方确认：'+r.supplierRef+'；差异处理：'+(r.resolution||'数量与舱型一致'):'结算条件：'+c.settlement)+'</p>';}
  // New receipts are operated in the voyage inventory center; the old page retains its historical records.
  function inventory(){return [];}
  root.CaesarCruisePurchase={KEY,read,write,clone,esc,money,sum,total,contractTotal,types,scopes,states,pages,matters,freshContract,contractFor,receiptUse,edit,submit,sign,remove,changeOrder,receive,decide,approvalRecords,approvalHtml,inventory};
})(typeof window==='undefined'?globalThis:window);
