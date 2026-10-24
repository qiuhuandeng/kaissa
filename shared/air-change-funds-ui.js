(function(){'use strict';
window.createAirChangeFundsViews=function(h){
 const C=window.AirChangeFunds,F=window.AirFunds,{getFunds,getBusiness,open,section,facts,grid,field,btn,link,table,ln,m,E,val,persist,render,notify}=h;
 const v=id=>C.view(getFunds(),getBusiness(),id),back=id=>btn('返回退改款项','cf-view',id);
 function show(id){const a=v(id),c=a.change;
  const body=facts([['原订单',c.orderId],['原团号',a.order.group||'无团散票'],['原票',c.results.map(r=>r.oldTicket||r.newTicket||'整单费用').join('、')],['业务结果',c.effective?'已生效':'待业务确认']])+['customer','supplier'].map(side=>{
   const s=a[side],title=side==='customer'?'客户款项':'供应商款项';
   const actions=!c[side].ledgerManaged&&c[side].state==='结果待查'?btn('查询历史结果','cf-legacy',id+'|'+side):c.effective&&s.remaining>0?btn(s.delta<0?'办理退回／冲减':side==='customer'?'申请补收':'申请补付','cf-start',id+'|'+side):'';
   return section(title,facts([['应退／应补',m(s.delta,c.currency)],['已处理',m(s.done,c.currency)],['剩余可办理',m(s.remaining,c.currency)],['当前结果',c[side].state]])+table(['办理方式 / 原款','本次金额 / 已完成','结果 / 回执','操作'],s.rows.map(x=>'<tr><td>'+ln(x.kind)+ln(x.original,true)+'</td><td>'+ln(m(x.amount,c.currency))+ln('已完成 '+m(x.done,c.currency),true)+'</td><td>'+ln(x.state)+ln(x.ref,true)+'</td><td>'+(x.kind==='原款退款'?link('退款详情','refund',x.id):x.kind==='客户补收'?link('收款详情','pay',x.id):x.kind==='供应商补付'?link('付款详情','request',x.id):['失败','结果待查'].includes(x.state)?link(x.state==='结果待查'?'查询结果':'重新办理','cf-retry',id+'|'+side+'|'+x.id):'查看记录')+'</td></tr>'),[null,175,180,110],true)+(s.legacy?'<p class="ab-muted">历史已登记 '+E(m(s.legacy,c.currency))+'，原款归属待核；可退余额已扣减该金额。</p>':'')+actions);
  }).join('')+section('原收款分配',table(['原流水 / 付款方','已到账','本单可退','操作'],a.receipts.map(r=>'<tr><td>'+ln(r.ref)+ln(r.payer,true)+'</td><td>'+m(r.amount,c.currency)+'</td><td>'+m(r.available,c.currency)+'</td><td>'+link('原款','receipt',r.id)+'</td></tr>'),[null,140,140,90],true))+section('原付款与平台扣款',table(['原单 / 回执','原金额','可退余额','操作'],[...a.payments.map(r=>'<tr><td>'+ln(r.id)+ln(r.ref,true)+'</td><td>'+m(F.executed(r),c.currency)+'</td><td>'+m(r.available,c.currency)+'</td><td>'+link('原付款','request',r.id)+'</td></tr>'),...a.debits.map(r=>'<tr><td>'+ln(r.ref)+ln(r.airlineOrder,true)+'</td><td>'+m(r.amount,c.currency)+'</td><td>'+m(r.available,c.currency)+'</td><td>'+link('平台','platform',r.account)+'</td></tr>')],[null,140,140,90],true));
  open('退改款项 · '+id,body,'',{kind:'change-funds',id});
 }
 function start(id,side,kind='',retry='',original=''){
  const a=v(id),s=a[side],c=a.change,old=retry?s.rows.find(x=>x.id===retry):null;
  if(s.delta>0){if(side==='supplier'){const source=C.supplement(getFunds(),getBusiness(),id);persist();h.newRequest('',source.id);return;}open('申请客户补收',facts([['原退改单',id],['原订单',c.orderId]])+grid(field('本次补收','amount',s.remaining,'number')+field('收款账户','accountId',F.collectionAccounts().find(x=>x.currency===c.currency)?.id,'text',F.collectionAccounts().filter(x=>x.currency===c.currency).map(x=>[x.id,x.name]))),back(id)+btn('提交收款申请','cf-collect',id,true),{kind:'change-collect',id});return;}
  kind=old?.kind||kind||(side==='customer'?(a.receipts.some(r=>r.available>0)?'原款退款':'冲减未收'):a.debits.some(r=>r.available>0)?'平台退回余额':a.payments.some(r=>r.available>0)?'银行退回':a.order.source==='BSP'?'BSP账期抵扣':'冲减未付');
  const choices=side==='customer'?['原款退款','冲减未收']:['冲减未付','银行退回','平台退回余额','BSP账期抵扣'],originals=kind==='原款退款'?a.receipts:kind==='银行退回'?a.payments:kind==='平台退回余额'?a.debits:[],selected=originals.find(x=>x.id===(old?.original||original))||originals.find(x=>x.available>0),cash=['原款退款','银行退回','平台退回余额'].includes(kind),n=old?.amount??(cash?Math.min(s.remaining,selected?.available||0):s.remaining);
  open(old?.state==='结果待查'?'查询原退回结果':'办理'+(side==='customer'?'客户':'供应商')+'退改款项',facts([['原订单',c.orderId],['原团号',a.order.group||'无团散票'],['退改剩余',m(s.remaining,c.currency)]])+grid(field('办理方式','cfKind',kind,'text',choices,!!old)+(cash?field('对应原款','original',selected?.id||'','text',originals.map(x=>[x.id,(x.ref||x.id)+' · 可退 '+m(x.available,c.currency)]),!!old):'')+field('本次金额','amount',n,'number',null,!!old)+(kind==='BSP账期抵扣'?field('抵扣账期','period',old?.period||F.today().slice(0,7),'month'):'')+(kind==='原款退款'?field('原付款方','payee',selected?.payer||'','text',null,true)+field('原路收款账户','account','原付款账户尾号5566（演示）'):field('结果','state','成功','text',cash?['成功','失败','结果待查']:['成功'])+field('回执／核对依据','ref','DEMO-CHANGE-'+Date.now())+field('实际日期','date',F.today(),'date'))+field('办理依据','basis','原退改批准及原款核对资料（演示）'))+(cash&&!selected?'<p class="ab-muted">当前缺少对应原款明细，请先核对原收付款；不会按历史合计虚构流水。</p>':''),back(id)+btn(kind==='原款退款'?'提交退款申请':'确认办理','cf-save',id+'|'+side,true),{kind:'change-action',id,side,method:kind,retry:old?.id||'',query:old?.state==='结果待查',defaultAmount:n});
 }
 function topup(id){const f=getFunds(),a=F.get(f,'platforms',id),inflight=f.requests.filter(r=>['审批中','待执行','执行失败','结果待查'].includes(r.state)&&f.sources.some(s=>s.id===r.source&&s.platform===id));open('申请平台充值',facts([['平台',a.name],['当前余额',m(F.platformBalance(f,a),a.currency)],['在途充值',m(sum(inflight.map(r=>r.amount-F.executed(r))),a.currency)]])+grid(field('本次充值金额','amount',10000,'number')+field('期望付款日期','date',F.today(),'date')+field('充值依据','basis','本次出票备款（演示）'))+(inflight.length?section('原充值申请',inflight.map(r=>btn('查看 '+r.id,'request',r.id)).join('')):''),btn('提交充值申请','cf-topup-save',id,true),{kind:'topup',id});}
 const sum=F.sum;
 function handle(action,id,current){
  if(action==='cf-legacy'){const [cid,side]=id.split('|'),a=v(cid),x=a.change[side];open('查询历史原请求',facts([['原退改单',cid],['原请求金额',m(x.amount??a[side].delta,a.change.currency)],['原凭据',x.ref||'待核对']])+grid(field('原请求结果','state','结果待查','text',['结果待查','成功','失败'])+field('查询依据','ref','历史请求查询凭据（演示）')),btn('确认查询结果','cf-legacy-save',id,true));return true;}
  if(action==='cf-legacy-save'){const [cid,side]=id.split('|');C.queryLegacy(getFunds(),getBusiness(),cid,side,{state:val('state'),ref:val('ref')||'历史请求查询凭据（演示）'});persist();render();show(cid);return true;}
  if(action==='cf-view'){show(id);return true;}
  if(action==='cf-start'||action==='cf-retry'){const [c,side,retry]=id.split('|');start(c,side,'',retry);return true;}
  if(action==='cf-save'){
   const [c,side]=id.split('|'),d={kind:val('cfKind'),amount:val('amount')||current.defaultAmount,original:val('original'),state:val('state')||'成功',ref:val('ref')||'DEMO-CHANGE-'+Date.now(),date:val('date')||F.today(),basis:val('basis')||'原退改依据（演示）',period:val('period'),id:current.retry,query:current.query};
   if(d.kind==='原款退款'){const original=F.get(getFunds(),'receipts',d.original);const r=C.refund(getFunds(),getBusiness(),c,{...d,receipt:d.original,payee:original.payer,account:val('account')||'原付款账户（演示）'});persist();render();h.refund(r.id);}
   else{C.action(getFunds(),getBusiness(),c,side,d);persist();render();show(c);}notify('处理已保存，原单与原款保留');return true;
  }
  if(action==='cf-collect'){const p=C.collect(getFunds(),getBusiness(),id,{amount:val('amount')||v(id).customer.remaining,accountId:val('accountId')});persist();render();h.collectionView(p.id,false);return true;}
  if(action==='cf-topup-save'){const r=C.topup(getFunds(),id,{amount:val('amount')||10000,date:val('date')||F.today(),basis:val('basis')});persist();render();h.request(r.id);return true;}
  return false;
 }
 return {show,start,topup,handle};
};
})();
