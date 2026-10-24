/* 航服机位原型：当前页面内的采购、额度与变更。无跨模块自动写入。 */
(function (root) {
  'use strict';
  const company = '北京凯撒航空服务有限公司';
  const flights = [
    {id:'CA927',name:'北京首都 PEK → 大阪关西 KIX',from:'PEK',to:'KIX',airline:'中国国际航空'},
    {id:'CA928',name:'大阪关西 KIX → 北京首都 PEK',from:'KIX',to:'PEK',airline:'中国国际航空'},
    {id:'CA931',name:'北京首都 PEK → 法兰克福 FRA',from:'PEK',to:'FRA',airline:'中国国际航空'},
    {id:'CA932',name:'法兰克福 FRA → 北京首都 PEK',from:'FRA',to:'PEK',airline:'中国国际航空'},
    {id:'HU7995',name:'北京首都 PEK → 马累 MLE',from:'PEK',to:'MLE',airline:'海南航空'},
    {id:'HU7996',name:'马累 MLE → 北京首都 PEK',from:'MLE',to:'PEK',airline:'海南航空'}
  ];
  const agreements = [
    {id:'CA-JP-2026-01',supplier:'中国国际航空',flights:['CA927','CA928'],currency:'CNY',types:['系列位','单团位'],name:'国航日本团队协议'},
    {id:'BJ-JP-2026-02',supplier:'北京华远航空服务',flights:['CA927','CA928'],currency:'CNY',types:['系列位','单团位'],name:'华远日本切位协议'},
    {id:'CA-EU-2026-03',supplier:'中国国际航空',flights:['CA931','CA932'],currency:'CNY',types:['系列位','单团位'],name:'国航欧洲团队协议'},
    {id:'HU-CH-2026-01',supplier:'海南航空',flights:['HU7995','HU7996'],currency:'CNY',types:['包机位'],name:'马累包机航次协议'}
  ];
  // 已有旅游线路的演示引用，名称、方案、天数沿用团期页面；可售价格仍由团期维护。
  const products = [
    {id:'JP',name:'日本关西深度游',plan:'关西古都7日',days:7,out:'CA927',back:'CA928',owner:'陈红'},
    {id:'EU',name:'欧洲十国经典游',plan:'A线 法德意12天',days:12,out:'CA931',back:'CA932',owner:'张明'}
  ];
  let seq = 200;
  const id = p => p + '-' + (++seq);
  const clone = x => JSON.parse(JSON.stringify(x));
  const num = x => x !== '' && x != null && Number.isFinite(Number(x));
  const positiveInt = x => num(x) && Number.isInteger(Number(x)) && Number(x)>0;
  function validDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s||'') && !isNaN(Date.parse(s)) && new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s; }
  function addDays(s,n) { if(!validDate(s))return '';const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+Number(n));return d.toISOString().slice(0,10); }
  function deadlineState(date, paid, today) {
    if(paid)return '已付款';
    if(!validDate(date))return '未安排';
    if(date<today)return '已逾期';
    return date<=addDays(today,7)?'7日内到期':'未到期';
  }
  function key(r) { return [r.company,r.type,r.agreement,r.out,r.back,r.date,r.returnDate,r.cabin,r.currency].join('|'); }
  function purchaseAmount(r){return r.type==='包机位'&&r.charterPricing==='按航次总额'&&num(r.charterTotal)?Number(r.charterTotal):Number(r.qty)*Number(r.price);}
  function validate(r, records=[], excludeId='') {
    const errors=[]; const a=agreements.find(a=>a.id===r.agreement), f=flights.find(f=>f.id===r.out), b=flights.find(f=>f.id===r.back);
    if(!['系列位','单团位','包机位'].includes(r.type))errors.push('采购类型不正确');
    if(r.company!==company)errors.push('采购公司不匹配');
    if(!a) errors.push('请选择采购协议');
    else {
      if(a.supplier!==r.supplier)errors.push('供应商与协议不一致');
      if(!a.types.includes(r.type))errors.push('协议不适用此采购类型');
      if(!a.flights.includes(r.out)||(r.back&&!a.flights.includes(r.back)))errors.push('航班不在协议范围内');
      if(r.currency!==a.currency)errors.push('币种与协议不一致');
    }
    if(!f)errors.push('去程航班不正确');
    if(r.back&&(!b||!f||f.from!==b.to||f.to!==b.from))errors.push('去返程航段不匹配');
    if(!validDate(r.date))errors.push('出发日期不正确');
    if(r.back&&(!validDate(r.returnDate)||r.returnDate<r.date))errors.push('回程日期不正确');
    if(!r.back&&r.returnDate)errors.push('单程不填写回程日期');
    if(!positiveInt(r.qty))errors.push('采购数量须为正整数');
    if(!num(r.price)||Number(r.price)<=0)errors.push('采购单价须大于0');
    if(!['固定金额','比例'].includes(r.markupType??'固定金额'))errors.push('请选择加价方式');
    if(!num(r.markup)||Number(r.markup)<0)errors.push((r.markupType==='比例'?'加价比例':'加价金额')+'须为0或正数');
    if(!r.cabin)errors.push('请填写舱位');
    if(!String(r.evidence||'').trim())errors.push('请填写供应确认依据');
    if(r.cutoff&&(!validDate(r.cutoff)||r.cutoff>r.date))errors.push('退位截止日不能晚于出发日');
    if(!r.cutoff&&!(r.type==='包机位'&&r.returnPolicy==='不可退位'))errors.push('请填写退位截止日');
    let last=''; let sum=0;
    (r.payments||[]).forEach(p=>{
      if(!validDate(p.date)||p.date>r.date||p.date<last)errors.push(p.name+'日期不正确或顺序错误');
      if(!num(p.amount)||Number(p.amount)<0)errors.push(p.name+'金额须为0或正数');
      last=p.date;sum+=Number(p.amount)||0;
    });
    if(positiveInt(r.qty)&&num(r.price)&&Number(r.price)>0&&sum>purchaseAmount(r)+0.005)errors.push('付款计划合计超过采购金额');
    if(r.type==='包机位'&&!String(r.charter||'').trim())errors.push('请填写包机航次名称');
    if(r.preDept&&(!positiveInt(r.preQty)||Number(r.preQty)>Number(r.qty)))errors.push('前置分配数量须为正整数且不超采购量');
    if(records.some(x=>x.id!==excludeId&&x.status!=='已取消'&&key(x)===key(r)))errors.push('同协议、航期及舱位重复');
    return [...new Set(errors)];
  }
  function batchValidate(rows,records) {
    const seen=new Set();return rows.map(r=>{const errors=validate(r,records,r.id);if(seen.has(key(r)))errors.push('本次导入存在重复航期');seen.add(key(r));return errors;});
  }
  function stats(r) {
    const returned=(r.returns||[]).filter(x=>x.status==='已确认').reduce((s,x)=>s+x.qty,0);
    const allocated=(r.allocations||[]).filter(x=>!x.parent).reduce((s,x)=>s+x.qty,0);
    const occupied=(r.allocations||[]).reduce((s,x)=>s+x.occupied,0),issued=(r.allocations||[]).reduce((s,x)=>s+x.issued,0);
    const effective=Number(r.qty)-returned;
    return {original:Number(r.qty),returned,effective,allocated,occupied,issued,unbooked:allocated-occupied,available:effective-allocated,pendingReturn:(r.returns||[]).filter(x=>x.status==='待确认').reduce((s,x)=>s+x.qty,0)};
  }
  function free(r,parent='') { if(!parent)return stats(r).available;const a=r.allocations.find(x=>x.id===parent);return a ? a.qty-a.occupied-r.allocations.filter(x=>x.parent===parent).reduce((s,x)=>s+x.qty,0) : -1; }
  function log(r,action,detail) { r.logs.unshift({time:new Date().toLocaleString('zh-CN',{hour12:false}),action,detail,by:'航服周伟'}); }
  function ensure(r) { r.markupType=r.markupType??'固定金额';r.allocations=r.allocations||[];r.returns=r.returns||[];r.changes=r.changes||[];r.logs=r.logs||[];return r; }
  function make(raw,status='草稿') { const r=ensure({...clone(raw),id:id('AIR'),status});r.qty=Number(r.qty)||0;r.price=raw.price===''?'':Number(raw.price);r.payments=(r.payments||[]).map(p=>({...p,amount:Number(p.amount)||0,request:'',paid:0}));log(r,'建立采购',status);return r; }
  function confirm(r,records,prototypeCharter=false) {
    if(r.status!=='待确认')throw Error('仅待确认采购可以入库');
    const errors=prototypeCharter&&r.type==='包机位'?[]:validate(r,records,r.id);if(errors.length)throw Error(errors.join('；'));
    r.status='执行中';if(r.preDept&&!r.allocations.length) allocate(r,{kind:'部门额度',name:r.preDept,company:r.company,qty:Number(r.preQty),product:r.preProduct,owner:r.preOwner});
    log(r,'确认入库',r.qty+'席；依据 '+r.evidence);
  }
  function allocate(r,a) {
    if(r.status!=='执行中')throw Error('仅执行中机位可分配');
    if(!positiveInt(a.qty)||Number(a.qty)>free(r,a.parent))throw Error('分配数量超出来源可用额度或不是正整数');
    if(a.company!==r.company)throw Error('使用公司与采购公司不一致，请另行办理内部供票');
    if(!a.name)throw Error('请选择部门、团期或分销客户');
    const p=a.parent&&r.allocations.find(x=>x.id===a.parent);
    if(p&&p.kind!=='部门额度')throw Error('仅部门额度可以继续下分');
    if(p&&p.product&&a.product&&p.product!==a.product)throw Error('产品不在来源部门负责范围内');
    if(a.kind==='团期使用'&&(a.date!==r.date||a.returnDate!==r.returnDate||a.out!==r.out||a.back!==r.back))throw Error('团期日期或航段与采购机位不匹配');
    if(a.kind==='团期使用'&&Number(a.qty)+r.allocations.filter(x=>x.kind==='团期使用'&&x.name===a.name).reduce((sum,x)=>sum+x.qty,0)>Number(a.capacity))throw Error('分配数量超过团期人数上限');
    const row={...clone(a),id:id('AL'),qty:Number(a.qty),occupied:0,issued:0,parent:a.parent||''};r.allocations.push(row);log(r,'分配机位',row.name+' '+row.qty+'席；来源 '+(p?p.name:'公共余位'));return row;
  }
  function release(r,aid,qty,context={}) {
    const a=r.allocations.find(x=>x.id===aid);if(r.status!=='执行中'||!a)throw Error('当前记录不能释放');
    if(!positiveInt(qty)||Number(qty)>free(r,aid))throw Error('可释放量不足；订单占用和已下分额度不能直接收回');
    const origin=context.originRelease&&(r.releases||[]).find(x=>x.id===context.originRelease&&x.parent===aid);
    if(context.originRelease&&(!origin||Number(qty)>origin.qty-(r.releases||[]).filter(x=>x.originalReleaseId===origin.id).reduce((n,x)=>n+x.qty,0)))throw Error('原团释放来源数量不足');
    const row={id:id('RL'),allocationId:aid,originalReleaseId:origin?.id||'',group:origin?.group||(a.kind==='团期使用'?a.name:''),name:a.name,parent:a.parent||'',qty:Number(qty),reason:context.reason||'释放未占用额度',orderId:context.orderId||origin?.orderId||'',time:new Date().toLocaleString('zh-CN')};
    (r.releases||=[]).push(row);a.qty-=Number(qty);log(r,'释放额度',a.name+' '+qty+'席，回到'+(a.parent?'上级部门':'公共余位')+'；原团 '+(row.group||'公共库存')+'；'+row.reason);return row;
  }
  function requestReturn(r,qty,reason,source='',releaseId='') {
    if(r.status!=='执行中')throw Error('当前状态不能退位');
    if(r.type==='包机位'&&r.returnPolicy==='不可退位')throw Error('本采购协议约定不可退位');
    if(source){const a=r.allocations.find(x=>x.id===source);throw Error(a&&a.issued?'已出票机位不能直接退位，请从原订单办理退票':'已分配额度须先释放回公共余位');}
    if(!positiveInt(qty)||Number(qty)>stats(r).available-stats(r).pendingReturn)throw Error('退位数量超过可申请公共余位；已分配或已出票机位不能直接退位');
    if(!String(reason||'').trim())throw Error('请填写退位原因');
    const release=releaseId&&(r.releases||[]).find(x=>x.id===releaseId&&!x.parent);
    if(releaseId&&(!release||Number(qty)>release.qty-r.returns.filter(x=>x.releaseId===releaseId).reduce((n,x)=>n+x.qty,0)))throw Error('原团释放数量不足或尚未回到公共余位');
    const row={id:id('RT'),qty:Number(qty),reason,status:'待确认',loss:null,evidence:'',releaseId,group:release?.group||'',allocationId:release?.allocationId||'',orderId:release?.orderId||''};r.returns.push(row);log(r,'申请退位',qty+'席；原团 '+(row.group||'公共库存，责任归属待确认')+'；尚未扣减库存');return row;
  }
  function confirmReturn(r,rid,evidence,loss) {
    const row=r.returns.find(x=>x.id===rid);if(!row||row.status!=='待确认')throw Error('退位申请已处理');
    if(!String(evidence||'').trim())throw Error('请填写供应商退位确认依据');
    if(loss!==''&&(!num(loss)||Number(loss)<0))throw Error('损耗金额不能为负数');
    if(row.qty>stats(r).available)throw Error('公共余位不足，先核对已分配额度');
    row.status='已确认';row.loss=loss===''?null:Number(loss);row.evidence=evidence;log(r,'确认退位',row.qty+'席；损耗 '+(row.loss===null?'待确认':row.loss+' '+r.currency));
  }
  function confirmLoss(r,rid,evidence,loss){const row=r.returns.find(x=>x.id===rid);if(!row||row.status!=='已确认'||row.loss!==null)throw Error('仅已退位待定损记录可确认损失');if(!num(loss)||Number(loss)<0||!String(evidence||'').trim())throw Error('请核对损失金额和依据');row.loss=Number(loss);row.lossEvidence=evidence;log(r,'确认退位损失',row.id+'；原团 '+(row.group||'公共库存')+'；'+loss+' '+r.currency+'；'+evidence);}
  function connectPayment(r,i,funds){
    const p=r.payments[i];if(r.status!=='执行中'||!p)throw Error('当前付款节点不可办理');if(r.paymentReview)throw Error('采购已变更，付款计划须先复核');
    const sid='INVENTORY:'+r.id+':'+i;let s=funds.sources.find(s=>s.id===sid);
    if(!s){s={id:sid,company:r.company,currency:r.currency,type:r.type==='包机位'?'包机协议':'机位采购',terms:'协议节点',supplier:r.supplier,agreement:r.agreement,node:p.name,total:Number(p.amount),paid:Number(p.paid||0),account:'待核供应商收款账户',approved:false,checked:true,date:p.date,invoice:'成本凭证待补',invoiceRequired:false,inventoryId:r.id,inventoryNode:i,inventoryDate:r.date,inventoryReturn:r.returnDate,inventoryFlights:[r.out,r.back].filter(Boolean).join(' / '),group:'',history:[]};funds.sources.push(s);}
    if(s.total!==Number(p.amount)||s.agreement!==r.agreement||s.supplier!==r.supplier)throw Error('付款来源与现行计划有差异，请核对原申请');
    return s;
  }
  const storageKey='caesar-air-inventory-v1';
  function load(){try{const rows=JSON.parse(sessionStorage.getItem(storageKey));if(Array.isArray(rows)&&rows.length){seq=Math.max(seq,...rows.flatMap(r=>[r,...(r.releases||[]),...(r.returns||[]),...(r.allocations||[])].map(x=>Number(String(x.id).match(/^[A-Z]+-(\d+)$/)?.[1]||0))));return rows.map(ensure);}}catch(_){}return seed();}
  function save(rows){try{sessionStorage.setItem(storageKey,JSON.stringify(rows));return true;}catch(_){return false;}}
  function requestChange(r,qty,reason) {
    const s=stats(r);if(r.status!=='执行中')throw Error('仅执行中采购可申请变更');
    if(!positiveInt(qty)||Number(qty)<s.returned+s.allocated)throw Error('变更后数量不能小于已退位与已分配合计');
    if(Number(qty)===Number(r.qty))throw Error('请修改采购数量');
    if(r.changes.some(c=>c.status==='待确认'))throw Error('已有待确认的采购变更');
    if(!String(reason||'').trim())throw Error('请填写变更原因');
    const c={id:id('CHG'),before:r.qty,after:Number(qty),reason,status:'待确认'};r.changes.push(c);log(r,'申请采购变更',r.qty+' → '+qty+'席');return c;
  }
  function confirmChange(r,cid,evidence) {
    const c=r.changes.find(c=>c.id===cid);if(!c||c.status!=='待确认')throw Error('变更申请已处理');
    if(!String(evidence||'').trim())throw Error('请填写变更确认依据');
    const s=stats(r);if(c.after<s.returned+s.allocated+s.pendingReturn)throw Error('最新占用或待退位量超过变更后数量');
    r.qty=c.after;if(r.type==='包机位'&&r.charterPricing==='按航次总额')r.price=Number(r.charterTotal)/r.qty;c.status='已确认';c.evidence=evidence;r.paymentReview=true;log(r,'确认采购变更',c.before+' → '+c.after+'席；付款计划需复核，已申请及实付金额保留');
  }
  function groupPreview(records,rows,productId) {
    const p=products.find(x=>x.id===productId),sums={};return rows.map(row=>{
      const r=records.find(x=>x.id===row.record),errors=[];
      if(!p)errors.push('请选择已有线路方案');if(!r||r.status!=='执行中')errors.push('机位未执行');
      if(r&&p&&(r.out!==p.out||r.back!==p.back||r.returnDate!==addDays(r.date,p.days-1)))errors.push('线路天数或航段与机位不匹配');
      if(r&&row.company!==r.company)errors.push('团期公司与采购公司不一致');
      if(!positiveInt(row.qty))errors.push('团期名额须为正整数');
      const k=row.record+'|'+(row.parent||'');sums[k]=(sums[k]||0)+Number(row.qty||0);
      if(r&&sums[k]>free(r,row.parent))errors.push('同一航期拆分合计超过可用额度');
      const parent=r&&r.allocations.find(a=>a.id===row.parent);if(parent&&parent.product&&p&&parent.product!==p.id)errors.push('线路不在部门负责范围内');
      return {...row,date:r&&r.date,returnDate:r&&r.returnDate,product:p&&p.name,plan:p&&p.plan,owner:p&&p.owner,errors};
    });
  }
  function buildGroups(records,rows,productId) {
    const preview=groupPreview(records,rows,productId);if(!rows.length||preview.some(x=>x.errors.length))throw Error('请修正建团预览中的错误');
    return preview.map(x=>{const r=records.find(r=>r.id===x.record),no=id(productId+'-GRP');allocate(r,{kind:'团期使用',name:no,company:x.company,parent:x.parent,qty:x.qty,capacity:x.qty,date:r.date,returnDate:r.returnDate,out:r.out,back:r.back,product:productId,owner:x.owner,plan:x.plan});return {...x,no,status:'筹备中'};});
  }
  function paymentRequest(r,i) {
    const p=r.payments[i];if(r.status!=='执行中'||!p||p.request||p.paid)throw Error('当前付款节点不能重复申请');
    if(r.paymentReview)throw Error('采购已变更，请先在财务付款申请中复核计划');
    if(!validDate(p.date)||!num(p.amount)||Number(p.amount)<=0)throw Error('付款日期或金额待补');
    p.request=id('FK-SQ');log(r,'提交付款申请',p.name+' '+p.amount+' '+r.currency+'；'+p.request+'，待财务处理');return p.request;
  }
  function seed() {
    const base={company,type:'系列位',supplier:'中国国际航空',agreement:'CA-JP-2026-01',out:'CA927',back:'CA928',date:'2026-11-20',returnDate:'2026-11-26',qty:100,price:3200,markup:100,cabin:'经济舱G',currency:'CNY',cutoff:'2026-11-01',evidence:'国航团队确认书 CA-JP-1120',payments:[{name:'一押',date:'2026-10-20',amount:30000},{name:'二押',date:'2026-10-28',amount:30000},{name:'尾款',date:'2026-11-10',amount:196000}]};
    const a=make(base,'执行中');a.id='AIR-BLK-20260618-001';a.returns=[{id:'RT-DEMO',qty:20,status:'已确认',reason:'航司同意退回',evidence:'国航退位确认 TW-1120',loss:null}];
    a.allocations=[{id:'D1',kind:'部门额度',name:'日本产品部',company,parent:'',qty:60,occupied:0,issued:0,product:'JP',owner:'陈红'},{id:'G1',kind:'团期使用',name:'JP-20261120-001',company,parent:'D1',qty:40,occupied:40,issued:35,product:'JP',owner:'陈红',date:base.date,returnDate:base.returnDate,out:base.out,back:base.back,capacity:40}];a.payments[0].request='FK-SQ-DEMO';a.payments[0].paid=30000;
    const b=make({...base,date:'2026-11-27',returnDate:'2026-12-03',qty:40,price:3300,payments:[{name:'一押',date:'2026-10-22',amount:20000},{name:'尾款',date:'2026-11-15',amount:112000}]},'执行中');
    const c=make({...base,type:'单团位',date:'2026-12-04',returnDate:'2026-12-10',qty:30,payments:[]},'待确认');
    const d=make({...base,type:'包机位',supplier:'海南航空',agreement:'HU-CH-2026-01',out:'HU7995',back:'HU7996',date:'2026-12-12',returnDate:'2026-12-17',qty:160,price:4000,charter:'马累冬季包机第1航次',evidence:'海航包机确认书 HU-MLE-1212',payments:[{name:'一押',date:'2026-10-12',amount:128000},{name:'二押',date:'2026-11-15',amount:128000},{name:'尾款',date:'2026-12-01',amount:384000}]},'执行中');
    const e=make({...base,date:'2027-01-08',returnDate:'2027-01-14',qty:30,evidence:'',price:'',payments:[]},'草稿');
    const f=make({...base,date:'2026-09-18',returnDate:'2026-09-24',cutoff:'2026-09-01',payments:[]},'已关闭');
    return [a,b,c,d,e,f];
  }
  const api={storageKey,load,save,confirmLoss,connectPayment,purchaseAmount,company,flights,agreements,products,clone,id,validDate,addDays,deadlineState,key,validate,batchValidate,stats,free,make,confirm,allocate,release,requestReturn,confirmReturn,requestChange,confirmChange,groupPreview,buildGroups,paymentRequest,log,seed};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.AirInventory=api;
})(typeof window==='object'?window:globalThis);
