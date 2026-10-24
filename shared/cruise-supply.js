/* Current-page cruise supply examples and quantity rules; no cross-page writes. */
(function (root) {
  'use strict';
  var clone = function (x) { return JSON.parse(JSON.stringify(x)); };
  var escape = function (x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var number = function (x) { return Number(x) || 0; };
  function whole(x) { return Number.isInteger(Number(x)) && Number(x) >= 0; }
  function available(row) { return Math.max(0, number(row.quantity) - number(row.sold) - number(row.locked)); }
  function unallocated(row) { return Math.max(0, number(row.total) - number(row.allocated) - number(row.returned)); }
  function allocate(contract, names, entries, shared, existingId) {
    if (!names.length) return {ok:false, message:'请选择使用这批舱房的团期'};
    var group = (contract.sharedCabins || []).find(function (g) { return g.id === existingId; });
    if (shared && group) {
      names.forEach(function (name) { if (!group.members.includes(name)) group.members.push(name); });
      return {ok:true, added:0};
    }
    if (!names.length) return {ok:false, message:'请选择使用这批舱房的团期'};
    var used = {};
    for (var i=0;i<entries.length;i++) {
      var entry=entries[i], row=contract.subtypes.find(function (r) { return r.name===entry.name; });
      used[entry.name]=(used[entry.name]||0)+number(entry.quantity);
      if (!row || !whole(entry.quantity) || used[entry.name]>unallocated(row)) return {ok:false,message:'分配间数超过未分配舱房，原记录未改变'};
    }
    if (!entries.some(function (e) { return number(e.quantity)>0; })) return {ok:false,message:'本次分配间数为0，未新增分配记录'};
    entries.forEach(function (entry) {
      if (!number(entry.quantity)) return;
      var row=contract.subtypes.find(function (r) { return r.name===entry.name; });
      row.allocated+=number(entry.quantity);
      if (shared) {
        (contract.sharedCabins || (contract.sharedCabins=[])).push({id:'GY-'+Date.now()+'-'+entry.name,name:entry.name,quantity:number(entry.quantity),sold:0,locked:0,members:names.slice(),usage:[]});
      } else {
        contract.allocations.push({scheduleNo:names[0],scheduleName:names[0],subtype:entry.name,allocated:number(entry.quantity),sold:0,locked:0,issued:0,returned:0,status:'筹备中'});
      }
    });
    return {ok:true};
  }
  function requestReturn(contract, name, qty, reason) {
    var row=contract.subtypes.find(function (r) { return r.name===name; });
    var pending=(contract.cruiseReturns||[]).filter(function (r) { return r.name===name && r.status==='待船方确认'; }).reduce(function (n,r) { return n+r.quantity; },0);
    if (!row || !whole(qty) || number(qty)<=0 || number(qty)>unallocated(row)-pending) return {ok:false,message:'退舱间数超过未分配且未申请退舱的数量；已分配舱房请先归还'};
    (contract.cruiseReturns||(contract.cruiseReturns=[])).push({id:'TC-'+String(contract.cruiseReturns.length+1).padStart(3,'0'),name:name,quantity:number(qty),reason:reason,status:'待船方确认',amount:null,evidence:''});
    return {ok:true};
  }
  function confirmReturn(contract, id, accepted, amount, evidence) {
    var request=(contract.cruiseReturns||[]).find(function (r) { return r.id===id; });
    if (!request || request.status!=='待船方确认') return {ok:false,message:'该申请已办理，请查看原记录'};
    var row=contract.subtypes.find(function (r) { return r.name===request.name; });
    if (accepted && request.quantity>unallocated(row)) return {ok:false,message:'申请后舱房已被分配，请先核对可退数量'};
    if (accepted && (!Number.isFinite(Number(amount)) || Number(amount)<0)) return {ok:false,message:'请核对船方确认损失金额'};
    request.status=accepted?'已确认退舱':'船方未同意';request.amount=accepted?number(amount):null;request.evidence=evidence;
    if (accepted) { row.returned+=request.quantity; if (request.amount>0) contract.losses.push({type:'舱损',subtype:row.name,guarantee:contract.guaranteeQty,actual:row.sold,freeLoss:0,returned:request.quantity,lossQty:request.quantity,amount:request.amount,scheduleNo:'采购未分配',status:'待确认',costNo:'',source:request.id}); }
    return {ok:true};
  }
  function releaseAllocation(contract, index) {
    var row=contract.allocations[index]; if(!row)return 0;
    var quantity=Math.max(0,number(row.allocated)-number(row.sold)-number(row.locked)-number(row.returned));
    if(!quantity)return 0;
    row.returned=number(row.returned)+quantity;
    contract.subtypes.find(function (r) {return r.name===row.subtype;}).allocated-=quantity;
    return quantity;
  }
  var schedules=[
    {code:'CZ20261112001',name:'理想号地中海西线 / 北京出发',departDate:'2026-11-12',returnDate:'2026-11-19',sold:2},
    {code:'CZ20261112002',name:'理想号地中海西线 / 上海出发',departDate:'2026-11-12',returnDate:'2026-11-19',sold:0},
    {code:'CZ20261112003',name:'理想号地中海西线 / 广州出发',departDate:'2026-11-12',returnDate:'2026-11-19',sold:0}
  ];
  function exampleContract() {
    return {contractNo:'CRU-BLK-20261112-005',type:'邮轮',mode:'包舱',supplier:'地中海邮轮中国销售中心',resourceName:'理想号 MED-20261112',route:'巴塞罗那 → 地中海西线',departDate:'2026-11-12',returnDate:'2026-11-19',dlDate:'2026-11-01',finalPaymentDate:'2026-10-30',status:'履约中',owner:'邮轮计调王强',guaranteeQty:26,freeLossQty:0,
      subtypes:[{name:'阳台 BA',unit:'间',total:20,allocated:20,sold:2,locked:3,issued:0,returned:0,unitPrice:22000,capacity:2,maxCapacity:4,thirdFourth:'支持',childNoBerth:'需确认',adultOccupancy:4,childOccupancy:0,childNoBerthSold:0},{name:'阳台 BC',unit:'间',total:6,allocated:4,sold:1,locked:1,issued:0,returned:0,unitPrice:20000,capacity:2,maxCapacity:2,thirdFourth:'不支持',childNoBerth:'需确认',adultOccupancy:2,childOccupancy:0,childNoBerthSold:0}],
      sharedCabins:[{id:'GY-BA-20261112',name:'阳台 BA',quantity:20,sold:2,locked:3,members:schedules.slice(0,2).map(function (s){return s.code;}),usage:[{schedule:schedules[0].code,sold:2,locked:0},{schedule:schedules[1].code,sold:0,locked:3}]}],
      allocations:[{scheduleNo:schedules[0].code,scheduleName:schedules[0].name,subtype:'阳台 BC',allocated:4,sold:1,locked:1,issued:0,returned:0,status:'开放报名'}],
      payments:[{node:'订金',dueDate:'2026-10-25',amount:112000,applyNo:'',approvalStatus:'待申请',paymentStatus:'未付款',receiptStatus:'-',ncStatus:'待生成'},{node:'尾款',dueDate:'2026-10-30',amount:448000,applyNo:'',approvalStatus:'待申请',paymentStatus:'未付款',receiptStatus:'-',ncStatus:'待生成'}],tickets:[],losses:[],cruiseReturns:[]};
  }
  var voyages=[{id:'MED-20261112',depart:'2026-11-12',back:'2026-11-19',shared:20,sold:2,locked:3,independent:2},{id:'MED-20261126',depart:'2026-11-26',back:'2026-12-03',shared:12,sold:0,locked:0,independent:6}];
  function prices() {return {first:28800,second:28800,third:20800,fourth:18800,child:23800,single:8800,port:1800,service:600,fuel:0,feeMode:'另收'};}
  function priceTotal(p) {return number(p.first)+(p.feeMode==='另收'?number(p.port)+number(p.service)+number(p.fuel):0);}
  root.CaesarCruiseSupply={clone:clone,escape:escape,number:number,whole:whole,available:available,unallocated:unallocated,allocate:allocate,requestReturn:requestReturn,confirmReturn:confirmReturn,releaseAllocation:releaseAllocation,exampleContract:exampleContract,schedules:schedules,voyages:voyages,prices:prices,priceTotal:priceTotal};
})(typeof window==='undefined'?globalThis:window);
