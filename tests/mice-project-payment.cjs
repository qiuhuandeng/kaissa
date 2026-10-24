const assert=require('node:assert/strict');
const P=require('../shared/mice-payment-model.js');
let count=0;const check=(name,fn)=>{fn();count++;console.log('PASS '+name);};
const a=[{id:'A',name:'甲团'},{id:'B',name:'乙团'}],c={id:'C',name:'共同采购',status:'已确认',amount:1000,conditionLimit:1000,scopeType:'shared',allocations:[{activityId:'A',amount:600},{activityId:'B',amount:400}]};
const item=(line,n)=>({...line,requestAmount:n});
check('分团金额不重复原采购',()=>assert.equal(P.sum(P.lines(c,[],a)),1000));
check('首笔默认分团金额600/400',()=>assert.deepEqual(P.lines(c,[],a).map(l=>l.suggested),[600,400]));
check('可分别申请200/100',()=>assert.equal(P.validate([c],[],a,P.lines(c,[],a).map((l,i)=>item(l,i?100:200))),''));
check('不能超过单团承担',()=>assert.match(P.validate([c],[],a,[item(P.lines(c,[],a)[0],601)]),/超过/));
const pending={costId:'C',status:'待财务复核',amount:300,paid:0,allocations:[{activityId:'A',amount:200},{activityId:'B',amount:100}]};
check('有效申请占用采购余额',()=>assert.equal(P.balance(c,[pending]),700));
check('有效分团申请扣对应团余额',()=>assert.deepEqual(P.lines(c,[pending],a).map(l=>l.available),[400,300]));
check('撤回释放未付申请',()=>assert.equal(P.balance(c,[{...pending,status:'已撤回'}]),1000));
check('退回释放未付申请',()=>assert.equal(P.balance(c,[{...pending,status:'已退回'}]),1000));
check('已付不会因申请重复扣减',()=>assert.equal(P.balance({...c,paid:200},[{...pending,paid:200}]),700));
check('草稿不占用有效申请',()=>assert.equal(P.balance(c,[{...pending,status:'草稿'}]),1000));
check('草稿恢复分团金额',()=>assert.deepEqual(P.lines(c,[{...pending,status:'草稿'}],a).map(l=>l.suggested),[200,100]));
check('部分可付原采购合计不能超',()=>{const cost={...c,conditionLimit:700};assert.match(P.validate([cost],[],a,P.lines(cost,[],a).map(l=>item(l,l.available))),/合计超过/);});
check('付款条件未明确无可申请额',()=>assert.equal(P.balance({...c,conditionLimit:null},[]),0));
check('未确认成本不能请款',()=>assert.equal(P.balance({...c,status:'待确认'},[]),0));
check('公共费用不按管理分摊重复付款',()=>assert.equal(P.lines({...c,scopeType:'common'},[],a).length,1));
check('单团费用独立一行',()=>assert.equal(P.lines({...c,activityId:'A'},[],a)[0].scheduleNo,'A'));
check('原采购未分配部分单列',()=>assert.equal(P.lines({...c,allocations:[{activityId:'A',amount:600}]},[],a)[1].amount,400));
check('空选不能提交',()=>assert.match(P.validate([c],[],a,[]),/请选择/));
check('不接受重复选择同一费用分团行',()=>{const l=item(P.lines(c,[],a)[0],1);assert.match(P.validate([c],[],a,[l,l]),/重新打开/);});
check('历史未分团申请只扣原采购',()=>assert.equal(P.lines(c,[{...pending,allocations:[]}],a).reduce((n,l)=>n+l.suggested,0),700));
console.log(JSON.stringify({passed:count}));
const vm=require('node:vm'),fs=require('node:fs');
const data={costs:[{...c,projectId:'P',currency:'CNY',supplier:'供应商甲'},{...c,id:'D',projectId:'P',currency:'EUR',supplier:'供应商乙',activityId:'A',amount:800,conditionLimit:800}],projects:[{id:'P',name:'测试项目',company:'北京凯撒'}],activities:a,requests:[]};
let seq=0;const store={data,find:(kind,id)=>data[kind].find(r=>r.id===id),id:()=>String(++seq),log:()=>{}};
const elements={expectedPayDate:{value:'2026-10-24'},applyReason:{value:'测试'},applyPaymentMethod:{value:'线下转账'},projectPaymentError:{textContent:''}};
const ui={store,M:{money:String,payable:()=>({unpaid:0})},esc:String,ready:()=>{},toast:()=>{}};const host={closePayment(){},refreshPayments(){}};
const box={window:{MiceUI:ui,SupplierPaymentWorkbench:host},MiceUI:ui,SupplierPaymentWorkbench:host,MicePaymentModel:P,document:{getElementById:id=>elements[id]}};
vm.runInNewContext(fs.readFileSync('shared/mice-payment-workbench.js','utf8'),box);
const W=box.window.MicePaymentWorkbench,ctx=()=>({groups:data.costs.map(c=>({miceCostId:c.id,projectNo:'P'}))});
const selected=[item(P.lines(data.costs[0],[],a)[0],100),item(P.lines(data.costs[1],[],a)[0],200)];
check('跨供应商币种保存分别引用原采购',()=>{W.save(ctx(),selected,'草稿');assert.equal(data.requests.length,2);assert.deepEqual(data.requests.map(r=>[r.costId,r.currency,r.amount]),[['C','CNY',100],['D','EUR',200]]);});
check('草稿提交沿用原申请且不增加实付',()=>{W.save(ctx(),selected,'审批中');assert.equal(data.requests.length,2);assert(data.requests.every(r=>r.status==='待财务复核'&&r.paid===0));});
check('同一抽屉重复提交不重复生成',()=>{const x=ctx(),n=data.requests.length;W.save(x,selected,'审批中');W.save(x,selected,'审批中');assert.equal(data.requests.length,n+2);});


check('项目列表关联团按编号去重，公共费用不计作一个团',()=>{
 const g=[{id:'G1',miceCostId:'C',projectNo:'P',projectName:'测试项目',customer:'客户',currency:'CNY',supplier:'供应商甲',available:700,node:'阶段款',expectedDate:'2026-10-24',items:[{activityId:'A',route:'甲团',scheduleNo:'A'},{activityId:'B',route:'乙团',scheduleNo:'B'}]},{id:'G2',miceCostId:'D',projectNo:'P',projectName:'测试项目',customer:'客户',currency:'CNY',supplier:'供应商乙',available:100,node:'阶段款',expectedDate:'2026-10-24',items:[{activityId:'A',route:'甲团',scheduleNo:'A'}]}];
 data.costs.push({id:'PUBLIC',projectId:'P',amount:500,scopeType:'common'});g.push({...g[0],id:'G3',miceCostId:'PUBLIC',items:[{activityId:'',route:'项目公共费用'}]});
 const v=W.views(g)[0];assert.match(v.relatedNote,/项目公共费用/);assert.equal(v.relatedObjects,'2 个项目团');assert.equal(v.costScope,'2 家供应商');assert.match(v.searchText,/甲团/);assert.match(v.searchText,/供应商乙/);
});

console.log(JSON.stringify({totalPassed:count}));
