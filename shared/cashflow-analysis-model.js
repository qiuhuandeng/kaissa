(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./finance-cashflow-model.js'):root.CaesarCashflow);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.CaesarCashflowAnalysis=api;
})(typeof globalThis==='object'?globalThis:this,function(base){
  'use strict';
  const views={...base.types,allocations:'收付分配',writeoffs:'核销明细',trace:'原款追溯'};
  const defaults={dataset:'demo',view:'receipt',start:'2026-09-01',end:'2026-10-31',cutoff:'2026-10-31T23:59',company:'',currency:'',keyword:'',order:'',kind:'receipt',dateBasis:'actualAt',status:''};
  const labels={id:'单据号',sourceId:'资金单号',company:'实际资金公司',currency:'币种',party:'收付款对象',actualAt:'实际资金日期',confirmedAt:'确认日期',date:'核销日期',typeLabel:'业务类别',method:'收付方式',cashIn:'实际收入',cashOut:'实际支出',nonCashAmount:'非现金处理',allocated:'已分配金额',unallocated:'未分配金额',allocation:'有效分配金额',amount:'原记录金额',writeoffAmount:'有效核销金额',recordAmount:'分配记录金额',reference:'核销单号',target:'应收应付单号',kind:'处理类别',order:'订单号',fromOrder:'原订单号',toOrder:'目标订单号',root:'原收款单号',previous:'上次转款号',transaction:'银行/平台流水号',original:'原记录号',proof:'确认依据',issue:'核对情况',result:'核对情况',account:'收付款账户',category:'款项类别',contractCompany:'合同公司',product:'产品名称',departure:'出团日期',returned:'回团日期',distributor:'分销商/门店',rate:'交易汇率',converted:'折合人民币',reason:'原因',sourceRemaining:'原款未退/转存余额',originalTransaction:'原款流水号'};
  const money=['cashIn','cashOut','nonCashAmount','allocated','unallocated','allocation','amount','recordAmount','writeoffAmount','converted','sourceRemaining'];
  const columns=q=>({receipt:['id','company','currency','party','actualAt','method','cashIn','allocated','unallocated','result'],refund:['id','company','currency','party','actualAt','confirmedAt','method','cashOut','nonCashAmount','root','result'],payment:['id','company','currency','party','actualAt','cashOut','cashIn','allocated','unallocated','result'],transfer:['id','company','currency','confirmedAt','fromOrder','toOrder','nonCashAmount','root','previous','result'],allocations:['id','sourceId','typeLabel','company','currency','order','confirmedAt','recordAmount','allocation','result'],writeoffs:['id','reference','sourceId','kind','target','order','company','currency','date','writeoffAmount','result'],trace:['root','id','typeLabel','company','currency','confirmedAt','fromOrder','toOrder','amount','previous','originalTransaction','sourceRemaining','result']}[q.view]);
  function fixture(){
    const d=base.fixture();
    // Explicit source relationships for the two existing writeoffs; never infer a target from equal amounts.
    const payment=d.records.find(r=>r.id==='FK26090501');
    d.evidence.filter(e=>e.sourceKey===base.key(payment)&&e.kind==='应付核销').forEach((e,i)=>{e.order='KS202609050'+(i+1);e.target='AP-'+e.order;});
    const receipt=d.records.find(r=>r.id==='SK26090201');
    d.evidence.push({id:'EV-AR-0902',sourceKey:base.key(receipt),kind:'应收核销',amount:50000,currency:'CNY',date:'2026-09-20T10:00:00',enteredAt:'2026-09-20T11:00:00',reference:'HX-AR-0902',target:'AR-KS2026090201',order:'KS2026090201',verified:true});
    d.evidence.push({id:'EV-AR-CH-1002',sourceKey:base.key(receipt),kind:'应收核销',amount:-10000,currency:'CNY',date:'2026-10-02T10:00:00',enteredAt:'2026-10-02T11:00:00',reference:'HX-CH-1002',target:'AR-KS2026090201',order:'KS2026090201',original:'EV-AR-0902',verified:true});
    return d;
  }
  const dateOK=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
  function query(input,data=fixture()){
    const q={...defaults,...input};
    if(!views[q.view])throw Error('请选择有效报表主题');
    if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(q.cutoff)||!dateOK(q.cutoff.slice(0,10))||+q.cutoff.slice(11,13)>23||+q.cutoff.slice(14,16)>59)throw Error('请填写有效资料截止时间');
    if(q.view!=='trace'&&(!dateOK(q.start)||!dateOK(q.end)||q.start>q.end))throw Error('请核对查询起止日期');
    if(!['actualAt','confirmedAt'].includes(q.dateBasis)||!base.types[q.kind])throw Error('查询条件无效');
    const empty={rows:[],sections:[],totals:[],pending:true,title:views[q.view],notice:'独立核对资料；正式来源待接入'};
    if(q.dataset!=='demo')return empty;
    if((q.view!=='trace'&&(q.start<data.start||q.end>data.end))||q.cutoff.slice(0,10)>data.end||q.cutoff.slice(0,10)<data.start)return {...empty,notice:'查询超出资料覆盖期，无法完整还原'};
    const inPeriod=v=>v&&(!q.start||v.slice(0,10)>=q.start)&&(!q.end||v.slice(0,10)<=q.end);
    const baseQuery=type=>({...base.defaults(type),dataset:q.dataset,type,company:q.company,currency:q.currency,cutoff:q.cutoff});
    let rows=[],totals=[];
    if(base.types[q.view]||q.view==='allocations'){
      const type=base.types[q.view]?q.view:q.kind;
      const sub={...baseQuery(type),start:q.start,end:q.end,keyword:q.keyword,order:q.view==='allocations'?q.order:'',mode:q.view==='allocations'?'allocations':'documents',dateBasis:q.view==='allocations'||q.view==='transfer'?'confirmedAt':q.dateBasis};
      const r=base.query(sub,data);
      rows=r.rows.map(row=>({...row,typeLabel:base.types[row.type],recordAmount:row.amount}));
      if(q.status==='issues'){
        const seen=new Set(rows.map(r=>r.id+'|'+r.company));
        // Missing-date and quarantined source records remain inspectable in the same fact table.
        for(const x of r.exceptions){
          if(q.view!=='allocations'&&x.sourceId||!inPeriod(x[sub.dateBasis])||x.type!==type||q.keyword&&![x.id,x.transaction,x.party,x.root].some(v=>String(v||'').includes(q.keyword))||q.view==='allocations'&&!x.sourceId)continue;
          const k=x.id+'|'+x.company;if(seen.has(k))continue;seen.add(k);
          rows.push({...x,cashIn:null,cashOut:null,nonCashAmount:null,allocated:null,unallocated:null,allocation:null,recordAmount:x.amount,result:x.issue});
        }
      }
      if(q.status==='issues')rows=rows.filter(r=>r.issue);
      if(q.status==='verified')rows=rows.filter(r=>!r.issue);
      const groups=new Map();
      rows.forEach(r=>{const k=JSON.stringify([r.company,r.currency]);if(!groups.has(k))groups.set(k,{id:'合计',company:r.company,currency:r.currency});const g=groups.get(k);for(const f of ['cashIn','cashOut','nonCashAmount','allocation','allocated','unallocated']){if(!g[f])g[f]=[];g[f].push(r[f]);}});
      totals=[...groups.values()].map(g=>{for(const f of ['cashIn','cashOut','nonCashAmount','allocation','allocated','unallocated'])g[f]=g[f].some(v=>!base.money(v))?null:base.sum(g[f]);return g;});
    }else{
      // Source selection has no event-period filter. Writeoff dates and trace cutoff are independent of cash dates.
      const results=Object.keys(base.types).map(type=>base.query({...baseQuery(type),start:'',end:'',dateBasis:'confirmedAt'},data));
      const sources=results.flatMap(r=>r.sources).filter(r=>r.confirmedAt<=q.cutoff+':59'),byKey=new Map(sources.map(r=>[base.key(r),r]));
      if(q.view==='writeoffs'){
        const evidence=results.flatMap(r=>r.evidence).filter(e=>/^(应收核销|应付核销|预付冲抵)$/.test(e.kind)).sort((a,b)=>a.date.localeCompare(b.date));
        const applied=new Map(),reversed=new Map();
        rows=evidence.map(e=>{
          const s=byKey.get(e.sourceKey),original=applied.get(e.original);let issue='';
          if(!e.verified||!base.money(e.amount)||!e.target||!e.reference||!dateOK(e.date?.slice(0,10)))issue='核销金额、单据或确认依据不完整';
          if(e.kind!=='预付冲抵'&&!s?.cashValid)issue='原资金未核实';
          if(e.amount<0&&(!original||original.sourceKey!==e.sourceKey||original.target!==e.target||original.kind!==e.kind||original.original||Math.abs(e.amount)+(reversed.get(e.original)||0)>original.amount))issue='冲回缺原记录或超过原核销金额';
          if(!issue){applied.set(e.id,e);if(e.original)reversed.set(e.original,(reversed.get(e.original)||0)+Math.abs(e.amount));}
          return {...e,company:s.company,sourceId:s.id,writeoffAmount:issue?null:e.amount,result:issue||'已确认',issue};
        }).filter(e=>e.date<=q.cutoff+':59'&&inPeriod(e.date)&&(!q.order||(e.order||'').includes(q.order))&&(!q.keyword||[e.id,e.reference,e.sourceId,e.target].some(v=>(v||'').includes(q.keyword))));
      }else{
        const all=results.flatMap(r=>r.trace),unique=new Map();all.forEach(r=>unique.set(base.key(r),r));
        const byId=new Map([...unique.values()].map(r=>[r.id,r]));
        rows=sources.filter(r=>r.type!=='payment').map(r=>{
          const roots=(r.type==='receipt'?r.id:r.root||'').split(' / ');const origin=roots.length===1?byId.get(roots[0]):null;
          const refunds=sources.filter(x=>x.type==='refund'&&(x.root||'').split(' / ').includes(r.id));
          const amounts=refunds.map(x=>{if(!(x.noncash?x.confirmValid:x.cashValid))return null;if(x.root===r.id)return x.amount;const shares=results.flatMap(v=>v.allocations).filter(a=>a.sourceId===x.id&&a.root===r.id);return shares.length&&shares.every(a=>a.valid)?base.sum(shares.map(a=>a.amount)):null;});
          const sourceRemaining=r.type==='receipt'&&r.cashValid&&amounts.every(base.money)?base.sum([r.amount,...amounts.map(x=>-x)]):null;
          return {...r,root:r.type==='receipt'?r.id:r.root,typeLabel:base.types[r.type],originalTransaction:origin?.transaction||'',sourceRemaining,result:r.issue||r.status};
        });
        if(q.keyword){
          const matched=rows.filter(r=>[r.id,r.root,r.previous,r.originalTransaction].some(v=>(v||'').includes(q.keyword)));
          const roots=new Set(matched.flatMap(r=>(r.root||'').split(' / ')).filter(Boolean));
          rows=rows.filter(r=>matched.includes(r)||(r.root||'').split(' / ').some(id=>roots.has(id)));
        }
      }
      if(q.status==='issues')rows=rows.filter(r=>r.issue);
      if(q.status==='verified')rows=rows.filter(r=>!r.issue);
    }
    return {rows,totals,sections:[],title:views[q.view],pending:false,notice:'独立核对算例；金额单位元，按公司原币分别核对；资料截止 '+q.cutoff};
  }
  return {views,defaults,labels,money,columns,fixture,query};
});
