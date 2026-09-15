(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./finance-funds-model.js'),require('./fund-summary-plan.js'));else root.CaesarFundDailyMonthly=factory(root.CaesarFunds,root.CaesarFundSummaryPlan);})(typeof globalThis==='object'?globalThis:this,function(base,summary){
 'use strict';
 const defaults={...base.defaults,view:'daily',start:'2026-09-30',end:'2026-09-30',month:'2026-09',classification:''};
 const valid=n=>typeof n==='number'&&Number.isFinite(n),round=n=>Math.round(n*100)/100;
 const sum=(rs,k)=>rs.every(r=>valid(r[k]))?round(rs.reduce((n,r)=>n+r[k],0)):null;
 const dateOK=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
 const next=d=>{const v=new Date(d+'T00:00:00Z');v.setUTCDate(v.getUTCDate()+1);return v.toISOString().slice(0,10);};
 const key=r=>JSON.stringify([r.company,r.currency]);
 function monthDays(month){if(!/^\d{4}-\d{2}$/.test(month)||!dateOK(month+'-01'))throw Error('请选择有效月份');const count=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).getUTCDate();return Array.from({length:count},(_,i)=>month+'-'+String(i+1).padStart(2,'0'));}
 function query(input={},data=base.fixture()){
  const q={...defaults,...input};if(!['daily','monthly'].includes(q.view))throw Error('请选择资金日报或月度执行');
  const dates=q.view==='monthly'?monthDays(q.month):[];
  if(q.view==='monthly'){q.start=dates[0];q.end=dates.at(-1);}
  if(!dateOK(q.start)||!dateOK(q.end)||q.start>q.end)throw Error('请核对实际日期范围');
  if((Date.parse(q.end)-Date.parse(q.start))/86400000>366)throw Error('资金日报请查询一年以内的日期范围');
  const src=base.query({...q,view:'periods',dataset:q.dataset==='pending'?'pending':'gaps',nature:'',keyword:''},data);
  const all=summary.query({...q,view:'periods',frequency:'day',classification:''},data);
  const categoryRows=all.sections?.find(s=>s.key==='flows')?.rows||[];
  const kinds=[...new Set(categoryRows.map(r=>r.category))];
  if(!kinds.length)kinds.push('待分类收支');
  const labels={};let columns,rows=[];
  if(q.view==='daily'){
   const categoryColumns=kinds.flatMap((c,i)=>{labels['in'+i]=c+'流入';labels['out'+i]=c+'流出';return ['in'+i,'out'+i];});
   columns=['date','company','currency','opening',...categoryColumns,'closing','restricted','available','coverage'];
   if(!src.pending){for(let d=q.start;d<=q.end;d=next(d)){
    const today=base.query({...q,start:d,end:d,view:'accounts',dataset:'gaps',nature:'',keyword:''},data);
    for(const t of today.totals){const accounts=today.accounts.filter(a=>key(a)===key(t));const flows=categoryRows.filter(r=>r.date===d&&key(r)===key(t));
     // Undated restriction amounts cannot be used as historical daily balances.
     const restrictions=accounts.map(a=>{
      const matches=(data.restrictionBalances||[]).filter(r=>r.account===a.account&&r.date===d&&dateOK(r.recorded)&&r.recorded<=q.cutoff&&r.confirmed);
      const unique=[...new Map(matches.map(r=>[JSON.stringify([r.amount,r.proof]),r])).values()];
      return unique.length===1&&unique[0].proof&&valid(unique[0].amount)&&unique[0].amount>=0&&a.closing!=null&&unique[0].amount<=a.closing?unique[0].amount:null;
     });
     const restricted=restrictions.every(valid)?round(restrictions.reduce((a,b)=>a+b,0)):null;
     const r={...t,date:d,restricted,available:t.closing==null||restricted==null?null:round(t.closing-restricted),coverage:[t.closing==null?'账面历史不足/冲突':'账面已核对',restricted==null?'当日受限资料未提供':'当日受限有依据',flows.some(r=>r.category==='待分类收支')?'含待分类收支':''].filter(Boolean).join('；')};
     kinds.forEach((c,i)=>{const part=flows.filter(r=>r.category===c);r['in'+i]=t.closing==null?null:sum(part,'incoming');r['out'+i]=t.closing==null?null:sum(part,'outgoing');});rows.push(r);
    }
   }}
  }else{
   dates.forEach((d,i)=>labels['day'+(i+1)]=(i+1)+'日');
   columns=['company','currency','nature','category','direction','total',...dates.map((_,i)=>'day'+(i+1)),'coverage'];
   if(!src.pending){
    const groups=new Map();for(const r of categoryRows){if(q.classification&&q.classification!==r.category)continue;const k=JSON.stringify([r.company,r.currency,r.nature,r.category]);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);}
    for(const rs of groups.values())for(const [direction,amount] of [['流入','incoming'],['流出','outgoing']]){
     const r={company:rs[0].company,currency:rs[0].currency,nature:rs[0].nature,category:rs[0].category,direction,coverage:[...new Set(rs.map(r=>r.coverage))].join('；')};
     dates.forEach((d,i)=>{const dayRows=rs.filter(r=>r.date===d);r['day'+(i+1)]=sum(dayRows,amount);});
     r.total=dates.every((_,i)=>valid(r['day'+(i+1)]))?round(dates.reduce((n,_,i)=>n+r['day'+(i+1)],0)):null;rows.push(r);
    }
    for(const t of src.totals){if(t.closing==null){rows.push({company:t.company,currency:t.currency,nature:'资料待核对',category:'资料待核对',direction:'范围完整性',total:null,coverage:'资金历史不足/冲突，已列流水不代表完整月合计',...Object.fromEntries(dates.map((_,i)=>['day'+(i+1),null]))});}else if(!categoryRows.some(r=>key(r)===key(t))&&!q.classification){rows.push({company:t.company,currency:t.currency,nature:'无发生',category:'无发生',direction:'净额',total:0,coverage:'该月资料覆盖且无实际收支',...Object.fromEntries(dates.map((_,i)=>['day'+(i+1),0]))});}}
   }
  }
  rows.sort((a,b)=>(a.date||'').localeCompare(b.date||'')||a.company.localeCompare(b.company,'zh-CN')||a.currency.localeCompare(b.currency));
  return {rows,columns,labels,sections:[],pending:src.pending,title:q.view==='daily'?'资金日报':'月度执行',notice:q.view==='daily'?'按实际日期、公司及原币核对期初加收减支等于期末。分类与收支汇总一致，内部调拨/平台提现独立；无当日受限依据不计算可用。':'按自然月逐日展示实际流入、流出；公司原币分列，月合计只汇总实际日期，不是预算或资金计划。资料范围缺失不补零。'};
 }
 return {defaults,query,monthDays};
});
