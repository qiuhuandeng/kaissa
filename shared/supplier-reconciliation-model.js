/* 双方对账的页面会话原型。各端使用独立样例，不自动生成应付或跨端回写。 */
(function (root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const states = { draft: '草稿', reviewing: '待我方核对', returned: '待供应商补充', pending: '待供应商确认', disputed: '差异处理中', confirmed: '双方已确认', void: '已作废' };
  const supplier = '北京国旅地接部';
  const companies = ['北京凯撒', '福建凯撒', '上海凯撒'];
  const cents = value => {
    if (value === '' || value == null || !/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(String(value))) throw Error('金额须为非负数，最多两位小数');
    const n = Math.round(Number(value) * 100);
    if (!Number.isSafeInteger(n) || n > 99999999999) throw Error('金额超出可处理范围');
    return n;
  };
  const sum = lines => lines.reduce((n, line) => n + cents(line.amount), 0) / 100;
  function source(id, company, vendor, agreement, currency, date, order, tour, name, qty, price, adjustment, basis, ready = true) {
    return { id, company, supplier: vendor, agreement, currency, date, order, tour, name, qty, price, adjustment, basis, ready, amount: (Math.round(qty * price * 100) + Math.round(adjustment * 100)) / 100, confirmation: '采购确认-' + id, service: ready ? '实际服务已确认' : '实际服务待确认' };
  }
  function seedSources() {
    return [
      source('C01','北京凯撒',supplier,'AGR-GL-BJ-012','CNY','2026-09-08','KS20260901001','JP20260901001','日本关西深度游 · 地接费',20,4000,0,'采购确认20人，实际服务20人'),
      source('C02','北京凯撒',supplier,'AGR-GL-BJ-012','CNY','2026-09-12','KS20260902002','JP20260905002','日本关西深度游 · 地接费',10,5000,0,'采购确认10人，实际服务10人'),
      source('C03','福建凯撒',supplier,'AGR-GL-FJ-013','CNY','2026-09-15','KS20260908003','JP20260908003','日本东京富士山6日 · 地接费',20,5000,1000,'基础100,000；加住2,000（增补单ZB03）；取消减免1,000（减免单JM03）'),
      source('C04','北京凯撒',supplier,'AGR-GL-BJ-012','CNY','2026-09-20','KS20260913004','JP20260913004','日本关西深度游 · 地接费',6,4200,0,'采购确认6人，实际服务6人'),
      source('C05','北京凯撒',supplier,'AGR-GL-BJ-012','CNY','2026-09-21','KS20260914005','JP20260914005','日本关西深度游 · 地接费',4,4300,500,'实际服务4人；单房差500（增补单ZB05）'),
      source('C06','北京凯撒',supplier,'AGR-GL-BJ-012','CNY','2026-09-22','KS20260915006','JP20260915006','日本北海道7日 · 地接费',8,5600,0,'实际服务人数尚未确认',false),
      source('C07','福建凯撒',supplier,'AGR-GL-FJ-013','CNY','2026-09-23','KS20260916007','JP20260916007','日本东京富士山6日 · 地接费',5,4800,0,'采购确认5人，实际服务5人'),
      source('C08','上海凯撒','欧洲联合地接社','AGR-EU-SH-016','EUR','2026-09-23','KS20260916008','EU20260916008','法意瑞12日 · 地接费',6,1800,0,'采购确认6人，实际服务6人'),
      source('C09','北京凯撒',supplier,'AGR-GL-BJ-012','JPY','2026-09-24','KS20260917009','JP20260917009','日本关西深度游 · 增补服务',2,12000,0,'加住确认单ZB09'),
      source('C11','北京凯撒',supplier,'AGR-GL-BJ-012','CNY','2026-09-12','KS20260902002','JP20260905002','日本关西深度游 · 单房差',1,1000,0,'单房差确认单ZB02，已确认1人'),
      source('C10','福建凯撒',supplier,'AGR-GL-FJ-013','CNY','2026-08-20','KS20260813010','JP20260813010','日本东京富士山6日 · 地接费',2,4800,0,'原对账作废；实际服务2人'),
      source('C12','北京凯撒',supplier,'AGR-GL-BJ-012','CNY','2026-09-18','KS20260911012','JP20260911012','日本北海道7日 · 地接费',12,5000,0,'采购确认12人，实际服务12人'),
      source('C13','北京凯撒',supplier,'AGR-GL-BJ-012','CNY','2026-09-19','KS20260912013','JP20260912013','日本关西深度游 · 地接费',4,5000,0,'采购确认4人，实际服务4人'),
      source('C14','福建凯撒',supplier,'AGR-GL-FJ-013','CNY','2026-09-19','KS20260912014','JP20260912014','日本东京富士山6日 · 地接费',5,2500,0,'采购确认5人，实际服务5人')
    ];
  }
  function createSession(role, agreements) {
    if (!['merchant','supplier'].includes(role)) throw Error('无效的办理角色');
    const sources = seedSources();
    sources.forEach(l => { l.payment = {offset:0,paid:0,reference:'无已冲抵或尾款付款记录'}; });
    sources.find(l=>l.id==='C03').payment = {offset:30000,paid:50000,reference:'预付冲抵HX03；尾款付款FK03'};
    sources.find(l=>l.id==='C04').payment = {offset:6000,paid:0,reference:'预付冲抵HX04'};
    let serial = 6;
    const record = (suffix, ids, state) => ({ id:'DZ2026092600' + suffix, company:sources.find(x=>x.id===ids[0]).company, supplier:sources.find(x=>x.id===ids[0]).supplier, agreement:sources.find(x=>x.id===ids[0]).agreement, currency:sources.find(x=>x.id===ids[0]).currency, start:ids[0]==='C10'?'2026-08-01':'2026-09-01', end:ids[0]==='C10'?'2026-08-31':'2026-09-30', revision:1, state, lines:ids.map(id=>clone(sources.find(x=>x.id===id))), history:[], events:[], updated:'2026-09-26 09:00', remark:'' });
    const statements = [record(1,['C01'],'disputed'), record(2,['C02','C11'],'pending'), record(3,['C03'],'confirmed'), record(4,['C08'],'draft'), record(5,['C10'],'void')];
    statements[0].lines[0].claim = 82000;
    statements[0].lines[0].claimReason = '临时加住费用2,000元，服务确认单ZB01';
    statements[2].payment = { offset:30000, paid:50000, inTransit:10000, reference:'预付冲抵记录HX03；付款记录FK03' };
    statements[2].invoice={task:'INV-DZ-003',version:1,no:'FJ20260925003',amount:101000,file:'国旅九月地接发票.pdf',status:'待补正',reason:'购方名称缺字，请补充清晰完整的原票材料',buyer:'福建凯撒',seller:supplier,currency:'CNY'};
    statements[2].invoiceHistory=[{...clone(statements[2].invoice),actor:'福建凯撒发票岗',time:'2026-09-26 09:00',action:'退回补正'}];
    statements[2].refund={id:'RET-DZ-003',amount:5000,received:0,status:'待供应商退款',prepay:'PP-DZ-003',payment:'PAY-PP-003',basis:'双方同意退还未冲抵预付5,000元，确认单TH-0926-03',submissions:[]};
    statements.forEach(s => {
      if (s.state !== 'draft' && s.state !== 'void') {
        const submitted = clone(s.lines); submitted.forEach(l=>{delete l.claim;delete l.claimReason;});
        s.history.push({ revision:1, lines:submitted, time:'2026-09-25 16:30', action:'提交对账', actor:s.company });
        if(s.state==='disputed'||s.state==='confirmed') s.history.push({revision:1,lines:clone(s.lines),time:s.updated,action:s.state==='disputed'?'供应商异议':'供应商确认',actor:s.supplier});
      }
      s.events.push({ time:s.updated, action:s.state==='disputed'?'提出差异':s.state==='confirmed'?'确认对账':s.state==='void'?'作废草稿':'创建对账', actor:s.state==='disputed'||s.state==='confirmed'?s.supplier:s.company });
    });
    // 两端独立演示同一份供应商来单，体现计调接收和供应商补充入口。
    [['DZ20260925001',['C12','C13'],'reviewing',[62000,20000]],['DZ20260925002',['C14'],'returned',[13000]]].forEach(([id,ids,state,amounts])=>{
      const s=record(0,ids,state);s.id=id;s.initiatedBy='supplier';
      s.lines.forEach((l,i)=>{l.claim=amounts[i];l.claimReason=l.claim===l.amount?'':'加住服务，供应商服务明细表';});
      s.bills=[{no:state==='reviewing'?'GL-202609-101':'GL-202609-102',date:'2026-09-25',total:amounts.reduce((a,b)=>a+b,0),files:[{name:'国旅九月账单.pdf',size:12000}],lines:s.lines.map(l=>({id:l.id,amount:l.claim,reason:l.claimReason})),submittedAt:'2026-09-25 10:00',version:1}];
      s.history.push({revision:1,lines:clone(s.lines),time:'2026-09-25 10:00',action:'供应商提交账单',actor:s.supplier});
      s.events.push({time:'2026-09-25 10:00',action:'提交账单 → '+s.company+'计调',actor:s.supplier});
      if(state==='returned') {s.returnReason='请补充加住500元对应的订单服务明细及确认材料';s.events.push({time:'2026-09-25 15:00',action:'退回补充：'+s.returnReason,actor:s.company+'计调'});}
      statements.push(s);
    });
    // 每条采购服务有自己的确认记录；计调实际服务确认与供应商报价分开保存。
    const purchases=sources.map(l=>({id:'CG-'+l.id,sourceId:l.id,company:l.company,supplier:l.supplier,order:l.order,tour:l.tour,name:l.name,currency:l.currency,date:l.date,agreement:l.agreement,qty:l.qty,price:l.price,increase:Math.max(l.adjustment,0),decrease:Math.max(-l.adjustment,0),amount:l.amount,state:'已确认',version:1,confirmation:l.confirmation,actual:l.ready?{qty:l.qty,price:l.price,increase:Math.max(l.adjustment,0),decrease:Math.max(-l.adjustment,0),amount:l.amount,date:l.date,basis:l.basis,actor:l.company+'计调'}:null,history:[]}));
    ['待供应商确认','暂时保留','取消待回复','补差待我方确认','取消损失待我方确认'].forEach((state,i)=>{
      const id='C'+(15+i),l=source(id,'北京凯撒',supplier,'AGR-GL-BJ-012','CNY','2026-09-28','KS202609210'+(15+i),'JP202609280'+(15+i),'日本关西深度游 · 地接费',2,5000,0,'采购确认待办理',false);
      l.payment={offset:0,paid:0,reference:'无已冲抵或尾款付款记录'};sources.push(l);
      purchases.unshift({id:'CG-'+id,sourceId:id,company:l.company,supplier:l.supplier,order:l.order,tour:l.tour,name:l.name,currency:l.currency,date:l.date,agreement:l.agreement,qty:2,price:5000,increase:0,decrease:0,amount:10000,state,version:1,confirmation:'',actual:null,holdUntil:state==='暂时保留'?'2026-09-27':'',cancelRequest:state.includes('取消')?'采购公司计调申请取消本项地接服务，取消申请QX-'+id:'',proposal:state==='补差待我方确认'?{qty:2,price:5000,increase:1200,decrease:0,amount:11200,basis:'加住一晚，补差确认单ZB-C18',confirmation:'GL-C18'}:state==='取消损失待我方确认'?{qty:0,price:0,increase:0,decrease:0,amount:600,loss:600,basis:'酒店不可退费用600元，酒店确认QX-C19'}:null,history:[]});
    });
    const purchaseVisible=p=>role==='merchant'?companies.includes(p.company):p.supplier===supplier;
    function purchase(id){const p=purchases.find(x=>x.id===id);if(!p||!purchaseVisible(p))throw Error('无权办理该采购单');return p;}
    function purchaseGuard(p,version,expected,states){if(role!==expected)throw Error('当前岗位不能办理');if(p.version!==version)throw Error('采购确认版本已更新，请重新打开');if(!states.includes(p.state))throw Error('当前状态不能办理此操作');}
    function purchaseLog(p,action,basis){p.history.push({version:p.version,action,basis,time:new Date().toLocaleString('sv-SE').slice(0,16),actor:role==='merchant'?p.company+'计调':p.supplier+'订单人员',amount:p.amount,proposal:clone(p.proposal??null),actual:clone(p.actual)});p.version++;}
    function purchaseAmounts(d){const qty=Number(d.qty);if(!/^\d+$/.test(String(d.qty))||!Number.isSafeInteger(qty)||qty<1||qty>100000)throw Error('服务数量须为1至100000的整数');const price=cents(d.price),increase=cents(d.increase),decrease=cents(d.decrease),amount=qty*price+increase-decrease;if(amount<0||!Number.isSafeInteger(amount))throw Error('减免不能超过费用合计');cents(amount/100);return {qty,price:price/100,increase:increase/100,decrease:decrease/100,amount:amount/100};}
    function syncPurchase(p){const l=sources.find(x=>x.id===p.sourceId),a=p.actual;Object.assign(l,{date:a?a.date:p.date,qty:a?a.qty:p.qty,price:a?a.price:p.price,adjustment:a?a.increase-a.decrease:p.increase-p.decrease,amount:a?a.amount:p.amount,confirmation:p.confirmation||'取消确认-'+p.sourceId,ready:!!a,basis:a?a.basis:'采购金额已确认，实际服务待确认',service:a?(p.state==='已取消'?'取消损失已确认':'实际服务已确认'):'实际服务待确认'});}
    function replyPurchase(id,version,d){
      const p=purchase(id);purchaseGuard(p,version,'supplier',['待供应商确认','暂时保留','取消待回复']);
      const basis=String(d.basis||'').trim();
      if(p.state==='取消待回复') {if(d.action!=='cancel'||!basis)throw Error('请填写取消损失及依据');const loss=cents(d.loss)/100;p.proposal={qty:0,price:0,increase:0,decrease:0,amount:loss,loss,basis};p.state='取消损失待我方确认';}
      else if(d.action==='hold'){if(!agreements.validDate(d.holdUntil)||d.holdUntil<'2026-09-26'||d.holdUntil>p.date||!basis)throw Error('保留截止日须在演示业务日与服务日期之间，并填写依据');p.holdUntil=d.holdUntil;p.state='暂时保留';}
      else if(d.action==='unavailable'){if(!basis)throw Error('请填写无法承接原因');p.state='无法承接';}
      else if(d.action==='confirm'){if(!String(d.confirmation||'').trim())throw Error('请填写供应商确认号');p.confirmation=d.confirmation.trim();p.state='已确认';p.proposal=null;syncPurchase(p);}
      else if(d.action==='adjust'){const terms=purchaseAmounts(d);if(!basis||!String(d.confirmation||'').trim())throw Error('补差须填写确认号及变更依据');if(terms.amount===p.amount&&terms.qty===p.qty&&terms.price===p.price&&terms.increase===p.increase&&terms.decrease===p.decrease)throw Error('采购条件没有变化，请直接确认');p.proposal={...terms,basis,confirmation:d.confirmation.trim()};p.state='补差待我方确认';}
      else throw Error('请选择有效回复');
      purchaseLog(p,'供应商回复：'+p.state,basis);return clone(p);
    }
    function acceptPurchase(id,version,accept,basis){
      const p=purchase(id);purchaseGuard(p,version,'merchant',['补差待我方确认','取消损失待我方确认']);if(typeof accept!=='boolean')throw Error('请选择认可或退回');basis=String(basis||'').trim();if(!basis)throw Error('请填写我方核对依据');
      const cancel=p.state==='取消损失待我方确认';purchaseLog(p,accept?'我方认可'+(cancel?'取消损失':'采购补差'):'退回供应商重报',basis);
      if(accept){const v=p.proposal;Object.assign(p,{qty:v.qty,price:v.price,increase:cancel?v.amount:v.increase,decrease:v.decrease,amount:v.amount,confirmation:v.confirmation||'取消确认-'+p.sourceId,state:cancel?'已取消':'已确认'});if(cancel)p.actual={...clone(v),increase:v.amount,date:p.date,basis:v.basis+'；我方核对：'+basis,actor:p.company+'计调'};syncPurchase(p);}else p.state=cancel?'取消待回复':'待供应商确认';
      return clone(p);
    }
    function confirmService(id,version,d){
      const p=purchase(id);purchaseGuard(p,version,'merchant',['已确认']);
      const used=statements.filter(s=>s.state!=='void'&&s.lines.some(l=>l.id===p.sourceId));
      if(used.some(s=>s.state!=='reviewing'))throw Error('本项已纳入对账，不能覆盖原依据；后补费用须另行确认');
      const a=purchaseAmounts(d);if(!agreements.validDate(d.date)||d.date>'2026-09-26'||!String(d.basis||'').trim())throw Error('请填写已发生的实际服务日期及人数、增减费用依据');
      p.actual={...a,date:d.date,basis:d.basis.trim(),actor:p.company+'计调'};syncPurchase(p);purchaseLog(p,'确认实际服务',p.actual.basis);
      // 来单保留原采购与供应商申报，只追加我方实际服务依据；旧版历史不动。
      used.forEach(s=>{s.history.push({revision:s.revision,lines:clone(s.lines),time:s.updated,action:'补充实际服务前的对账记录',actor:p.company+'计调'});s.revision++;const l=s.lines.find(x=>x.id===p.sourceId);l.ready=true;l.actualBasis=clone(p.actual);delete l.decision;event(s,'计调补齐实际服务依据：'+p.id);});
      return clone(p);
    }
    function purchaseBlock(id){const p=purchases.find(x=>x.sourceId===id);return p&&!['已确认','已取消'].includes(p.state)?'采购确认未完成：'+p.state:'';}
    const visible = s => role === 'merchant' ? companies.includes(s.company) : s.supplier === supplier && s.state !== 'draft';
    function get(id) { const s=statements.find(x=>x.id===id); if(!s || !visible(s)) throw Error('无权查看或办理该对账单'); return s; }
    function requireState(s, allowed, expectedRole, revision) {
      if(role!==expectedRole) throw Error('当前角色不能办理此操作');
      if(!allowed.includes(s.state)) throw Error('当前状态不能重复办理，请刷新本单');
      if(revision!==undefined && s.revision!==revision) throw Error('对账版本已更新，请重新核对');
    }
    function event(s, action) { s.updated=new Date().toLocaleString('sv-SE').slice(0,16); s.events.push({time:s.updated,action,actor:role==='merchant'?s.company:s.supplier}); }
    function availability(item, editingId) {
      if(!item) return '采购明细不存在';
      if(purchaseBlock(item.id)) return purchaseBlock(item.id);
      if(!item.ready) return '实际服务待确认';
      const used=statements.find(s=>s.id!==editingId && s.state!=='void' && s.lines.some(l=>l.id===item.id));
      return used ? '已纳入 '+used.id : '';
    }
    function billAvailability(id, editingId) {
      const item=sources.find(l=>l.id===id);
      if(role!=='supplier'||!item||item.supplier!==supplier) return {blocked:'无权提交该采购明细',statement:'',revision:null};
      if(purchaseBlock(id))return {blocked:purchaseBlock(id),statement:'',revision:null};
      const used=statements.find(s=>s.state!=='void'&&s.lines.some(l=>l.id===id));
      if(!used) return {blocked:'',statement:'',revision:null};
      if(used.id===editingId && used.state==='returned')return {blocked:'',statement:used.id,revision:used.revision};
      if(['draft','pending'].includes(used.state))return {blocked:'',statement:used.state==='draft'?'采购公司整理中':used.id,revision:used.revision};
      return {blocked:used.state==='confirmed'?'双方已确认，后补费用另行办理':used.state==='returned'?'请从原单“补充”入口办理':'已在对账处理中，请查看原单',statement:used.id,revision:used.revision};
    }
    function matchBill(data, editingId) {
      if(role!=='supplier')throw Error('只有供应商对账人员可以提交供应商账单');
      if(!Array.isArray(data.lines)||!data.lines.length)throw Error('请至少选择一条采购订单费用');
      const ids=data.lines.map(l=>l.id);
      if(new Set(ids).size!==ids.length)throw Error('同一费用明细不能重复选择');
      const rows=ids.map(id=>{
        const l=sources.find(x=>x.id===id);
        if(!l||l.supplier!==supplier||l.company!==data.company||l.agreement!==data.agreement||l.currency!==data.currency)throw Error('采购订单不属于当前公司、供应商、协议或币种');
        if(!agreements.validDate(data.start)||!agreements.validDate(data.end)||data.start>data.end||l.date<data.start||l.date>data.end)throw Error('采购明细不在有效账单期间内');
        if(purchaseBlock(l.id))throw Error(purchaseBlock(l.id));
        return l;
      });
      const used=statements.filter(s=>s.state!=='void'&&s.lines.some(l=>ids.includes(l.id)));
      if(used.length>1)throw Error('所选明细属于多张对账单，请分开提交');
      const target=used[0];
      if(target) {
        const editable=editingId===target.id&&target.state==='returned';
        if(!editable&&!['draft','pending'].includes(target.state))throw Error('该费用已在对账处理中或已经确认，请勿重复提交');
        if(target.supplier!==supplier||target.company!==data.company||target.agreement!==data.agreement||target.currency!==data.currency)throw Error('原对账单与本次账单范围不符');
        if(target.lines.length!==ids.length||target.lines.some(l=>!ids.includes(l.id)))throw Error('请完整选择原对账单的费用；新增费用需单独提交');
        if(data.start!==target.start||data.end!==target.end)throw Error('请采用原对账单的对账期间：'+target.start+' 至 '+target.end);
      } else if(editingId)throw Error('原对账单已变化，请重新打开');
      // 采购订单原协议可能已到期；只核对原有归属，不以今天的有效性阻断历史业务对账。
      const agreement=agreements.get(data.agreement,data.company);
      if(!agreement||agreement.supplier!==supplier)throw Error('采购订单的原合作协议未找到');
      return {target,rows};
    }
    function submitBill(data, editingId) {
      const {target,rows}=matchBill(data,editingId);
      if(target&&data.expectedRevision!==target.revision)throw Error('原对账版本已变化，请重新选择费用明细');
      if(!target&&data.expectedRevision!=null)throw Error('原对账单已变化，请重新选择');
      if(!String(data.no||'').trim()||String(data.no).length>64)throw Error('请填写供应商账单号，最多64字');
      if(!agreements.validDate(data.date))throw Error('请填写有效账单日期');
      if(!Array.isArray(data.files)||!data.files.length||data.files.length>5)throw Error('请选择1至5份账单附件');
      if(data.files.some(f=>!f.name||!/^.{1,128}\.(pdf|xlsx?|csv|png|jpe?g)$/i.test(f.name)||!Number.isFinite(f.size)||f.size<=0||f.size>10*1024*1024))throw Error('附件须为PDF、表格或图片，每份大于0且不超过10MB');
      if(statements.some(s=>s.id!==target?.id&&s.company===data.company&&s.supplier===supplier&&s.bills?.some(b=>b.no===data.no.trim())))throw Error('该采购公司已收到相同供应商账单号，请查看原单');
      const lines=rows.map(row=>{
        const bill=data.lines.find(l=>l.id===row.id),l=clone(target?.lines.find(x=>x.id===row.id)||row);
        cents(bill.amount);
        if(cents(bill.amount)!==cents(l.amount)&&!String(bill.reason||'').trim())throw Error('账单金额与采购金额不同，请填写增减依据');
        l.claim=Number(bill.amount);l.claimReason=String(bill.reason||'').trim();delete l.decision;return l;
      });
      const total=lines.reduce((n,l)=>n+cents(l.claim),0);
      if(cents(data.total)!==total)throw Error('账单总额与所选明细合计不一致');
      const s=target||{id:'DZ20260926'+String(serial++).padStart(3,'0'),company:data.company,supplier,agreement:data.agreement,currency:data.currency,start:data.start,end:data.end,revision:1,state:'reviewing',history:[],events:[],initiatedBy:'supplier',remark:''};
      if(target) s.history.push({revision:s.revision,lines:clone(s.lines),time:s.updated,action:'接收账单前的对账记录',actor:s.company});
      s.lines=lines;s.state='reviewing';delete s.returnReason;
      const bill={no:data.no.trim(),date:data.date,total:total/100,files:clone(data.files),lines:clone(data.lines),submittedAt:new Date().toLocaleString('sv-SE').slice(0,16),version:(s.bills?.length||0)+1};
      (s.bills||(s.bills=[])).push(bill);
      if(!target)statements.unshift(s);
      event(s,(editingId?'补充账单':'提交账单')+' → '+s.company+'计调');
      s.history.push({revision:s.revision,lines:clone(s.lines),time:s.updated,action:'供应商提交账单（第'+bill.version+'次）',actor:s.supplier});
      return clone(s);
    }
    function reviewBill(id,revision,decisions,finish) {
      const s=get(id);requireState(s,['reviewing'],'merchant',revision);
      if(decisions.length!==s.lines.length||new Set(decisions.map(d=>d.id)).size!==decisions.length||decisions.some(d=>!s.lines.some(l=>l.id===d.id)))throw Error('请逐项核对全部账单费用');
      const next=clone(s.lines);
      next.forEach(l=>{
        const d=decisions.find(x=>x.id===l.id);
        if(d.amount===''&&!String(d.reason||'').trim()){delete l.decision;return;}
        cents(d.amount);const amount=Number(d.amount),current=l.actualBasis?.amount??l.amount;
        if((amount!==current||amount!==l.claim)&&!String(d.reason||'').trim())throw Error('存在金额差异，请填写本次认可依据');
        if(amount<Math.min(current,l.claim)||amount>Math.max(current,l.claim))throw Error('认可金额须在'+(l.actualBasis?'实际服务金额':'原对账金额')+'与供应商账单金额之间，其他费用另行确认');
        l.decision={amount,reason:String(d.reason||'').trim()||'采购与实际服务依据核对一致'};
      });
      if(finish&&next.some(l=>!l.decision))throw Error('尚有费用未核对，不能完成本单');
      if(finish&&next.some(l=>!l.ready))throw Error('实际服务依据尚未确认，请由计调补齐后再提交核对结果');
      if(finish) {
        const agreed=next.every(l=>cents(l.decision.amount)===cents(l.claim));
        s.history.push({revision:s.revision,lines:clone(next),time:new Date().toLocaleString('sv-SE').slice(0,16),action:'计调核对供应商账单',actor:s.company+'计调'});
        next.forEach(l=>{l.amount=l.decision.amount;l.resolution=l.decision.reason;delete l.decision;delete l.claim;delete l.claimReason;});
        s.revision++;s.state=agreed?'confirmed':'pending';
      }
      s.lines=next;event(s,finish?(s.state==='confirmed'?'按供应商账单确认 → 财务应付岗':'调整金额 → 供应商对账人员确认'):'保存账单核对');
      if(finish)s.history.push({revision:s.revision,lines:clone(next),time:s.updated,action:s.state==='confirmed'?'计调确认供应商原账单':'提交调整后金额',actor:s.company+'计调'});
      return clone(s);
    }
    function returnBill(id,revision,reason) {
      const s=get(id);requireState(s,['reviewing'],'merchant',revision);
      if(!String(reason||'').trim())throw Error('请填写需要供应商补充的材料或明细');
      s.returnReason=reason.trim();s.state='returned';event(s,'退回供应商补充：'+s.returnReason);return clone(s);
    }
    function validateDraft(data, id) {
      if(!companies.includes(data.company)) throw Error('请选择有权限的采购公司');
      if(!agreements.valid(data.agreement,data.supplier,data.company)) throw Error('请选择本公司与该供应商的有效合作协议');
      if(!['CNY','EUR','JPY'].includes(data.currency)) throw Error('请选择结算币种');
      if(!agreements.validDate(data.start)||!agreements.validDate(data.end)||data.start>data.end) throw Error('请填写有效的对账期间');
      if(!data.ids.length) throw Error('请至少选择一条订单费用明细');
      if(new Set(data.ids).size!==data.ids.length) throw Error('同一费用明细不能重复选择');
      return data.ids.map(key=>{
        const l=sources.find(x=>x.id===key);
        if(!l || l.company!==data.company || l.supplier!==data.supplier || l.agreement!==data.agreement || l.currency!==data.currency || l.date<data.start || l.date>data.end) throw Error('订单费用不属于当前公司、供应商、协议、币种或期间');
        const error=availability(l,id); if(error) throw Error(error);
        return clone(l);
      });
    }
    function saveDraft(data, id, submit) {
      if(role!=='merchant') throw Error('供应商不能发起我方对账');
      const old=id?get(id):null;
      if(old) requireState(old,['draft'],'merchant');
      const lines=validateDraft(data,id);
      const s=old || {id:'DZ20260926'+String(serial++).padStart(3,'0'),revision:1,history:[],events:[]};
      Object.assign(s,{company:data.company,supplier:data.supplier,agreement:data.agreement,currency:data.currency,start:data.start,end:data.end,remark:data.remark||'',lines,state:submit?'pending':'draft'});
      if(!old) statements.unshift(s);
      event(s,submit?'提交对账':'保存草稿');
      if(submit) s.history.push({revision:s.revision,lines:clone(s.lines),time:s.updated,action:'提交对账',actor:s.company});
      return clone(s);
    }
    function respond(id, revision, answers) {
      const s=get(id); requireState(s,['pending'],'supplier',revision);
      if(answers.length!==s.lines.length || new Set(answers.map(a=>a.id)).size!==answers.length) throw Error('请逐项确认全部费用明细');
      const next=s.lines.map(l=>{
        const a=answers.find(x=>x.id===l.id); if(!a || !['agree','dispute'].includes(a.result)) throw Error('请逐项选择一致或有异议');
        const row=clone(l); delete row.claim; delete row.claimReason; delete row.decision;
        if(a.result==='dispute') { if(cents(a.amount)===cents(l.amount)) throw Error('异议金额与本次对账金额一致，请核对'); if(!String(a.reason||'').trim()) throw Error('请填写异议原因和依据'); row.claim=Number(a.amount); row.claimReason=a.reason.trim(); }
        return row;
      });
      s.lines=next; s.state=next.some(l=>l.claim!==undefined)?'disputed':'confirmed';
      event(s,s.state==='confirmed'?'确认对账':'提出差异');
      s.history.push({revision:s.revision,lines:clone(s.lines),time:s.updated,action:s.state==='confirmed'?'供应商确认':'供应商异议',actor:s.supplier});
      return clone(s);
    }
    function resolve(id, revision, decisions, resubmit) {
      const s=get(id); requireState(s,['disputed'],'merchant',revision);
      if(new Set(decisions.map(d=>d.id)).size!==decisions.length || decisions.some(d=>!s.lines.some(l=>l.id===d.id && l.claim!==undefined))) throw Error('处理明细与本单异议不符');
      const next=clone(s.lines);
      decisions.forEach(d=>{
        const l=next.find(x=>x.id===d.id);
        if(d.amount==='' && !String(d.reason||'').trim()) { delete l.decision; return; }
        cents(d.amount); if(!String(d.reason||'').trim()) throw Error('请填写每条差异的处理依据');
        const amount=Number(d.amount);
        if(amount<Math.min(l.amount,l.claim)||amount>Math.max(l.amount,l.claim)) throw Error('认可金额须在本次对账金额和供应商主张金额之间；其他增减另行确认');
        l.decision={amount,reason:d.reason.trim()};
      });
      if(resubmit && next.some(l=>l.claim!==undefined && !l.decision)) throw Error('仍有差异未处理，不能重新提交');
      if(resubmit) {
        s.history.push({revision:s.revision,lines:clone(next),time:new Date().toLocaleString('sv-SE').slice(0,16),action:'我方差异处理',actor:s.company});
        next.forEach(l=>{ if(l.decision) { l.amount=l.decision.amount; l.resolution=l.decision.reason; } delete l.claim; delete l.claimReason; delete l.decision; });
        s.revision++; s.state='pending';
      }
      s.lines=next; event(s,resubmit?'重新提交对账':'保存差异处理');
      if(resubmit) s.history.push({revision:s.revision,lines:clone(next),time:s.updated,action:'重新提交对账',actor:s.company});
      return clone(s);
    }
    function voidDraft(id) { const s=get(id); requireState(s,['draft'],'merchant'); s.state='void'; event(s,'作废草稿'); return clone(s); }
    function invoice(id, revision, data) {
      const s=get(id); requireState(s,['confirmed'],'supplier',revision);
      if(s.invoice&&s.invoice.status!=='待补正') throw Error('发票材料已提交，请勿重复提交');
      const prior=s.invoice;if(prior&&(data.version!==prior.version||!String(data.reason||'').trim()))throw Error('请核对当前票据版本并填写补正说明');
      if(!String(data.no||'').trim() || !data.file) throw Error('请填写发票号码并选择发票材料');
      if(cents(data.amount)<=0 || cents(data.amount)>cents(sum(s.lines))) throw Error('本次发票金额须大于零且不超过双方确认金额');
      if(!/\.(pdf|jpe?g|png)$/i.test(data.file))throw Error('请选择PDF或图片材料');
      if(prior&&(data.buyer!==s.company||data.seller!==s.supplier||data.currency!==s.currency))throw Error('请核对票面购销方和币种');
      s.invoice={task:prior?.task||'INV-'+s.id,version:(prior?.version||0)+1,no:data.no.trim(),amount:Number(data.amount),file:data.file,status:'待财务核验',reason:String(data.reason||'').trim(),buyer:s.company,seller:s.supplier,currency:s.currency};
      (s.invoiceHistory||=[]).push({...clone(s.invoice),actor:s.supplier+'票据人员',time:new Date().toLocaleString('sv-SE').slice(0,16),action:prior?'补正重提':'提交材料'});event(s,prior?'补正发票 → '+s.company+'发票岗':'提交发票材料');return clone(s);
    }
    function refundProof(id,revision,data){
      const s=get(id);requireState(s,['confirmed'],'supplier',revision);const f=s.refund;if(!f||!['待供应商退款','材料待补充'].includes(f.status))throw Error('本退款材料已提交或无需办理');
      if(cents(data.amount)!==cents(f.amount)-cents(f.received))throw Error('请按本单剩余应退金额提交');
      if(!String(data.reference||'').trim()||!agreements.validDate(data.date)||data.date>'2026-09-26'||data.date<'2026-09-25'||!data.file||!String(data.basis||'').trim())throw Error('请填写有效退款日期、交易号、材料和说明');
      if(!/\.(pdf|jpe?g|png)$/i.test(data.file))throw Error('请选择PDF或图片材料');
      f.submissions.push({...clone(data),actor:s.supplier+'财务人员'});f.status='待采购公司核对到账';event(s,'提交退款凭据 → '+s.company+'资金岗');return clone(s);
    }
    return { role, supplier, refundProof, purchases:()=>clone(purchases.filter(purchaseVisible)), purchase:id=>clone(purchase(id)), replyPurchase, acceptPurchase, confirmService, companies:(role==='merchant'?companies:[...new Set(sources.filter(l=>l.supplier===supplier).map(l=>l.company))]).slice(), list:()=>clone(statements.filter(visible)), get:id=>clone(get(id)), sources:()=>clone(sources.filter(l=>role==='merchant'?companies.includes(l.company):l.supplier===supplier)), availability:(id,editingId)=>availability(sources.find(x=>x.id===id),editingId), billAvailability, matchBill:(data,id)=>{const m=matchBill(data,id);return {id:m.target?.state==='draft'?'':m.target?.id||'',revision:m.target?.revision??null,existing:!!m.target};}, submitBill, reviewBill, returnBill, saveDraft, respond, resolve, voidDraft, invoice };
  }
  const api={createSession,states,sum,cents};
  root.SupplierReconciliationModel=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof window==='undefined'?globalThis:window);
