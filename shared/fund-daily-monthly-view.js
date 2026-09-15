(function(){
 const parent=document.querySelector('#finance-cashflow[data-report="funds"]'),m=window.CaesarFundDailyMonthly;if(!parent||!m)return;
 const revealTab=()=>requestAnimationFrame(()=>{const nav=document.querySelector('.report-section-switch'),tab=nav?.querySelector('[aria-selected="true"]');if(!tab)return;const n=nav.getBoundingClientRect(),t=tab.getBoundingClientRect();if(t.right>n.right)nav.scrollLeft+=t.right-n.right+16;else if(t.left<n.left)nav.scrollLeft-=n.left-t.left+16;});
 window.addEventListener('resize',revealTab);window.addEventListener('caesar:report-view-changed',revealTab);
 for(const view of ['daily','monthly']){
  const daily=view==='daily',title=daily?'资金日报':'月度执行',host=document.createElement('section');host.id='finance-fund-'+view;host.className='counterparty-balance';parent.append(host);
  const labels={date:'实际日期',company:'资金公司',currency:'原币',opening:'期初账面余额',closing:'期末账面余额',restricted:'当日受限金额',available:'当日账面可用',coverage:'资料情况',nature:'收支性质',category:'资金类别',direction:'收支方向',total:'月合计'};
  const query=q=>{const r=m.query(q);Object.assign(labels,r.labels);return r;};
  window.CaesarReadonlyReport.mount(host,{title,defaults:{...m.defaults,view},views:{[view]:title},query,explorer:true,clearOnError:true,labels,columns:()=>[],money:['opening','closing','restricted','available','total',...Array.from({length:31},(_,i)=>'day'+(i+1)),...Array.from({length:100},(_,i)=>['in'+i,'out'+i]).flat()],extras:[],
   filters:[...(daily?[{key:'start',label:'实际日期开始',type:'date'},{key:'end',label:'实际日期结束',type:'date'}]:[{key:'month',label:'执行月份',type:'month'}]),{key:'cutoff',label:'资料截止日',type:'date'},{key:'company',label:'资金公司',options:[['','全部资金公司（分列）'],...['北京凯撒','福建凯撒','待核对公司'].map(v=>[v,v])]},{key:'currency',label:'原币',options:[['','全部原币（分列）'],['CNY','人民币'],['EUR','欧元']]}],
   onRender:host=>{host.querySelector('[data-fr-export-all]').hidden=true;host.querySelector('.cf-columns').hidden=true;},definition:daily?'资金人员按日期核对公司实际资金；期初加各类别流入减各类别流出等于期末，内部调拨和提现保留账户两端。实际收付不等同收入成本；未提供当日受限资料时不计算当日可用。':'公司与原币分别查询资金类别的逐日实际执行，流入和流出分行，月合计与收支汇总同范围可核对。自然月自动28/29/30/31天，不含未来计划、预算差异或预测；缺失资料不作为零发生。'});
 }
})();
