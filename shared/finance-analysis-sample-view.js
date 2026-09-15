(function(){
  'use strict';
  const parent=document.getElementById('finance-cashflow');if(!parent)return;
  const base=window.CaesarCashflow,renderer=window.CaesarReadonlyReport;
  const companies=[['','全部公司'],['北京凯撒旅游','北京凯撒旅游'],['福建凯撒旅游','福建凯撒旅游']];
  const currencies=[['','全部币种'],['CNY','人民币 CNY'],['USD','美元 USD']];
  function onRender(host,q,result){
    host.querySelector('[data-fr-explorer] h2')?.setAttribute('hidden','');
    const print=host.querySelector('[data-cf-print]');if(print){print.hidden=q.view!=='receipt';print.disabled=result.pending||!result.rows.length;}
  }
  if(parent.dataset.report==='cashflow'){
    const m=window.CaesarCashflowAnalysis;
    parent.classList.add('finance-analysis-sample');
    const api=renderer.mount(parent,{title:'收付明细',showTitle:false,explorer:true,clearOnError:true,blankTotalText:true,exportTotals:true,humanDates:true,defaults:m.defaults,views:m.views,labels:m.labels,money:m.money,columns:m.columns,
      extras:q=>q.view==='trace'?['original','transaction','proof','reason']:q.view==='writeoffs'?['original','proof']:q.view==='allocations'?['root','product','departure','returned','distributor','proof']:['account','transaction','contractCompany','product','departure','returned','distributor','rate','converted','proof','confirmedAt'],
      filters:[
        {key:'dateBasis',label:'日期依据',options:[['actualAt','实际资金日期'],['confirmedAt','财务确认日期']],visible:q=>['receipt','refund','payment'].includes(q.view)},
        {key:'allocationDate',label:'日期依据',options:[['','分配确认日期']],visible:q=>q.view==='allocations'},
        {key:'writeoffDate',label:'日期依据',options:[['','核销确认日期']],visible:q=>q.view==='writeoffs'},
        {key:'transferDate',label:'日期依据',options:[['','转款确认日期']],visible:q=>q.view==='transfer'},
        {key:'start',label:'统计日期自',type:'date',visible:q=>q.view!=='trace'},
        {key:'end',label:'统计日期至',type:'date',visible:q=>q.view!=='trace'},
        {key:'company',label:'实际资金公司',options:companies},
        {key:'currency',label:'币种',options:currencies},
        {key:'kind',label:'分配类别',options:Object.entries(base.types),visible:q=>q.view==='allocations'},
        {key:'keyword',label:'资金/核销/原款单号'},
        {key:'order',label:'订单号',visible:q=>['allocations','writeoffs'].includes(q.view)},
        {key:'status',label:'核对情况',options:[['','全部核对情况'],['verified','已核实'],['issues','需核对']]},
        {key:'cutoff',label:'资料截止时间',type:'datetime-local',more:true}
      ],query:m.query,onRender,
      definition:'资金按实际发生日，转款按确认日；退款转预存按财务确认日查询。分配和核销各按自身确认日期，不与实际资金相加。原款追溯按资料截止还原完整链，原记录金额不合计；原款未退/转存余额不等于订单可用金额。有效分配金额不含待核对记录。金额单位元，各公司原币分别核对。当前为独立原型资料，正式数据及政策待接入。'});
    const button=document.createElement('button');button.type='button';button.className='btn btn-secondary';button.dataset.cfPrint='';button.textContent='打印收款清单';parent.querySelector('.cf-filter-actions').append(button);
    const printArea=document.createElement('div');printArea.className='cf-print';printArea.dataset.cfPrintArea='';parent.append(printArea);
    button.addEventListener('click',()=>{
      if(button.disabled||api.applied().view!=='receipt')return;
      const q=api.applied(),result=m.query(q),chosen=new Set(result.rows.map(base.key));
      const data=base.query({...base.defaults('receipt'),start:q.start,end:q.end,cutoff:q.cutoff,company:q.company,currency:q.currency,dateBasis:q.dateBasis},m.fixture());
      const rows=data.allocations.filter(r=>r.valid&&chosen.has(base.key({...r,id:r.sourceId})));
      const headings=['序号','收款单号','订单号','交款人','分配金额','银行收款时间','分销商','产品名称','出团日期','回团日期','款项类别','备注说明'];
      printArea.innerHTML=[...new Set(result.rows.map(r=>r.company))].map(company=>{
        const selected=rows.filter(r=>r.company===company),sources=result.rows.filter(r=>r.company===company);
        const table='<table><thead><tr>'+headings.map(s=>'<th>'+s+'</th>').join('')+'</tr></thead><tbody>'+selected.map((r,i)=>'<tr>'+[i+1,r.sourceId,r.order,r.party,base.fmt(r.amount)+' '+r.currency,r.actualAt?.replace('T',' '),r.distributor,r.product,r.departure,r.returned,r.category,r.note||'已确认订单分配'].map(v=>'<td>'+base.esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
        return '<section class="cf-print-company"><h2>'+base.esc(company)+' · 收款清单</h2><p>原型核对资料；统计期间 '+base.esc(q.start)+' 至 '+base.esc(q.end)+'；按订单分配，不代替实际收款凭证。</p>'+table+'<p>'+sources.map(r=>base.esc(r.id)+'：实际收入 '+base.fmt(r.cashIn)+' '+base.esc(r.currency)+'，未分配 '+base.fmt(r.unallocated)).join('；')+'</p></section>';
      }).join('');
      document.body.classList.add('cf-printing');try{window.print();}finally{document.body.classList.remove('cf-printing');}
    });
    api.refresh();
  }
  if(parent.dataset.report==='balances'){
    const m=window.CaesarOrderCashPosition,host=document.createElement('div');host.id='finance-order-cash';host.className='finance-analysis-sample';parent.append(host);
    renderer.mount(host,{title:'订单收付',showTitle:false,explorer:true,clearOnError:true,blankTotalText:true,exportTotals:true,humanDates:true,defaults:m.defaults,views:{orders:'订单收付'},labels:m.labels,money:m.amountKeys,columns:()=>m.columns,
      extras:['product','arOffset','transfer','apOffset','arCash','apCash','arBalance','apBalance','receiptUnwritten','paymentUnwritten','fundsCompanies','salesCompany','productCompany'],
      filters:[{key:'asOf',label:'收付截止日',type:'date'},{key:'company',label:'核算公司',options:companies},{key:'currency',label:'币种',options:currencies},{key:'order',label:'订单号'},{key:'party',label:'付款客户'},{key:'status',label:'核对情况',options:[['','全部核对情况'],['issues','需核对'],['open','未收或未付']]},{key:'cutoff',label:'资料截止时间',type:'datetime-local',more:true}],
      query:m.query,onRender,definition:'每行一个核算公司、原币及订单服务/阶段。实收实付取截至当日已确认资金分配净额，含有效退回；未分配资金不猜分到订单。未收=应收−实收分配−转入净额−其他预款及减免抵收，未付=应付−实付分配−预付及减免抵付；账面余额按实际核销另列。负差额保留核对，不能称利润。缺金额或完整历史显示未提供；当前独立原型资料，正式取数和财务政策待确认。'});
  }
})();
