/* Caesar sales prototype. Scenario data is local and never sent to ERP. */
(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.SalesModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TODAY = '2026-09-27';
  const clone = value => JSON.parse(JSON.stringify(value));
  const money = n => '¥' + Number(n).toLocaleString('zh-CN');
  const itinerary = [
    {title:'北京 → 大阪', detail:'抵达关西机场，专车接机。入住大阪难波酒店，留出休息时间。',stay:'大阪难波 · 家庭房', meal:'晚餐自理',activity:'接机 · 自由活动'},
    {title:'与海洋来一次相遇',detail:'上午大阪海游馆，下午天保山摩天轮。预留午休，慢慢感受港湾。',stay:'大阪难波 · 家庭房',meal:'酒店早餐',activity:'海游馆 · 天保山'},
    {title:'走进京都的秋天',detail:'前往京都，清水寺与二年坂漫步。下午参加茶道体验，入住京都。',stay:'京都四条 · 家庭房',meal:'早餐 · 午餐',activity:'清水寺 · 茶道'},
    {title:'岚山，一整天的留白',detail:'乘岚山小火车，沿竹林步道散步。午后自由探索，傍晚回酒店。',stay:'京都四条 · 家庭房',meal:'酒店早餐',activity:'小火车 · 竹林'},
    {title:'奈良小鹿与大阪夜色',detail:'上午奈良公园，下午回大阪。道顿堀晚餐，给旅行留下一个轻松的结尾。',stay:'大阪难波 · 家庭房',meal:'酒店早餐',activity:'奈良公园 · 道顿堀'},
    {title:'大阪 → 北京',detail:'根据航班时间送机，返回北京。',stay:'温暖的家',meal:'酒店早餐',activity:'专车送机'}
  ];
  const products = [
    {id:'p1',title:'日本关西深度游6日',subtitle:'大阪 · 京都 · 奈良',type:'跟团游',image:'kyoto.svg',departure:'北京',days:6,adult:9800,child:6800,room:800,dates:[{date:'2026-11-15',seats:12,mode:'即时确认'},{date:'2026-11-22',seats:0,mode:'即时确认'},{date:'2026-12-06',seats:8,mode:'二次确认'}],tags:['一日自由活动','精选市区酒店'],description:'从大阪的烟火日常，到京都的秋色古寺。经典三城，保留自由探索的时间。',includes:'往返经济舱机票、5晚双人间、行程内交通及首道门票、领队服务。',excludes:'签证、个人消费、自由活动餐费及自选项目。儿童价适用2–11岁不占床；占床每人另加¥800。',policy:'取消须按合同约定核算实际损失，申请后由业务审核。',itinerary},
    {id:'p2',title:'三亚亲子海岸5日',subtitle:'海棠湾 · 蜈支洲岛',type:'自由行',image:'coast.svg',departure:'北京',days:5,adult:6800,child:4200,room:600,dates:[{date:'2026-10-18',seats:6,mode:'二次确认'},{date:'2026-11-15',seats:10,mode:'二次确认'}],tags:['海边慢生活','亲子酒店'],description:'把时间留给海风。亲子酒店连住，专车接送，自由安排海边时光。',includes:'往返经济舱机票、4晚酒店、机场接送。',excludes:'正餐、岛上自费活动；儿童占床另加¥600。',policy:'资源确认前可撤回申请；确认后按订单约定办理。',itinerary:itinerary.slice(0,5).map((x,i)=>({...x,title:['北京 → 三亚','海棠湾的早晨','蜈支洲岛一日','留给海边的一天','三亚 → 北京'][i],detail:'按已发布产品安排，酒店及交通须二次确认。',stay:i===4?'温暖的家':'海棠湾亲子酒店',activity:'海边度假'}))},
    {id:'p3',title:'瑞士湖山慢游9日',subtitle:'苏黎世 · 卢塞恩 · 因特拉肯',type:'跟团游',image:'alps.svg',departure:'上海',days:9,adult:22800,child:19800,room:1200,dates:[{date:'2026-11-08',seats:4,mode:'即时确认'}],tags:['全程四星','湖区连住'],description:'在湖畔小镇与阿尔卑斯山间，寻找从容的旅行节奏。',includes:'往返机票、8晚住宿、行程内交通、领队服务。',excludes:'签证及个人消费。',policy:'按签署合同的退改约定办理。',itinerary:[]}
  ];
  const requestKey = d => JSON.stringify([d.destination,d.date,d.days,d.adults,d.children,d.childAge,d.preference,d.departure||'北京',d.dateMode||(d.date?'exact':'unknown'),d.month||'',d.dateEnd||'',d.budget||null]);
  const intentKey = d => requestKey(d);
  const stages=['新需求','跟进中','方案沟通','待成交'];
  function normalize(s){
    s.demands.forEach(d=>{
      const legacy=JSON.stringify([d.destination,d.date,d.days,d.adults,d.children,d.childAge,d.preference]);
      d.departure??='北京';d.dateMode??=d.date?'exact':'unknown';d.month??='';d.dateEnd??='';d.source??='门店咨询';d.stage??=d.plans?.length?'方案沟通':'新需求';d.followAt??='';d.followups??=[];d.candidates??=[];d.closeReason??='';d.orderIds??=[];
      if(!s.flowVersion)(d.plans||[]).forEach(p=>{if(p.requestKey===legacy)p.requestKey=requestKey(d);if(p.quote?.context===legacy)p.quote.context=requestKey(d);});
    });s.flowVersion=1;return s;
  }
  function intentStage(d){return d.orderIds?.length||d.plans?.some(p=>p.orderId)?'已转订单':d.stage||'新需求';}
  function dateMatches(d,date){return d.dateMode==='month'?date.startsWith(d.month):d.dateMode==='range'?date>=d.date&&date<=d.dateEnd:d.dateMode==='unknown'?true:!d.date||date===d.date;}
  function validateDemand(f){
    const errors=[];
    if(!String(f.destination||'').trim())errors.push('请填写目的地');
    if(!['unknown','month','range','exact'].includes(f.dateMode))errors.push('请选择日期明确程度');
    const valid=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
    if(['exact','range'].includes(f.dateMode)&&(!valid(f.date)||f.date<=TODAY))errors.push('请填写晚于演示今天的有效出发日期');
    if(f.dateMode==='range'&&(!valid(f.dateEnd)||f.dateEnd<f.date))errors.push('结束日期不能早于开始日期');
    if(f.dateMode==='month'&&(!/^\d{4}-(0[1-9]|1[0-2])$/.test(f.month||'')||f.month<TODAY.slice(0,7)))errors.push('请填写有效的出行月份');
    if(!Number.isInteger(f.adults)||f.adults<1||f.adults>20||!Number.isInteger(f.children)||f.children<0||f.children>10)errors.push('请核对成人与儿童人数');
    if(f.childAge!==null&&(!Number.isInteger(f.childAge)||f.childAge<0||f.childAge>17))errors.push('请核对儿童年龄');
    if(!Number.isInteger(f.days)||f.days<1||f.days>30)errors.push('行程天数须为1至30日');
    if(f.budget!==null&&(!Number.isFinite(f.budget)||f.budget<=0))errors.push('预算须大于0，也可留空待定');
    if(f.followAt&&!valid(f.followAt))errors.push('回访日期无效');
    return errors;
  }
  function updateDemand(d,patch){
    if(['已关闭','已转订单'].includes(intentStage(d)))throw Error('本次意向已结束，请恢复或建立新需求');
    const errors=validateDemand(patch);if(errors.length)throw Error(errors.join('；'));
    const before=requestKey(d),next={...d,...patch,date:patch.dateMode==='unknown'||patch.dateMode==='month'?'':patch.date,month:patch.dateMode==='month'?patch.month:'',dateEnd:patch.dateMode==='range'?patch.dateEnd:''};
    if(before!==requestKey(next)&&d.plans.length){next.selected=null;d.messages.push({role:'assistant',text:'本次需求已更新，历史方案保留。请按新需求重新规划、核价与确认。'});}
    Object.assign(d,next);return d;
  }
  function followDemand(d,f){
    if(['已关闭','已转订单'].includes(intentStage(d)))throw Error('当前意向不能更改跟进阶段');
    if(!stages.includes(f.stage)||!f.text?.trim())throw Error('请选择阶段并填写本次跟进内容');
    if(f.followAt&&(!/^\d{4}-\d{2}-\d{2}$/.test(f.followAt)||f.followAt<TODAY))throw Error('下次回访不能早于演示今天');
    d.stage=f.stage;d.followAt=f.followAt||'';d.followups.unshift({text:f.text.trim(),stage:f.stage,followAt:d.followAt,date:TODAY});
  }
  function closeDemand(d,reason){if(intentStage(d)==='已转订单')throw Error('已转订单请进入订单办理');if(!reason?.trim())throw Error('请填写关闭原因');d.previousStage=d.stage;d.stage='已关闭';d.closeReason=reason.trim();d.followups.unshift({text:'关闭意向：'+reason.trim(),date:TODAY});}
  function reopenDemand(d){if(d.stage!=='已关闭')throw Error('该意向未关闭');d.stage=stages.includes(d.previousStage)?d.previousStage:'跟进中';d.followups.unshift({text:'恢复意向，原需求和记录保留。',date:TODAY});d.closeReason='';}
  function productMatch(p,d){
    const dates=p.dates.filter(z=>dateMatches(d,z.date)&&z.seats>=d.adults+d.children),issues=[];
    if(d.dateMode==='unknown')issues.push('具体出发日期待定');
    if(d.destination&&!((p.title+p.subtitle).includes(d.destination)||d.destination==='欧洲'&&p.id==='p3'))issues.push('目的地不同');
    if(d.departure&&d.departure!==p.departure)issues.push('出发城市不同');
    if(!dates.length)issues.push('所需日期或人数暂无可售名额');
    const total=p.adult*d.adults+p.child*d.children;
    if(d.budget&&total>d.budget)issues.push('参考总额超预算');
    if(d.days&&d.days!==p.days)issues.push('行程天数不同');
    if(d.children&&(d.childAge===null||d.childAge===''||d.childAge==null))issues.push('儿童年龄待补');
    else if(d.children&&(d.childAge<2||d.childAge>11))issues.push('儿童年龄不适用当前规格');
    return {dates,issues,total};
  }
  function bookingFor(s,id,productId,date){
    const d=demand(s,id),p=products.find(p=>p.id===productId);if(!d||!p)throw Error('请先选择客户本次需求和产品');
    if(['已关闭','已转订单'].includes(intentStage(d)))throw Error('请恢复意向，或为本次预订建立新需求');
    const c=customer(s,d.customerId);return {kind:'standard',demandId:d.id,demandKey:intentKey(d),productId,date,customerId:c.id,contact:c.name,phone:c.phone,adults:d.adults,children:d.children,childAge:d.childAge??'',childBed:d.children?'不占床':'',accept:false};
  }
  function extractDemand(text){
    const p={},city=['北京','上海','广州'].find(x=>text.includes('从'+x)||text.includes(x+'出发'));if(city)p.departure=city;
    const dest=['日本','三亚','欧洲','瑞士'].find(x=>text.includes(x));if(dest)p.destination=dest;
    let m=text.match(/(\d+)\s*(?:大|成人)\s*(\d+)\s*(?:小|儿童)/);if(m){p.adults=+m[1];p.children=+m[2];}
    m=text.match(/(?:孩子|儿童)\s*(\d+)\s*岁/);if(m)p.childAge=+m[1];
    m=text.match(/(\d+)\s*(?:天|日游)/);if(m)p.days=+m[1];
    m=text.match(/预算\s*(\d+(?:\.\d+)?)\s*(万|元)?/);if(m)p.budget=+m[1]*(m[2]==='万'?10000:1);
    m=text.match(/(?:(20\d{2})年)?(\d{1,2})月(?:(\d{1,2})日)?/);if(m){const month=(m[1]||TODAY.slice(0,4))+'-'+m[2].padStart(2,'0');if(m[3]){p.dateMode='exact';p.date=month+'-'+m[3].padStart(2,'0');}else{p.dateMode='month';p.month=month;}}
    return p;
  }
  function makePlan(v, slow=false) {
    const days=clone(itinerary);
    if(slow) {days[2].detail='大阪直达京都，只安排清水寺漫步，茶道移至第4天；下午提前入住休息。';days[2].activity='清水寺 · 酒店休息';days[3].detail='上午岚山竹林，午后茶道体验。取消小火车与市内换乘，专车往返。';days[3].activity='岚山竹林 · 茶道';}
    if(v>=3){days[4].title='大阪，再留一个悠闲午后';days[4].detail='取消奈良往返，上午住处附近散步，下午大阪城公园自由活动。全程减少一次跨城出行。';days[4].activity='大阪城公园 · 自由活动';}
    return {version:v,title:'日本亲子慢游6日',days,change:v>=3?'取消奈良往返，第5天留在大阪自由活动，比第2版减少一次跨城交通。':slow?'京都拆为两天，减少一次换乘，增加专车衔接。':'保留海游馆与岚山体验，经典三城亲子安排。',total:slow&&v<3?29600:28800,quote:null,confirmation:null,orderId:null};
  }
  function seed() {
    const s = {schema:2,activeDemand:'d1',aiOffline:false,customers:[
      {id:'c1',name:'李梅',phone:'13800000001',tag:'老客',note:'偏爱宽松行程，亲子出行。',demands:['d1','d4']},
      {id:'c2',name:'张建国',phone:'13800000002',tag:'老客',note:'重视酒店位置和行程舒适度。',demands:['d2']},
      {id:'c3',name:'陈红',phone:'13800000003',tag:'新客',note:'首次出境，关注合同与出行资料。',demands:['d3']},
      {id:'c4',name:'王强',phone:'13800000004',tag:'新客',note:'有亲子出行意向，日期还未确定。',demands:['d5']}
    ],demands:[
      {id:'d1',customerId:'c1',destination:'日本',date:'2026-11-15',days:6,adults:2,children:1,childAge:8,budget:30000,preference:'海游馆、京都，少换酒店，不赶路',plans:[makePlan(1),makePlan(2,true)],selected:2,messages:[{role:'user',text:'李梅一家2大1小，孩子8岁。11月15日从北京去日本6天，预算3万元。想去海游馆和京都，行程轻松一点。'},{role:'assistant',text:'已按亲子出行整理为大阪、京都、奈良6日方案。第2版把京都拆为两天，减少换乘。正式开单前需要采用对应报价，并记录客户确认。',kind:'plan',version:2}]},
      {id:'d2',customerId:'c2',destination:'欧洲',date:'2026-10-18',days:12,adults:2,children:0,budget:48000,preference:'经典线路',plans:[],selected:null,messages:[]},
      {id:'d3',customerId:'c3',destination:'日本',date:'2026-10-18',days:6,adults:2,children:0,budget:19600,preference:'标准跟团',plans:[],selected:null,messages:[]},
      {id:'d4',customerId:'c1',destination:'三亚',date:'2027-02-06',days:5,adults:2,children:1,childAge:8,budget:22000,preference:'春节海边度假',plans:[],selected:null,messages:[]},
      {id:'d5',customerId:'c4',destination:'日本',date:'',days:6,adults:2,children:1,childAge:null,budget:28000,preference:'亲子，具体日期待定',plans:[],selected:null,messages:[]}
    ],orders:[
      {id:'KS202609270018',customerId:'c2',title:'欧洲十国经典游',date:'2026-10-18',adults:2,children:0,total:48000,status:'已确认',paid:10000,kind:'standard',company:'凯撒旅游北京公司',resource:'已确认',contract:'已签署',claims:[{amount:10000,status:'已确认',payer:'张建国',reference:'SK0926001'},{amount:20000,status:'已退回',payer:'张伟',reference:'RK0926002',reason:'付款人与客户不同，缺少代付关系说明。'}],travelers:[{name:'张建国',english:'ZHANG/JIANGUO',passport:'E00000001',expiry:'2029-10-10',birth:'1978-06-08'},{name:'刘芳',english:'',passport:'',expiry:'',birth:''}],aftersales:[],logs:['9月26日 16:20  财务退回认款：代付关系资料不完整。','9月25日 11:30  旅游合同已签署。']},
      {id:'KS202609270026',customerId:'c3',title:'日本关西深度游6日',date:'2026-10-18',adults:2,children:0,total:19600,status:'已确认',paid:8000,kind:'standard',company:'凯撒旅游北京公司',resource:'已确认',contract:'待签署',claims:[{amount:8000,status:'已确认',payer:'陈红',reference:'SK0927003'}],travelers:[{name:'陈红',english:'CHEN/HONG',passport:'E00000003',expiry:'2029-12-01',birth:'1988-07-08'},{name:'周伟',english:'ZHOU/WEI',passport:'E00000004',expiry:'2030-01-20',birth:'1985-02-12'}],aftersales:[],logs:['9月27日 10:20  已发起合同签署。']}
    ],bookingDraft:null,notes:[],serial:30};
    s.demands.forEach(d=>d.plans.forEach(p=>p.requestKey=requestKey(d)));
    return normalize(s);
  }
  const demand = (s,id=s.activeDemand)=>s.demands.find(d=>d.id===id);
  const customer = (s,id)=>s.customers.find(c=>c.id===id);
  const plan = d=>(d?.plans||[]).find(p=>p.version===d.selected&&(!p.requestKey||p.requestKey===requestKey(d)));
  function missing(d) {const out=[];if(!d.date||d.dateMode&&d.dateMode!=='exact')out.push('出发日期');if(d.children>0 && (d.childAge===null || d.childAge==='' || !Number.isFinite(Number(d.childAge))))out.push('儿童年龄');if(!d.destination)out.push('目的地');return out;}
  function revise(s,id) {
    const d=demand(s,id);if(!d)throw Error('需求不存在');if(d.destination!=='日本'||d.days!==6)throw Error('本轮自动编排仅提供日本亲子场景，可人工维护需求。');if(missing(d).length)throw Error('请先补充'+missing(d).join('、'));
    const p=makePlan(Math.max(0,...d.plans.map(p=>p.version))+1,true);p.requestKey=requestKey(d);d.plans.push(p);d.selected=p.version;return p;
  }
  function quoteFor(d,p,expired=false) {
    if(d.destination!=='日本'||d.date!=='2026-11-15'||d.adults!==2||d.children!==1||Number(d.childAge)!==8||d.days!==6)return null;
    if(p.requestKey&&p.requestKey!==requestKey(d))return null;
    return {context:requestKey(d),id:'BJ-JP-0927-V'+p.version,total:p.total,version:p.version,validUntil:expired?'2026-09-26':'2026-10-10',resource:'已确认',owner:'日本产品组 · 周宁',scope:'11月15日 · 北京往返 · 2大1小（8岁） · 6日',items:[{name:'国际往返交通',amount:12000},{name:'5晚家庭房含早',amount:9600},{name:'接送及当地交通',amount:p.total===29600?5000:4200},{name:'门票与当地服务',amount:3000}]};
  }
  function adoptQuote(d,p,q) {if(!q||q.version!==p.version||q.total!==p.total||q.context!==requestKey(d))throw Error('报价与当前方案不一致');if(q.validUntil<TODAY)throw Error('报价已过期，请产品组重新核价');if(q.resource!=='已确认')throw Error('资源尚未确认');p.quote=clone(q);}
  function confirmPlan(d,p,evidence) {if(!p.quote||p.quote.validUntil<TODAY||p.quote.context!==requestKey(d))throw Error('请先采用有效报价');if(!String(evidence).trim())throw Error('请填写客户确认依据');p.confirmation={evidence:String(evidence).trim(),date:TODAY,version:p.version};}
  function standardTotal(b) {const p=products.find(p=>p.id===b.productId);if(!p)return 0;return Number(b.adults)*p.adult+Number(b.children)*(p.child+(b.childBed==='占床'?p.room:0));}
  function validateBooking(s,b) {
    const errors=[];
    if(b.bookingId&&s.orders.some(o=>o.bookingId===b.bookingId))errors.push('该开单草稿已经提交，请查看订单');
    if(!customer(s,b.customerId))errors.push('请选择客户');
    if(b.demandId&&b.kind!=='custom'){
      const source=demand(s,b.demandId);
      if(!source||source.customerId!==b.customerId)errors.push('客户与本次需求不一致');
      else if(['已关闭','已转订单'].includes(intentStage(source)))errors.push('该意向已关闭或已转订单');
      else if(b.demandKey!==intentKey(source))errors.push('需求已更新，请重新从本次需求核对预订');
    }
    if(!b.contact?.trim())errors.push('请填写联系人');
    if(!/^1\d{10}$/.test(b.phone||''))errors.push('请填写11位手机号码');
    if(!Number.isInteger(Number(b.adults))||Number(b.adults)<1||Number(b.adults)>20||!Number.isInteger(Number(b.children))||Number(b.children)<0||Number(b.children)>10)errors.push('请核对成人及儿童人数');
    if(b.kind==='custom') {
      const d=demand(s,b.demandId),p=plan(d);
      if(!d||!p||p.version!==b.version||d.customerId!==b.customerId)errors.push('客户或方案版本已变化，请重新核对');
      else {if(!p.quote||p.quote.validUntil<TODAY)errors.push('请先采用有效报价');if(!p.confirmation||p.confirmation.version!==p.version)errors.push('尚未记录本版客户确认');if(p.orderId)errors.push('该版方案已转订单');if(Number(b.adults)!==d.adults||Number(b.children)!==d.children||b.date!==d.date)errors.push('人数或日期与确认方案不一致');}
    } else {
      const p=products.find(p=>p.id===b.productId),dt=p?.dates.find(d=>d.date===b.date);
      if(!dt)errors.push('请选择可售团期');
      else if(dt.seats<Number(b.adults)+Number(b.children))errors.push('当前团期余位不足，请更换日期');
      if(Number(b.children)>0 && (!['占床','不占床'].includes(b.childBed)||b.childAge===''||b.childAge==null||Number(b.childAge)<2||Number(b.childAge)>11))errors.push('请核对儿童年龄（2–11岁）及占床方式');
    }
    if(!b.accept)errors.push('请核对费用与退改约定');return errors;
  }
  function submitBooking(s,b) {
    const errors=validateBooking(s,b);if(errors.length)throw Error(errors[0]);
    const d=b.kind==='custom'?demand(s,b.demandId):null,p=d?plan(d):products.find(p=>p.id===b.productId);
    const resource=d?'已确认':p.dates.find(x=>x.date===b.date).mode==='即时确认'?'已确认':'待确认';
    const order={bookingId:b.bookingId||null,id:'KS20260927'+String(++s.serial).padStart(4,'0'),customerId:b.customerId,title:p.title,date:b.date,adults:Number(b.adults),children:Number(b.children),total:d?p.total:standardTotal(b),status:d||resource==='待确认'?'待确认':'已确认',paid:0,kind:b.kind,company:'凯撒旅游北京公司',resource,contract:'未生成',claims:[],travelers:Array.from({length:Number(b.adults)+Number(b.children)},(_,i)=>({name:i===0?b.contact:'',english:'',passport:'',expiry:'',birth:''})),aftersales:[],logs:[d?'销售提交客户确认方案，待项目审核。':'销售提交预订。'],version:d?p.version:null};
    s.orders.unshift(order);if(d)p.orderId=order.id;
    const source=b.demandId&&demand(s,b.demandId);if(source){order.demandId=source.id;source.orderIds??=[];source.orderIds.push(order.id);source.followAt='';}
    s.bookingDraft=null;return order;
  }
  function submitClaim(o,f) {
    if(o.status!=='已确认')throw Error('此订单尚未确认，请先查看业务审核进度');
    const editing=f.claimIndex!==undefined,prior=editing?o.claims[f.claimIndex]:null;
    if(editing&&(!Number.isInteger(f.claimIndex)||prior?.status!=='已退回'))throw Error('原认款申请不可补充，请查看最新状态');
    const proof=f.proof?.trim()||prior?.proof||'';
    const amount=Number(f.amount),pending=o.claims.filter(x=>x.status==='待复核').reduce((n,x)=>n+x.amount,0);
    if(!Number.isFinite(amount)||amount<=0||amount>o.total-o.paid-pending)throw Error('金额需大于0，且不超过扣除待复核后的未收金额');
    if(!f.payer?.trim()||!f.reference?.trim()||!proof)throw Error('请补齐付款人、交易流水号和付款凭证');
    if(o.claims.some(x=>x.reference===f.reference.trim()&&x.status!=='已退回'))throw Error('该交易流水号已有认款记录');
    if(f.payer.trim()!==f.customerName && !f.relation?.trim())throw Error('代付款需填写付款人与客户的关系');
    const record={amount,status:'待复核',payer:f.payer.trim(),reference:f.reference.trim(),proof,relation:f.relation||'',date:f.date||TODAY};
    if(prior){const history=[...(prior.history||[]),'原申请 '+prior.reference+' · '+money(prior.amount)+' · 退回：'+(prior.reason||'资料待补'),'已补充并重新提交财务复核'];Object.assign(prior,record,{reason:'',history});}
    else o.claims.push(record);
    o.logs.unshift((prior?'已补充原认款申请 ':'已提交认款 ')+money(amount)+'，待财务复核。');return prior||record;
  }
  function submitAftersale(o,f) {
    if(o.status!=='已确认')throw Error('待确认订单请先完成业务确认');
    if(o.aftersales.some(x=>x.status==='待审核'))throw Error('已有待审核申请，请查看进度');
    if(!['改期','退订'].includes(f.type)||!f.reason?.trim())throw Error('请选择诉求并填写原因');
    if(f.type==='改期'&&(!f.date||f.date<=TODAY||f.date===o.date))throw Error('请选择不同且晚于今天的期望出发日期');
    if(f.type==='退订'&&(!Number.isFinite(Number(f.amount))||Number(f.amount)<=0||Number(f.amount)>o.paid))throw Error('退款诉求金额须大于0且不超过已确认收款');
    o.aftersales.push({id:'SH'+o.id.slice(2)+'01',type:f.type,reason:f.reason.trim(),date:f.date||'',amount:f.type==='退订'?Number(f.amount):0,status:'待审核'});o.logs.unshift('已提交'+f.type+'申请，待业务审核。');
  }
  function travelerErrors(t,date) {
    const errors=[];if(!t.name?.trim()||!t.english?.trim()||!t.passport?.trim()||!t.birth||!t.expiry)errors.push('请补齐姓名、英文名、证件、出生日期及有效期');
    if(t.birth>=TODAY)errors.push('出生日期须早于今天');if(t.expiry && t.expiry<=date)errors.push('证件有效期不覆盖出行日期');return errors;
  }
  return {TODAY,requestKey,intentKey,stages,normalize,intentStage,dateMatches,validateDemand,updateDemand,followDemand,closeDemand,reopenDemand,productMatch,bookingFor,extractDemand,clone,money,products,seed,demand,customer,plan,missing,revise,quoteFor,adoptQuote,confirmPlan,standardTotal,validateBooking,submitBooking,submitClaim,submitAftersale,travelerErrors};
});
