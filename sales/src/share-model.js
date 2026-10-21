/* Local product-sharing prototype. No messaging, inventory reservation or ERP writes. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./model.js'));
  else root.SalesSharing=factory(root.SalesModel);
})(typeof globalThis!=='undefined'?globalThis:this,function(M){
  'use strict';
  const advisor={name:'林悦',store:'北京朝阳门店',company:'凯撒旅游北京公司',phone:'13800000006'};
  const need=(ok,message)=>{if(!ok)throw Error(message);};
  const clean=v=>String(v||'').trim();
  const uid=prefix=>prefix+Date.now().toString(36)+Math.random().toString(36).slice(2,10);
  const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
  const afterDays=n=>new Date(Date.parse(M.TODAY+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
  function normalize(s){s.productShares??=[];s.shareConsultations??=[];return s;}
  function product(id){const p=M.products.find(p=>p.id===id);need(p,'产品不存在或已不可用');return p;}
  const revision=p=>JSON.stringify([p.title,p.adult,p.child,p.room,p.includes,p.excludes,p.policy,p.itinerary]);
  function quote(f){
    const p=product(f.productId),date=p.dates.find(d=>d.date===f.date),adults=Number(f.adults),children=Number(f.children),childAge=f.childAge===''||f.childAge==null?null:Number(f.childAge);
    need(p.active!==false,'产品已停售，不能生成新推荐');
    need(date&&date.date>M.TODAY,'请选择有效的出发日期');
    need(Number.isInteger(adults)&&adults>=1&&adults<=20&&Number.isInteger(children)&&children>=0&&children<=10,'请核对成人及儿童人数');
    need(date.seats>=adults+children,'当前日期余位不足，请调整人数或更换日期');
    if(children)need(Number.isInteger(childAge)&&childAge>=2&&childAge<=11&&['占床','不占床'].includes(f.childBed),'请核对儿童年龄（2–11岁）及占床方式');
    const childUnit=p.child+(f.childBed==='占床'?p.room:0);
    return {date:date.date,adults,children,childAge:children?childAge:null,childBed:children?f.childBed:'',adultUnit:p.adult,childUnit,total:M.standardTotal({...f,adults,children}),mode:date.mode};
  }
  function create(s,f){
    normalize(s);const p=product(f.productId);need(p.active!==false,'产品已停售，不能生成新推荐');
    need(['intro','quote'].includes(f.kind),'请选择推荐内容');
    need(validDate(f.expires)&&f.expires>=M.TODAY,'请填写有效的推荐有效期');
    need(!f.customerId||M.customer(s,f.customerId),'推荐客户不存在');
    const source=f.demandId&&M.demand(s,f.demandId);if(f.demandId)need(source&&source.customerId===f.customerId,'推荐客户与本次需求不一致');
    const q=f.kind==='quote'?quote(f):{};
    if(q.date)need(f.expires<=q.date,'推荐有效期不能晚于出发日期');
    need(f.checked,'请核对对客价格、费用与退改内容');
    const share={id:uid('TJ'),productId:p.id,kind:f.kind,customerId:f.customerId||'',demandId:f.demandId||'',created:M.TODAY,expires:f.expires,revoked:false,revision:revision(p),introPrice:p.adult,advisor:{...advisor},...q};
    s.productShares.unshift(share);return share;
  }
  function view(s,id,today=M.TODAY){
    normalize(s);const share=s.productShares.find(x=>x.id===id);need(share,'推荐链接不存在或不在当前浏览器的演示记录中');
    need(!share.revoked,'这条推荐已停止分享，请联系顾问获取新的推荐');const p=product(share.productId),date=p.dates.find(d=>d.date===share.date),reasons=[];
    if(p.active===false)reasons.push('该产品已停售');
    if(share.expires<today)reasons.push('本次推荐已过期');
    if(share.revision!==revision(p))reasons.push('产品价格或行程已调整');
    if(share.kind==='quote'&&(!date||date.date<=today||date.seats<share.adults+share.children))reasons.push('原推荐日期已过期或余位不足');
    return {share,product:p,changed:reasons.length>0,reason:reasons.join('；')};
  }
  function verify(s,id,phone,code){const {share}=view(s,id);need(share.customerId,'公开推荐无需验证');const c=M.customer(s,share.customerId);need(c&&c.phone===clean(phone)&&code==='123456','手机号或演示验证码与推荐客户不一致');return share.id;}
  function consult(s,id,f,verified=false){
    const {share}=view(s,id);need(!share.customerId||verified,'请先核对推荐客户身份');
    need(clean(f.name)&&clean(f.name).length<=30&&/^1\d{10}$/.test(clean(f.phone)),'请填写姓名和11位手机号');
    if(share.customerId)need(M.customer(s,share.customerId)?.phone===clean(f.phone),'咨询手机号须与本次推荐客户一致');
    need(f.consent,'请同意顾问就本次出行联系您');
    need(!f.date||(validDate(f.date)&&f.date>M.TODAY),'意向出发日期须晚于演示今天，也可留空待定');
    const pax=Number(f.pax);need(Number.isInteger(pax)&&pax>=1&&pax<=30,'请核对出行人数（1–30人）');
    const existing=s.shareConsultations.find(x=>x.shareId===id&&x.phone===clean(f.phone)&&x.status==='待接待');if(existing)return existing;
    const x={id:uid('ZX'),shareId:id,productId:share.productId,advisor:share.advisor.name,name:clean(f.name),phone:clean(f.phone),date:f.date||'',pax,note:clean(f.note).slice(0,1000),status:'待接待',created:M.TODAY};s.shareConsultations.unshift(x);return x;
  }
  function accept(s,id,f){
    normalize(s);const x=s.shareConsultations.find(x=>x.id===id);need(x,'咨询记录不存在');if(x.demandId)return M.demand(s,x.demandId);
    const p=product(x.productId);need(f,'请先核对客户本次需求');const errors=M.validateDemand(f);need(!errors.length,errors.join('；'));let c=s.customers.find(c=>c.phone===x.phone);if(!c){c={id:uid('c'),name:x.name,phone:x.phone,tag:'新客',note:'来自产品推荐咨询',demands:[]};s.customers.push(c);}
    const d={...f,id:uid('d'),customerId:c.id,source:'产品分享咨询',sourceShareId:x.shareId,stage:'新需求',followAt:'',followups:[],candidates:[p.id],orderIds:[],plans:[],selected:null,messages:[],closeReason:''};
    s.demands.push(d);c.demands.unshift(d.id);x.status='已接待';x.demandId=d.id;return d;
  }
  function revoke(s,id){const x=s.productShares.find(x=>x.id===id);need(x,'推荐记录不存在');x.revoked=true;}
  return {advisor,normalize,afterDays,quote,create,view,verify,consult,accept,revoke};
});
