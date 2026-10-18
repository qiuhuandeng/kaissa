const test=require('node:test'),assert=require('node:assert/strict'),F=require('../shared/air-funds-model.js');
const key=d=>F.advanceKey(d.receipts[0]);
const use=(d,plan)=>F.advanceUse(d,key(d),plan,'客户确认本次分配','第三方付款资料核对','superadmin');
const totals=d=>F.advanceAccount(d,key(d));
const balanced=a=>assert.equal(a.incoming,F.sum([a.applied,a.claimPending,a.refunded,a.refundPending,a.available]));
const refund=(d,r,amount,orderId='')=>F.refund(d,{receipt:r.id,amount,orderId,payee:r.payer,account:'原账户',basis:'余额或订单退回'},'superadmin');
test('客户余额按公司、客户与币种汇总，未知和未到账不混入',()=>{
 const d=F.seed();d.receipts.push(...[{}, {company:'上海凯撒旅游'}, {currency:'USD'}, {customer:'其他客户'}, {customer:''}, {state:'未到账'}].map((p,i)=>({...d.receipts[0],id:'EX'+i,amount:100,...p})));
 const rows=F.advanceAccounts(d);assert.equal(rows.length,4);assert.equal(totals(d).incoming,18100);rows.forEach(balanced);
});
test('待认领及退款占用扣减可用余额，撤回和退回认款释放',()=>{
 const d=F.seed(),r=d.receipts[0],c=F.claim(d,r.id,{lines:[{orderId:d.orders[0].id,amount:3000}]},'superadmin'),f=refund(d,r,2000);
 assert.deepEqual([totals(d).available,totals(d).claimPending,totals(d).refundPending],[13000,3000,2000]);balanced(totals(d));
 F.reviewClaim(d,c.id,false,'退回重新核对','superadmin');F.withdraw(d,'refunds',f.id,'superadmin');assert.equal(totals(d).available,18000);balanced(totals(d));
});
test('两笔原款用于多个订单，逐笔明细相等且不新增到账',()=>{
 const d=F.seed(),k=key(d),before=d.receipts.length,plan=F.advancePlan(d,k,d.receipts.map(r=>r.id),[0,1,3].map(i=>({orderId:d.orders[i].id,amount:i===3?7000:d.orders[i].sale})));
 assert.equal(plan.length,3);const result=use(d,plan);assert.equal(result.claims.length,2);assert.equal(d.receipts.length,before);assert.equal(totals(d).incoming,18000);assert.equal(totals(d).applied,17000);assert.equal(totals(d).available,1000);assert.equal(F.received(d,d.orders[3]),7000);assert.ok(result.claims.every(c=>c.state==='已确认'&&c.advanceBatch===result.id));balanced(totals(d));
});
test('同一订单可使用两笔原款，所选原款顺序对应确认明细',()=>{
 const d=F.seed();d.receipts[0].amount=3000;const ids=d.receipts.map(r=>r.id),plan=F.advancePlan(d,key(d),ids,[{orderId:d.orders[0].id,amount:6000}]);assert.deepEqual(plan.map(l=>[l.receipt,l.amount]),[[ids[0],3000],[ids[1],3000]]);use(d,plan);assert.equal(totals(d).available,5000);balanced(totals(d));
});
test('超用、跨公司跨币种跨客户、取消单和重复明细均不产生半笔核销',()=>{
 const d=F.seed(),r=d.receipts[0],base={receipt:r.id,orderId:d.orders[0].id,amount:1000};
 const bad=[[{...base,amount:99999}], [{...base,orderId:d.orders[2].id}], [base,base]];
 for(const plan of bad){const before=JSON.stringify(d);assert.throws(()=>use(d,plan));assert.equal(JSON.stringify(d),before);}
 for(const change of [{company:'其他公司'},{currency:'USD'},{state:'已取消'},{state:'草稿'}]){const x=F.copy(d);Object.assign(x.orders[0],change);const before=JSON.stringify(x);assert.throws(()=>use(x,[base]));assert.equal(JSON.stringify(x),before);}
});
test('分笔核销后续原款失败时全部保持原状',()=>{
 const d=F.seed(),before=JSON.stringify(d);assert.throws(()=>F.advanceUse(d,key(d),[{receipt:d.receipts[0].id,orderId:d.orders[0].id,amount:1000},{receipt:d.receipts[1].id,orderId:d.orders[1].id,amount:1000}],'分配确认','','superadmin'),/第三方/);assert.equal(JSON.stringify(d),before);
});
test('部分余额退款处理中与完成分别显示，待查失败继续占用',()=>{
 const d=F.seed(),f=refund(d,d.receipts[0],2000);F.review(d,'refunds',f.id,true,'原型结果','superadmin');
 F.execute(d,'refunds',f.id,{result:'结果待查',ref:'UNKNOWN'},'superadmin');assert.equal(totals(d).refundPending,2000);assert.equal(totals(d).available,16000);
 F.execute(d,'refunds',f.id,{result:'失败',ref:'FAIL',query:true},'superadmin');assert.equal(totals(d).refundPending,2000);
 F.execute(d,'refunds',f.id,{result:'成功',ref:'RETURN'},'superadmin');assert.equal(totals(d).refunded,2000);assert.equal(totals(d).refundPending,0);assert.equal(totals(d).available,16000);balanced(totals(d));
});
test('订单退款不释放预收，不重复计入余额退回',()=>{
 const d=F.seed(),r=d.receipts[0],o=d.orders[0];use(d,[{receipt:r.id,orderId:o.id,amount:6000}]);const f=refund(d,F.get(d,'receipts',r.id),1000,o.id);F.review(d,'refunds',f.id,true,'售后确认','superadmin');F.execute(d,'refunds',f.id,{result:'成功',ref:'ORDER-RETURN'},'superadmin');
 assert.equal(F.received(d,d.orders[0]),5000);assert.equal(totals(d).available,12000);assert.equal(totals(d).applied,6000);assert.equal(totals(d).refunded,0);balanced(totals(d));
});
test('已收齐公账申请的多收余款再核销，原申请到账不增加',()=>{
 const d=F.seed(),o=d.orders[0],p=F.createLink(d,[o.id],'','superadmin',{method:'公账转账',accountId:'AF-CNY-01',lines:[{orderId:o.id,amount:1000}]}),r=F.register(d,{company:o.company,customer:o.customer,payer:o.customer,currency:o.currency,amount:3000,ref:'EXCESS',date:F.today(),proof:'回单',accountId:'AF-CNY-01',collectionId:p.id},'superadmin');
 F.handleReceipt(d,r.id,{customer:r.customer,mode:'认领订单',lines:[{orderId:o.id,amount:1000}]},'superadmin');
 use(d,[{receipt:r.id,orderId:d.orders[1].id,amount:2000}]);const original=F.get(d,'links',p.id);assert.equal(original.state,'已收齐');assert.equal(original.received,1000);assert.equal(F.collectionReceived(d,original),1000);assert.equal(F.collectionReceived(d,original,d.orders[1].id),0);assert.equal(F.get(d,'receipts',r.id).collectionId,p.id);balanced(totals(d));
});
test('全额退回仍保留客户原款，未知客户确认后才纳入汇总',()=>{
 const d=F.seed();d.receipts=d.receipts.slice(0,1);const r=d.receipts[0],f=refund(d,r,r.amount);F.review(d,'refunds',f.id,true,'确认','superadmin');F.execute(d,'refunds',f.id,{result:'成功',ref:'ALL'},'superadmin');assert.equal(totals(d).available,0);assert.equal(totals(d).receipts.length,1);balanced(totals(d));
 d.receipts.push({...r,id:'UNKNOWN',amount:1000,customer:'',ref:'OTHER'});assert.equal(totals(d).incoming,10000);F.identifyReceipt(d,'UNKNOWN',r.customer,'客户核对','superadmin');assert.equal(totals(d).incoming,11000);
});
