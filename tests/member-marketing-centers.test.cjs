const assert=require('node:assert/strict'),M=require(process.cwd()+'/shared/member-marketing-model.js');let count=0;function test(name,f){f();count++;console.log('✓ '+name)}
test('five tiers and black multiplier',()=>{assert.deepEqual(M.pointsFor(10000,3),{base:1500,extra:3000,total:4500});assert.equal(M.gradeFor(50000).name,'银卡');assert.equal(M.gradeFor(399999).name,'铂金卡');assert.equal(M.gradeFor(400000).name,'黑钻卡');assert.equal(M.tiers('boost').length,10);});
test('continuous grade thresholds and coupon allocations',()=>{const l=M.clone(M.levels);l[1].min=60000;assert(M.validateLevels(l).length);for(const [type]of M.categories)assert.deepEqual(M.validateTiers(type,M.tiers(type)),[]);const t=M.tiers('domestic');t[0].amount=60;assert(M.validateTiers('domestic',t).length);assert.deepEqual(M.quote(M.tiers('boost')[9],60000),{amount:1500,product:900,channel:600,supplier:0});});
test('seed balances match point batches and flows',()=>{const s=M.seed();for(const u of s.users.filter(u=>u.member)){assert.equal(u.balance,s.pointBatches.filter(b=>b.uid===u.id).reduce((n,b)=>n+b.remaining,0),u.id);assert.equal(u.balance,s.pointFlows.filter(p=>p.uid===u.id).reduce((n,p)=>n+p.qty,0),u.id);}assert(s.payouts.length>=20);assert.equal(s.couponFlows.filter(f=>f.type==='领取').length,s.wallet.length);});
test('two approvals required; repeat prohibited',()=>{const s=M.seed(),u=s.users[49],old=u.balance,a=M.request(s,'积分补发',u.id,{amount:100},'漏发补正');M.approve(s,a.id,'通过','运营核对');assert.equal(u.balance,old);M.approve(s,a.id,'通过','复核通过');assert.equal(u.balance,old+100);assert.throws(()=>M.approve(s,a.id,'通过','重复'));assert.equal(u.balance,old+100);});
test('rejection restores version draft and transfer retains node',()=>{const s=M.seed(),v=s.levelVersions[2];v.status='审批中';const a=M.request(s,'等级规则发布',v.id,{},'规则调整');M.approve(s,a.id,'转交','请财务核对','李佳');assert.equal(a.step,0);assert.equal(a.nodes[0],'李佳');M.approve(s,a.id,'驳回','请补充依据');assert.equal(v.status,'草稿');});
test('FIFO, insufficient balance, frozen account',()=>{const s=M.seed(),u=s.users[59],b=s.pointBatches.filter(b=>b.uid===u.id);const old=b[0].remaining;M.spend(s,u.id,100,'兑换','REDEEM');assert.equal(b[0].remaining,old-100);assert.throws(()=>M.spend(s,u.id,u.balance+1,'兑换','TOO-LARGE'));u.status='冻结';assert.throws(()=>M.spend(s,u.id,1,'兑换','FROZEN'));});
test('points redemption generates wallet, shop and ledger once',()=>{const s=M.seed(),u=s.users[59],t=s.templates.find(t=>t.type==='base'),tier=t.tiers[0],old=u.balance,w=M.redeem(s,u.id,t.id,tier.id);assert.equal(u.balance,old-1500);assert(s.shopOrders.some(o=>o.id===w.id));assert.throws(()=>M.redeem(s,u.id,t.id,tier.id));assert.equal(u.balance,old-1500);});
test('partial issue retry skips successful recipients',()=>{const s=M.seed(),t=s.templates.find(t=>t.type==='domestic'),uids=[s.users[40].id,s.users[5].id],task={id:'FQ-RETRY',template:t.id,tier:t.tiers[0].id,uids,count:2,status:'待发放'};M.issue(s,task);assert.equal(task.status,'部分失败');s.users[5].status='正常';M.issue(s,task);assert.equal(task.status,'已完成');assert.equal(s.wallet.filter(w=>w.task==='FQ-RETRY').length,2);assert.throws(()=>M.issue(s,task));});
test('whitelist checks source, sale, enrollment, duplicates, lock',()=>{const s=M.seed(),a=s.activities[2];a.status='筹备';s.whitelist=s.whitelist.filter(w=>w.activity!==a.id);const t=s.schedules.find(t=>t.sale==='启售'&&!t.received&&a.sources.includes(t.source)&&(t.source!=='自营'||a.branches.includes(t.branch)));let r=M.addSchedules(s,a.id,[t.id,t.id,'UNKNOWN']);assert.equal(r.filter(x=>x.valid).length,1);assert.equal(M.addSchedules(s,a.id,[t.id])[0].valid,false);a.status='上线';assert.throws(()=>M.addSchedules(s,a.id,[t.id]));});
test('coupon consumption split and refund audit',()=>{const s=M.seed(),u=s.users[59],t=s.templates.find(t=>t.type==='base'),w=M.redeem(s,u.id,t.id,t.tiers[0].id),o=s.orders.find(o=>o.uid===u.id&&o.status==='待支付'&&s.products.find(p=>p.id===o.product).source==='自营');assert(o);const q=M.consumeCoupon(s,w.id,o.id);assert.equal(q.amount,150);assert.throws(()=>M.consumeCoupon(s,w.id,o.id));const old=u.balance;M.refundCoupon(s,w.id,'客户申请全额退款');assert.equal(w.status,'已回收');assert.equal(o.status,'已退款');assert(u.balance<=old);assert(s.couponFlows.some(f=>f.coupon===w.id&&f.type==='回收'&&f.amount===-150));assert.throws(()=>M.refundCoupon(s,w.id,'重复退款'));});
test('incentive AND conditions and idempotent routing',()=>{let s=M.seed(),x=s.incentives.find(x=>x.status==='已触发可发放');x.collection=40;assert.throws(()=>M.payout(s,[x.id]));x.collection=100;x.ownerValid=false;assert.throws(()=>M.payout(s,[x.id]));x.ownerValid=true;const rows=M.payout(s,[x.id]);assert.equal(rows[0].route,x.channel==='直营'?'工资系统':'分润系统');assert.equal(rows[0].status,'已推送');assert.throws(()=>M.payout(s,[x.id]));});
test('point discount cap, exclusions, no double deduction',()=>{const s=M.seed(),u=s.users[59],o=s.orders.find(o=>o.uid===u.id&&o.status==='待支付');assert.throws(()=>M.deductPoints(s,u.id,o.id,20000,0));const old=u.balance,q=M.deductPoints(s,u.id,o.id,100,1000);assert.equal(q.amount,10);assert.equal(u.balance,old-100);assert.throws(()=>M.deductPoints(s,u.id,o.id,100,0));});
test('legacy coupon rules migrate per template without changing issued coupons',()=>{
  const legacy=M.seed();legacy.couponRules={pointsStack:false,remindDays:3};
  legacy.templates.forEach(t=>delete t.useRules);legacy.wallet.forEach(w=>delete w.useRules);
  let raw=JSON.stringify(legacy);const storage={getItem:()=>raw,setItem:(key,value)=>raw=value};
  const s=M.load(storage);assert(s.templates.every(t=>t.useRules.pointsStack===false&&t.useRules.remindDays===3));
  assert(s.wallet.every(w=>w.useRules.pointsStack===false));
  s.templates[0].useRules={pointsStack:true,remindDays:5};M.save(s,storage);
  const reloaded=M.load(storage);assert.equal(reloaded.templates[0].useRules.pointsStack,true);
  assert.equal(reloaded.templates[1].useRules.pointsStack,false);assert(reloaded.wallet.every(w=>w.useRules.pointsStack===false));
});
test('issue and redemption snapshot the selected template rules',()=>{
  const s=M.seed(),u=s.users[59],direct=s.templates.find(t=>t.type==='domestic'),base=s.templates.find(t=>t.type==='base');
  direct.useRules={pointsStack:false,remindDays:2};base.useRules={pointsStack:true,remindDays:5};
  const task={id:'FQ-RULE-SNAPSHOT',template:direct.id,tier:direct.tiers[0].id,uids:[u.id],count:1,status:'待发放'};M.issue(s,task);
  const issued=s.wallet.find(w=>w.task===task.id),redeemed=M.redeem(s,u.id,base.id,base.tiers[0].id);
  direct.useRules.pointsStack=true;base.useRules.pointsStack=false;
  assert.deepEqual(issued.useRules,M.normalizeCouponRules({pointsStack:false,remindDays:2,allocations:[{party:'channel',percent:100}]}));assert.deepEqual(redeemed.useRules,M.normalizeCouponRules({pointsStack:true,remindDays:5,allocations:[{party:'product',percent:100}]}));
});
test('coupon-specific point stacking is enforced in both operation orders',()=>{
  for(const allowed of [true,false])for(const couponFirst of [true,false]){
    const s=M.seed(),u=s.users[59],t=s.templates.find(t=>t.type==='base');t.useRules={pointsStack:allowed,remindDays:7};
    const w=M.redeem(s,u.id,t.id,t.tiers[0].id),o=s.orders.find(o=>o.uid===u.id&&o.status==='待支付'&&s.products.find(p=>p.id===o.product).source==='自营');
    // Subsequent edits and the retired global setting must not affect this issued coupon.
    t.useRules.pointsStack=!allowed;s.couponRules={pointsStack:!allowed,remindDays:1};
    const use=()=>M.consumeCoupon(s,w.id,o.id),points=()=>M.deductPoints(s,u.id,o.id,100);
    if(couponFirst)use();else points();
    const next=couponFirst?points:use;
    if(allowed){assert.doesNotThrow(next);assert.equal(o.payable,o.amount-150-10);}
    else{const before=JSON.stringify(s);assert.throws(next,/此券不允许同时抵扣积分/);assert.equal(JSON.stringify(s),before);}
  }
});
test('member and activity requests follow published approval templates and keep snapshots',()=>{
  const C=require(process.cwd()+'/shared/approval-config-model.js'),config=C.ensureMemberMarketingScenes(C.ensureBusinessScenes(C.ensureReceivableScenes(C.createState())));
  for(const scene of C.scenes.filter(s=>s.group==='会员与营销')){const entries=config.templates.filter(r=>(r.draft||r.published)?.scene===scene.name);assert.equal(entries.length,1);assert(entries[0].published);assert.deepEqual(C.validate(config,entries[0].published,entries[0].id),[]);}
  for(const [level,length] of [['A',3],['B',2],['常规',1]])assert.equal(C.memberMarketingRoute('活动报批',{activityLevel:level}).nodes.length,length);
  const s=M.seed(),first=M.request(s,'人工调级',s.users[49].id,{grade:'金卡'},'会员服务调整');
  const snapshot=M.clone(first.approvalTemplate);
  M.approve(s,first.id,'转交','请会员中心复核','李佳');assert.deepEqual(first.approvalTemplate,snapshot);
  const entry=config.templates.find(r=>r.published?.scene==='人工调级'),updated=C.clone(entry.published);updated.nodes[0].title='会员中心负责人';
  assert.deepEqual(C.publish(config,entry.id,updated).errors,[]);
  const store={getItem:()=>JSON.stringify(config)};
  assert.equal(C.memberMarketingRoute('人工调级',{},store).nodes[0],'会员中心负责人');assert.equal(C.memberMarketingRoute('人工调级',{},store).version,2);
  assert.equal(first.approvalTemplate.version,1);entry.disabled=true;assert.throws(()=>C.memberMarketingRoute('人工调级',{},store),/已发布且启用/);
});
test('editable coupon rules validate dependent choices',()=>{
  const defaults=M.normalizeCouponRules();assert.deepEqual(M.validateCouponRules(defaults),[]);
  assert(M.validateCouponRules({...defaults,maxPerOrder:2}).length);
  assert(M.validateCouponRules({...defaults,refundPolicy:'restore',refundPoints:true}).length);
  assert(M.validateCouponRules({...defaults,userScope:'missing'}).length);
  assert(M.validateCouponRules({...defaults,expiryPolicy:'extend',extensionDays:0}).length);
});
function couponScenario(){const s=M.seed(),u=s.users[59],t=s.templates.filter(t=>t.type==='base'),o=s.orders.find(o=>o.uid===u.id&&o.status==='待支付'&&s.products.find(p=>p.id===o.product).source==='自营');return {s,u,t,o};}
test('stacking respects every issued coupon and shares are recorded from snapshots',()=>{
  const {s,u,t,o}=couponScenario();
  for(const x of t.slice(0,3))x.useRules=M.normalizeCouponRules({stacking:'different',maxPerOrder:2,allocations:[{party:'headquarters',percent:70},{party:'store',percent:30}]});
  const a=M.redeem(s,u.id,t[0].id,t[0].tiers[0].id),b=M.redeem(s,u.id,t[1].id,t[1].tiers[0].id),c=M.redeem(s,u.id,t[2].id,t[2].tiers[0].id);
  t[0].useRules.stacking='none';o.channel='合伙';M.consumeCoupon(s,a.id,o.id);M.consumeCoupon(s,b.id,o.id);
  assert.equal(o.couponDiscount,300);assert.equal(o.payable,o.amount-300);assert.equal(s.couponFlows[0].channelOwner,o.store);assert.deepEqual(s.couponFlows[0].allocations.map(r=>[r.party,r.amount]),[['headquarters',105],['store',45]]);
  const before=JSON.stringify(s);assert.throws(()=>M.consumeCoupon(s,c.id,o.id),/叠加规则/);assert.equal(JSON.stringify(s),before);
  b.useRules.pointsStack=false;assert.throws(()=>M.deductPoints(s,u.id,o.id,100),/同时抵扣积分/);
});
test('usage scope and one-time expiry extension follow wallet rules',()=>{
  const {s,u,t,o}=couponScenario();t[0].useRules=M.normalizeCouponRules({userScope:'companion',expiryPolicy:'extend',extensionDays:30});
  const w=M.redeem(s,u.id,t[0].id,t[0].tiers[0].id);w.expires='2026-10-01';w.status='已过期';o.uid=s.users[40].id;
  assert.throws(()=>M.previewCoupon(s,w.id,o.id),/使用人/);o.travelerUids=[u.id];assert.doesNotThrow(()=>M.previewCoupon(s,w.id,o.id));
  w.useRules.userScope='holder';assert.throws(()=>M.previewCoupon(s,w.id,o.id),/使用人/);w.useRules.userScope='any';o.travelerUids=[];assert.doesNotThrow(()=>M.previewCoupon(s,w.id,o.id));
  w.expires='2026-09-01';assert.throws(()=>M.previewCoupon(s,w.id,o.id),/已过期/);w.expires='2026-10-01';w.useRules.expiryPolicy='expire';assert.throws(()=>M.previewCoupon(s,w.id,o.id),/已过期/);
});
test('order refund reverses every stacked coupon, restores or refunds points once',()=>{
  const {s,u,t,o}=couponScenario();for(const x of t.slice(0,2))x.useRules=M.normalizeCouponRules({stacking:'any',maxPerOrder:2});
  t[0].useRules.refundPoints=true;t[1].useRules.refundPolicy='restore';
  const a=M.redeem(s,u.id,t[0].id,t[0].tiers[0].id),b=M.redeem(s,u.id,t[1].id,t[1].tiers[0].id),balance=u.balance;
  M.consumeCoupon(s,a.id,o.id);M.consumeCoupon(s,b.id,o.id);M.refundCoupon(s,a.id,'订单取消');
  assert.equal(a.status,'已回收');assert.equal(b.status,'已领取');assert.equal(b.order,'');assert.equal(u.balance,balance+a.points);
  assert.equal(s.couponFlows.filter(f=>f.order===o.id&&['使用','回收'].includes(f.type)).reduce((n,f)=>n+f.amount,0),0);
  assert.throws(()=>M.refundCoupon(s,a.id,'重复退款'));assert.throws(()=>M.refundCoupon(s,b.id,'重复退款'));assert.equal(u.balance,balance+a.points);
});
test('allocation parties are unique, positive and total exactly 100 percent',()=>{
  const ok=[{party:'headquarters',percent:70},{party:'store',percent:30}];assert.deepEqual(M.validateAllocations(ok),[]);
  for(const bad of [[],[{party:'headquarters',percent:70}],[{party:'store',percent:110}],[{party:'store',percent:0},{party:'headquarters',percent:100}],[{party:'store',percent:50},{party:'store',percent:50}],[{party:'missing',percent:100}],[{party:'store',percent:33.333},{party:'headquarters',percent:66.667}]])assert(M.validateAllocations(bad).length);
});
test('percentage allocation conserves cents and refund reverses original amounts',()=>{
  const rows=[{party:'headquarters',percent:70},{party:'store',percent:30}];
  assert.deepEqual(M.splitCouponAmount(100,rows).map(x=>x.amount),[70,30]);
  for(const amount of [.01,.03,99.99,100.01,1500])assert.equal(M.splitCouponAmount(amount,rows).reduce((n,x)=>n+Math.round(x.amount*100),0),Math.round(amount*100));
  const {s,u,t,o}=couponScenario();t[0].useRules=M.normalizeCouponRules({allocations:rows});const w=M.redeem(s,u.id,t[0].id,t[0].tiers[0].id);
  t[0].useRules.allocations=[{party:'supplier',percent:100}];M.consumeCoupon(s,w.id,o.id);const used=M.clone(s.couponFlows[0].allocations);
  M.refundCoupon(s,w.id,'取消行程');assert.deepEqual(s.couponFlows[0].allocations,used.map(r=>({...r,amount:-r.amount})));
});
test('legacy issued coupons retain their tier split until a template is saved',()=>{
  const s=M.seed(),t=s.templates.find(t=>t.type==='boost'),tier=t.tiers.at(-1),u=s.users[59];
  assert.equal(t.useRules.legacyAllocations,true);const rules=M.couponRulesFor(s,t,tier);assert.deepEqual(rules.allocations,[{party:'product',percent:60},{party:'channel',percent:40}]);
  const old=s.wallet.find(w=>w.template===t.id),snapshot=M.clone(old.useRules);t.useRules=M.normalizeCouponRules();assert.deepEqual(M.walletRulesFor(s,old),snapshot);
});
console.log('PASS '+count+' business scenarios');
