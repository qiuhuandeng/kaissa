const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../shared/air-orders-model.js'),F=require('../shared/air-funds-model.js');
test('部分票款申请保留订单应收和实收；关闭后可按剩余票款再申请',()=>{
 const db=F.seed(),o=db.orders[0],sale=F.sale(o),received=F.received(db,o);
 const p=F.createLink(db,[o.id],new Date(Date.now()+86400000).toISOString(),'superadmin',{method:'二维码',accountId:'AF-CNY-01',lines:[{orderId:o.id,amount:500}]});
 assert.equal(p.lines[0].amount,500);assert.equal(F.sale(o),sale);assert.equal(F.received(db,o),received);assert.equal(p.collectionAccount.currency,o.currency);
 assert.throws(()=>F.createLink(db,[o.id],p.until,'superadmin'),/已有有效/);
 F.closeLink(db,p.id,'superadmin');const wire=F.createLink(db,[o.id],'','superadmin',{method:'公账转账',accountId:'AF-CNY-01',lines:[{orderId:o.id,amount:1000}]});assert.equal(wire.until,'');assert.equal(F.received(db,o),received);
});
test('合并收款保留每单申请金额，不跨客户合并',()=>{
 const db=F.seed(),os=db.orders.slice(0,2);const p=F.createLink(db,os.map(o=>o.id),'','superadmin',{method:'公账转账',accountId:'AF-CNY-02',lines:os.map((o,i)=>({orderId:o.id,amount:[100,200][i]}))});assert.deepEqual(p.lines.map(l=>l.amount),[100,200]);assert.equal(p.received,0);
 assert.throws(()=>F.createLink(db,[os[0].id,db.orders[2].id],'','superadmin',{method:'公账转账',accountId:'AF-CNY-01'}),/同一/);
});
test('出票前取消保留原单；已有实收、已出票或结果待查不直接取消',()=>{
 const os=M.seed().orders,draft=os.find(o=>o.state==='草稿');const people=M.copy(draft.people);M.cancelOrder(draft,'客户取消未出票委托','superadmin');assert.equal(draft.state,'已取消');assert.deepEqual(draft.people,people);assert.equal(draft.history[0].basis,'客户取消未出票委托');
 assert.throws(()=>M.cancelOrder(os[2],'取消','superadmin'),/出票/);assert.throws(()=>M.cancelOrder(os[4],'取消','superadmin'),/出票/);assert.throws(()=>M.cancelOrder(os[3],'取消','superadmin'),/收款/);
});
