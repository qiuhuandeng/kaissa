(function(root){
  'use strict';
  const known=v=>typeof v==='number'&&Number.isFinite(v),round=v=>Math.round((v+Number.EPSILON)*100)/100;
  const sum=xs=>xs.every(known)?round(xs.reduce((n,v)=>n+v,0)):null;
  const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(Date.parse(v))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
  const categories=['交通','住宿','地接','领队','签证','保险','其他','未分类'];
  const defaults={view:'composition',start:'2026-09-01',end:'2026-09-30',cutoff:'2026-09-30',company:'',currency:'CNY',category:'',business:'',supplier:'',unit:''};
  const columns=['company','category','unit','estimated','settled','difference','variance','estimateQty','actualQty','estimatedUnit','settledUnit','status'];
  const detailColumns=['id','company','business','completed','category','item','supplier','unit','estimated','settled','difference','estimateQty','actualQty','estimatedUnit','settledUnit','leader','estimateVersion','settledDate','estimateEvidence','settlementEvidence','status'];
  function fixture(){
    const rows=[];
    function add(id,category,item,unit,estimated,settled,estimateQty,actualQty,extra={}){
      rows.push({id,company:'A公司（演示）',currency:'CNY',business:'EU20260918001 · 欧洲十国经典游',completed:'2026-09-28',category,item,unit,estimated,settled,estimateQty,actualQty,supplier:'欧洲地接ABC',leader:'不适用',estimateVersion:'出团预算V1（算例）',estimateDate:'2026-09-01',estimateEvidence:'成本预算确认（算例）',settledDate:'2026-09-29',settlementEvidence:'结算成本确认（算例）',approved:true,...extra});
    }
    add('CB202609001','交通','国际往返机票','座',60000,66000,30,30,{supplier:'国际航空CA'});
    add('CB202609002','交通','当地用车','车天',12000,11000,10,10);
    add('CB202609003','住宿','巴黎酒店','间夜',18000,19800,30,33,{supplier:'欧洲酒店会务联盟'});
    add('CB202609004','住宿','罗马酒店','间夜',12000,13200,20,22,{supplier:'欧洲酒店会务联盟'});
    add('CB202609005','地接','行程接待服务','人',15000,15600,30,30);
    add('CB202609006','领队','全程领队服务','人天',5000,5500,10,10,{supplier:'凯撒领队中心',leader:'王强'});
    add('CB202609007','签证','签证服务','人',3000,3000,30,30,{supplier:'欧洲签证服务中心'});
    add('CB202609008','保险','旅游保险','人',600,600,30,30,{supplier:'旅行保险服务商'});
    add('CB202609009','其他','补充场地费用','场',null,800,1,1,{estimateEvidence:''});
    add('CB202609010','地接','接待补差','人',900,950,30,30,{approved:false,settlementEvidence:''});
    add('CB202609011','领队','补充带团费用','人天',1000,1200,2,null,{leader:'李梅'});
    add('CB202609012','','待分类成本','次',200,220,1,1);
    add('CB202609013','保险','赠送保险','人',0,0,2,2,{supplier:'旅行保险服务商'});
    add('CB202609014','住宿','酒店包价','间夜',8000,7600,10,10,{company:'B公司（演示）',business:'JP20260918001 · 日本关西深度游',supplier:'日本地接XYZ'});
    add('CB202609015','住宿','欧洲酒店原币成本','间夜',1200,1320,4,4,{currency:'EUR',business:'EU20260920002 · 欧洲定制游'});
    return rows;
  }
  function group(rows,keys){const map=new Map();for(const r of rows){const k=JSON.stringify(keys.map(k=>r[k]));if(!map.has(k))map.set(k,[]);map.get(k).push(r);}return [...map.values()];}
  function query(input={},supplied){
    const q={...defaults,...input};
    if(![q.start,q.end,q.cutoff].every(date)||q.start>q.end||q.end>q.cutoff)throw Error('请选择有效的业务完成日期，结束日不能晚于资料截止日');
    if(q.cutoff>'2026-09-30')throw Error('当前算例资料截至2026-09-30，请选择该日或之前');
    const data=supplied||fixture();
    // One row is one cost item in one business, not the original full purchase bill.
    const unique=group(data,['company','currency','id']).map(xs=>({...xs[0],conflict:xs.some(x=>JSON.stringify(x)!==JSON.stringify(xs[0]))}));
    const facts=unique.filter(r=>date(r.completed)&&r.completed>=q.start&&r.completed<=q.end).filter(r=>!q.company||r.company===q.company).filter(r=>!q.currency||r.currency===q.currency)
      .map(r=>({...r,category:categories.includes(r.category)?r.category:'未分类',unit:r.unit||'单位未提供'}))
      .filter(r=>['category','unit'].every(k=>!q[k]||r[k]===q[k])&&['business','supplier'].every(k=>!q[k]||String(r[k]||'').includes(q[k])))
      .map(r=>{
        const errors=[];
        const estOK=!r.conflict&&known(r.estimated)&&r.estimated>=0&&r.estimateEvidence&&r.estimateVersion&&date(r.estimateDate)&&r.estimateDate<=q.cutoff;
        const setOK=!r.conflict&&known(r.settled)&&r.settled>=0&&r.approved===true&&r.settlementEvidence&&date(r.settledDate)&&r.settledDate<=q.cutoff;
        const estimated=estOK?r.estimated:null,settled=setOK?r.settled:null;
        if(r.conflict)errors.push('同号成本资料冲突');
        if(!estOK)errors.push('预计依据或金额待补');
        if(!setOK)errors.push('结算确认或金额待补');
        if(r.category==='未分类')errors.push('成本类别待确认');
        const qty=v=>!r.conflict&&known(v)&&v>=0&&r.unit!=='单位未提供'?v:null;
        const estimateQty=qty(r.estimateQty),actualQty=qty(r.actualQty);
        if(!known(estimateQty)||!known(actualQty))errors.push('数量或单位待补');
        if(estimateQty===0||actualQty===0)errors.push('零数量不计单位成本');
        return {...r,estimated,settled,estimateQty,actualQty,difference:estOK&&setOK?round(settled-estimated):null,estimatedUnit:estOK&&estimateQty>0?round(estimated/estimateQty):null,settledUnit:setOK&&actualQty>0?round(settled/actualQty):null,status:errors.join('；')||'预计与结算资料齐全'};
      });
    const rows=group(facts,['company','currency','category','unit']).map(xs=>{
      const estimated=sum(xs.map(r=>r.estimated)),settled=sum(xs.map(r=>r.settled)),estimateQty=sum(xs.map(r=>r.estimateQty)),actualQty=sum(xs.map(r=>r.actualQty));
      const difference=known(estimated)&&known(settled)?round(settled-estimated):null;
      return {company:xs[0].company,currency:xs[0].currency,category:xs[0].category,unit:xs[0].unit,estimated,settled,difference,variance:!known(difference)?'资料不足':estimated>0?(difference/estimated*100).toFixed(2)+'%':'无可比基数',estimateQty,actualQty,
        estimatedUnit:known(estimated)&&estimateQty>0?round(estimated/estimateQty):null,settledUnit:known(settled)&&actualQty>0?round(settled/actualQty):null,
        count:xs.length,status:[...new Set(xs.map(r=>r.status).filter(v=>v!=='预计与结算资料齐全'))].join('；')||'预计与结算资料齐全'};
    });
    const totals=group(facts,['company','currency']).map(xs=>({company:xs[0].company,currency:xs[0].currency,category:'查询范围合计',estimated:sum(xs.map(r=>r.estimated)),settled:sum(xs.map(r=>r.settled)),difference:sum(xs.map(r=>r.difference)),status:'跨单位仅合计金额；缺项不计完整合计'}));
    return {rows,columns:['company','currency',...columns.slice(1)],totals,sections:[{key:'details',title:'费用明细',rows:facts,columns:['id','currency',...detailColumns.slice(1)]}],title:'成本项目汇总',
      notice:'独立成本算例 · 资料截止 '+q.cutoff+' · 金额单位：原币元 · 当前 '+facts.length+' 项成本；未接正式成本来源'};
  }
  const api={query,fixture,defaults,categories,columns,sum};if(typeof module==='object'&&module.exports)module.exports=api;root.CaesarCostComposition=api;
})(typeof window==='object'?window:globalThis);
