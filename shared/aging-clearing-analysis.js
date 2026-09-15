(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./finance-balances-model.js'));
 else root.CaesarAgingClearing=factory(root.CaesarBalances);
})(typeof globalThis==='object'?globalThis:this,function(base){
 const known=v=>typeof v==='number'&&Number.isFinite(v),sum=vs=>vs.every(known)?base.sum(vs):null;
 const agingColumns=['party','company','currency','outstanding','b0','b1','b2','b3','b4','reverse','coverage','ledger'];
 const clearingColumns=['relation','clearingType','arCompany','apCompany','currency','arBalance','apBalance','difference','pairStatus','arLedger','apLedger'];
 function aging(input={},data){
  const q={...base.defaults(),...input,view:'aging',ageBasis:'age',group:'party'},source=base.query(q,data),groups=new Map();
  if(source.pending)return {...source,title:'往来单位账龄分布',columns:agingColumns,sections:[]};
  source.details.forEach(r=>{const k=JSON.stringify([r.company,r.ledger,r.currency,r.type,r.scope,r.partyId||r.docKey]);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);});
  const rows=[...groups.values()].map(rs=>{const unknown=rs.some(r=>!known(r.balance)),r=rs[0],buckets={};
   for(let i=0;i<5;i++)buckets['b'+i]=unknown?null:sum(rs.map(d=>d.balance>0&&known(d.ageDays)&&(d.ageDays<=30?0:d.ageDays<=60?1:d.ageDays<=90?2:d.ageDays<=180?3:4)===i?d.balance:0));
   return {party:[...new Set(rs.map(d=>d.party))].join(' / '),company:r.company,ledger:r.ledger,currency:r.currency,scope:r.scope,partyId:r.partyId,count:rs.length,...buckets,
    outstanding:unknown?null:sum(rs.map(d=>Math.max(0,d.balance))),reverse:unknown?null:sum(rs.map(d=>Math.min(0,d.balance))),balance:sum(rs.map(d=>d.balance)),
    coverage:unknown?'余额资料不足，分布未确定':'账龄按确认日计算'};});
  return {rows,title:'往来单位账龄分布',columns:agingColumns,pending:false,sections:[{key:'documents',title:'同范围账龄单据',columns:['id','party','company','currency','balance','confirmedAt','ageDays','ledger','scope','issue'],rows:source.details}],notice:source.notice+'；应收/应付分别查看，账龄从确认日计算，与合同是否逾期不同。正向余额按账龄分段，反向余额单列；未知金额不补零。分段为原型分析约定，待财务确认。'};
 }
 function clearing(input={},data){
  const q={...base.defaults(),...input,view:'clearing'},selected=base.query(q,data);
  if(selected.pending)return {...selected,title:'内部双方余额对照',columns:clearingColumns,sections:[]};
  const full=base.query({...base.defaults(),dataset:q.dataset,asOf:q.asOf,cutoff:q.cutoff,view:'clearing'},data),byKey=new Map(full.details.map(r=>[r.docKey,r]));
  const pairs=new Map();
  selected.details.forEach(d=>{const peer=d.peerId?byKey.get(d.peerKey):null,key=JSON.stringify(peer?[d.docKey,peer.docKey].sort():[d.docKey]);if(!pairs.has(key))pairs.set(key,peer?[d,peer]:[d]);});
  const rows=[],details=[];
  pairs.forEach(ds=>{const ar=ds.find(d=>d.type==='ar'),ap=ds.find(d=>d.type==='ap'),d=ar||ap,
   difference=ar&&ap&&known(ar.balance)&&known(ap.balance)?base.sum([ar.balance,-ap.balance]):null;
   rows.push({relation:d.relation,clearingType:d.clearingType,arCompany:ar?.company||ap.peerCompany,apCompany:ap?.company||ar.peerCompany,currency:d.currency,
    arBalance:ar?.balance??null,apBalance:ap?.balance??null,difference,arLedger:ar?.ledger,apLedger:ap?.ledger,
    pairStatus:!ar||!ap?'对方记录未对应':difference==null?'双方资料不足':difference===0?'双方余额一致':'双方余额有差异'});
   ds.forEach(r=>details.push({...r,directionLabel:r.type==='ar'?'内部应收':'内部应付'}));
  });
  return {rows,title:'内部双方余额对照',columns:clearingColumns,pending:false,sections:[{key:'documents',title:'同范围双方单据',columns:['relation','directionLabel','company','peerCompany','currency','balance','id','ledger','clearingType','issue'],rows:details}],notice:selected.notice+'；每组已对应内部应收/应付只列一次，差额=应收方余额-应付方余额。公司等条件选择清算关系，组成保留其对应双方，不将两边余额相加。缺对方不填零，不视作集团抵销；当前资料仅覆盖代收代付。'};
 }
 return {aging,clearing,agingColumns,clearingColumns};
});
