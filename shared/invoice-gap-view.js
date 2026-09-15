(function(){
 const parent=document.querySelector('#finance-cashflow[data-report="invoices"]'),base=window.CaesarInvoiceReport,m=window.CaesarInvoiceGapAnalysis;if(!parent||!m)return;
 for(const view of ['received','issued','paid','invoiced']){
  const sale=['received','issued'].includes(view),cashFirst=['received','paid'].includes(view),host=document.createElement('section');host.id='finance-invoice-'+view;host.className='counterparty-balance';parent.append(host);
  const labels={id:sale?'订单号':'应付号',party:sale?'客户':'供应商',company:'核算公司',currency:'原币',cash:sale?'已分配实收净额':'已分配实付净额',invoiced:sale?'已分配有效开票净额':'已分配有效收票净额',gap:({received:'已收未开金额',issued:'已开未收金额',paid:'已付未收票金额',invoiced:'已收票未付金额'})[view],due:cashFirst?(sale?'约定开票日':'约定收票日'):(sale?'约定收款日':'约定付款日'),status:'节点与差额情况',scope:sale?'对应订单号':'对应应付号',documentId:'原票/原款号',kindLabel:'凭据类别',amount:'本项分配金额',date:'分配生效日',original:'红冲/退款原单',proof:'确认依据',invoiceIds:'关联发票号',cashIds:'关联收付款号',partyId:sale?'客户编号':'供应商编号',coverage:'资料情况',invoiceDue:'约定开/收票日',cashDue:'约定收付款日'};
  window.CaesarReadonlyReport.mount(host,{title:base.views[view],views:{[view]:base.views[view]},defaults:{...base.defaults,view},query:m.query,explorer:true,clearOnError:true,labels,money:['cash','invoiced','gap','amount'],columns:()=>m.columns,extras:()=>host.querySelector('[data-fr-content]')?.value==='main'?['invoiceIds','cashIds','partyId','proof','coverage']:[],
   filters:[{key:'asOf',label:'票款余额日',type:'date'},{key:'cutoff',label:'资料截止日',type:'date'},{key:'company',label:'核算公司',options:[['','全部核算公司'],['北京凯撒','北京凯撒'],['福建凯撒','福建凯撒']]},{key:'currency',label:'原币',options:[['','全部原币（分列）'],['CNY','人民币'],['EUR','欧元']]},{key:'party',label:sale?'客户名称/编号':'供应商名称/编号'},
   {key:'keyword',label:sale?'订单号':'应付号',more:true},{key:'status',label:'节点与差额情况',options:[['','全部差额情况'],...['未到约定节点','约定节点当日','已超约定节点','节点待补','资料待核对'].map(v=>[v,v])],more:true},
   {key:'dateBasis',label:'选单日期口径',options:[['all','不限选单日期'],['issuedAt','开具日期'],...(sale?[]:[['receivedAt','收票日期']]),['processedAt','处理日期'],['cashAt',sale?'收款日期':'付款日期']],more:true},
   {key:'start',label:'选单期间开始',type:'date',more:true},{key:'end',label:'选单期间结束',type:'date',more:true}],
   onRender:host=>{host.querySelector('[data-fr-export-all]').hidden=true;const control=host.querySelector('[data-fr-content]');control.setAttribute('aria-label','统计层级');if(control.parentElement.firstChild.nodeType===3)control.parentElement.firstChild.textContent='统计层级 ';},
   definition:'按同公司、币种、客户/供应商及同订单/应付的有效分配核对。'+(cashFirst?'差额为实收付净额大于有效票额的部分。':'差额为有效票额大于实收付净额的部分。')+'只列本方向正差额及资料待核对，反方向差额归对应Tab。选单期间只限定业务对象，金额累计至余额日；组成记录仅列本页对象分配，不复制全票全款金额。节点待补不等于逾期，票款差额不等于会计收入成本或应收应付余额。正式税额基础及票款政策仍待财务确认。'});
 }
})();
