(function (root) {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const cents = value => {
    if (value === '' || value == null || !Number.isFinite(Number(value))) throw Error('金额必须是有效数字');
    const result = Math.round(Number(value) * 100);
    if (!Number.isSafeInteger(result) || result < 0) throw Error('金额必须大于或等于零');
    return result;
  };

  const seeds = [
    { id:'COST-PAY-001', company:'北京凯撒', supplier:'北京国旅地接部', currency:'CNY', account:'中国银行 6688', tour:'YN20261018001', order:'ORD-YN-26091801', item:'云南地接综合费', cost:100000, final:null, settlement:'未结算', reconciliation:'未对账', statement:'', paid:0, refunded:0, occupied:0, invoice:'未开票', node:'预付款30%', suggested:30000, valid:true, date:'2026-10-18', basis:'已保存外采成本项' },
    { id:'COST-PAY-002', company:'福建凯撒', supplier:'欧洲联合地接社', currency:'CNY', account:'工商银行 6688', tour:'EU20260818001', order:'ORD6081800101', item:'欧洲地接综合费', cost:105000, final:101000, settlement:'未结算', reconciliation:'已对账', statement:'DZ20260926003', paid:80000, refunded:0, occupied:10000, invoice:'待收票', node:'尾款', suggested:11000, valid:true, date:'2026-08-18', basis:'供应商对账第1版已确认' },
    { id:'COST-PAY-003', actualPayments:[{id:'PAY-HOTEL-20260901',amount:70000,state:'已付款',reference:'CCB-0901-9012'},{id:'PAY-HOTEL-20260910',amount:50000,state:'已付款',reference:'CCB-0910-9012'}], company:'北京凯撒', supplier:'华北酒店管理公司', currency:'CNY', account:'建设银行 9012', tour:'BJ20261001003', order:'ORD-BJ-26090103', item:'酒店住宿费', cost:100000, final:90000, settlement:'待结算', reconciliation:'已对账', statement:'DZ20260929008', paid:120000, refunded:0, occupied:0, invoice:'未开票', node:'尾款', suggested:0, valid:true, date:'2026-10-01', basis:'最终对账金额90,000元' },
    { id:'COST-PAY-004', company:'上海凯撒', supplier:'蓝海邮轮有限公司', currency:'EUR', account:'IBAN DE88 9000', tour:'CR20261108001', order:'ORD-CR-26092001', item:'邮轮船票采购', cost:20000, final:null, settlement:'未结算', reconciliation:'未对账', statement:'', paid:5000, refunded:0, occupied:7000, invoice:'未开票', node:'二次预付', suggested:8000, valid:true, date:'2026-11-08', basis:'包舱采购成本已保存' },
    { id:'COST-PAY-005', company:'北京凯撒', supplier:'华南会务服务公司', currency:'CNY', account:'', tour:'MICE20261022001', order:'ORD-MICE-26092201', item:'会场及执行服务', cost:50000, final:null, settlement:'未结算', reconciliation:'未对账', statement:'', paid:0, refunded:0, occupied:0, invoice:'未开票', node:'预付款50%', suggested:25000, valid:true, date:'2026-10-22', basis:'外采执行成本已保存，收款账户待财务审核' },
    { id:'COST-PAY-006', company:'北京凯撒', supplier:'北京国旅地接部', currency:'CNY', account:'中国银行 6688', tour:'YN20261025002', order:'ORD-YN-26092502', item:'丽江段地接费', cost:20000, final:null, settlement:'未结算', reconciliation:'未对账', statement:'', paid:0, refunded:0, occupied:0, invoice:'未开票', node:'预付款30%', suggested:6000, valid:true, date:'2026-10-25', basis:'已保存外采成本项' },
    { id:'COST-PAY-007', company:'福建凯撒', supplier:'海峡车队', currency:'CNY', account:'农业银行 7711', tour:'FJ20261003001', order:'ORD-FJ-26093001', item:'旅游用车', cost:90000, final:90000, settlement:'已结算', reconciliation:'已对账', statement:'DZ20260929009', paid:60000, refunded:0, occupied:0, invoice:'已收票', node:'尾款', suggested:30000, valid:true, date:'2026-10-03', basis:'最终对账金额90,000元' }
  ];

  const initialRequests = [
    { id:'PAY-REQ-20260926-001', kind:'付款', company:'福建凯撒', supplier:'欧洲联合地接社', currency:'CNY', account:'工商银行 6688', amount:10000, date:'2026-09-30', state:'审批中', next:'福建凯撒付款复核岗', basis:'按已确认对账金额申请部分尾款', lines:[{id:'COST-PAY-002',amount:10000}], history:['2026-09-26 10:20 提交付款申请'] },
    { id:'PAY-REQ-20260925-002', kind:'预付款', company:'上海凯撒', supplier:'蓝海邮轮有限公司', currency:'EUR', account:'IBAN DE88 9000', amount:7000, date:'2026-10-01', state:'付款中', next:'上海凯撒资金岗', basis:'包舱协议第二付款节点', lines:[{id:'COST-PAY-004',amount:7000}], history:['2026-09-25 16:40 审批通过','2026-09-26 09:20 进入付款中'] },
    { id:'PAY-REQ-20260920-003', kind:'预付款', company:'北京凯撒', supplier:'北京国旅地接部', currency:'CNY', account:'中国银行 6688', amount:15000, date:'2026-09-22', state:'驳回待重提', next:'北京凯撒计调', basis:'首笔资源预付', lines:[{id:'COST-PAY-001',amount:15000}], history:['2026-09-20 14:10 财务退回：请补采购协议付款节点'] }
  ];

  function createSession() {
    const costs = copy(seeds);
    const requests = copy(initialRequests);
    let serial = 4;

    function compute(row) {
      const basis = row.final == null ? row.cost : row.final;
      const netPaid = row.paid - row.refunded;
      const available = Math.max(0, cents(basis) - cents(netPaid) - cents(row.occupied)) / 100;
      const refundDue = Math.max(0, cents(netPaid) - cents(basis)) / 100;
      let state = '已付清';
      if (!row.valid) state = '成本无效';
      else if (refundDue > 0) state = '供应商应退';
      else if (!row.account) state = '账户待审核';
      else if (available > 0 && row.occupied > 0) state = '部分可申请';
      else if (available > 0) state = '可申请';
      else if (row.occupied > 0) state = '申请中';
      return {...copy(row), basis, netPaid, available, refundDue, state};
    }

    function list() { return costs.map(compute); }
    function get(id) { const row=costs.find(item=>item.id===id); if(!row)throw Error('未找到付款成本项'); return compute(row); }
    function group(ids) {
      if(!Array.isArray(ids)||!ids.length)throw Error('请至少选择一条可申请成本');
      const rows=ids.map(get);
      if(new Set(ids).size!==ids.length)throw Error('同一成本项不能重复选择');
      if(rows.some(row=>!row.valid||row.available<=0||row.refundDue>0))throw Error('所选成本包含不可付款或供应商应退项目');
      const key=row=>[row.company,row.supplier,row.currency,row.account].join('|');
      if(new Set(rows.map(key)).size!==1)throw Error('批量申请必须属于同一采购公司、供应商、币种和收款账户');
      if(!rows[0].account)throw Error('供应商收款账户尚未通过财务审核');
      return rows;
    }

    function save(data, submit) {
      const rows=group(data.lines?.map(line=>line.id));
      if(data.company!==rows[0].company||data.supplier!==rows[0].supplier||data.currency!==rows[0].currency||data.account!==rows[0].account)throw Error('付款公司、供应商、币种或收款账户与成本项不一致');
      const seen=new Set();let total=0;
      const lines=data.lines.map(line=>{
        const row=rows.find(item=>item.id===line.id);
        if(!row||seen.has(line.id))throw Error('付款明细重复或不属于本次成本范围');
        seen.add(line.id);const amount=cents(line.amount)/100;
        if(amount<=0||cents(amount)>cents(row.available))throw Error('每条付款金额须大于零且不超过可申请金额');
        total+=cents(amount);return {id:row.id,tour:row.tour,order:row.order,item:row.item,amount};
      });
      const date=String(data.date||'');
      if(submit&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<'2026-09-29'))throw Error('期望付款日期不得早于本次业务日');
      if(submit&&!String(data.basis||'').trim())throw Error('请填写本次付款依据');
      if(!['预付款','付款'].includes(data.kind))throw Error('请选择付款性质');
      const request={id:'PAY-REQ-20260929-'+String(serial++).padStart(3,'0'),kind:data.kind,company:rows[0].company,supplier:rows[0].supplier,currency:rows[0].currency,account:rows[0].account,amount:total/100,date,basis:String(data.basis||'').trim(),attachment:String(data.attachment||''),state:submit?'待财务复核':'草稿',next:submit?rows[0].company+'付款复核岗':rows[0].company+'计调',lines,history:[new Date().toLocaleString('sv-SE').slice(0,16)+' '+(submit?'提交财务复核':'保存草稿')]};
      requests.unshift(request);
      if(submit) lines.forEach(line=>{costs.find(row=>row.id===line.id).occupied+=line.amount;});
      return copy(request);
    }

    function request(id){const row=requests.find(item=>item.id===id);if(!row)throw Error('未找到付款申请');return copy(row);}
    return {list,get,group,save,requests:()=>copy(requests),request};
  }

  const api={createSession,cents};
  root.SupplierPaymentApplicationModel=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
