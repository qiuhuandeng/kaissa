/* 供应商档案与协议的页面内演示；不持久化、不向外部审批或财务系统发送数据。 */
(function (root) {
  'use strict';
  const categories = ['境外地接', '国内旅行社', '出境批发商', '单项供应商', '综合类供应商'];
  const regions = ['国内', '港澳台', '欧洲', '亚洲', '美洲', '大洋洲', '非洲'];
  const groupTypes = ['单团', '定制', '散拼', '研学', '单项', '会议会展'];
  const companies = ['福建凯撒', '北京凯撒', '上海凯撒', '亿步', '体坛', '亿步山西分公司'];
  // 与目的地分类页相同的业务名称；其他目的地允许按国家、城市补充。
  const destinations = [
    ['欧洲', '法国', '巴黎'], ['欧洲', '法国', '尼斯'], ['欧洲', '意大利', '罗马'], ['欧洲', '意大利', '米兰'],
    ['欧洲', '芬兰', '赫尔辛基'], ['欧洲', '挪威', '奥斯陆'], ['欧洲', '瑞典', '斯德哥尔摩'], ['欧洲', '冰岛', '雷克雅未克'],
    ['亚洲', '日本', '东京'], ['亚洲', '日本', '大阪'], ['亚洲', '日本', '京都'], ['亚洲', '泰国', '曼谷'], ['亚洲', '泰国', '清迈'], ['亚洲', '泰国', '普吉'],
    ['国内', '中国', '北京'], ['国内', '中国', '三亚'], ['国内', '中国', '兰州'], ['国内', '中国', '敦煌'],
    ['港澳台', '中国香港', '香港'], ['美洲', '美国', '洛杉矶'], ['大洋洲', '澳大利亚', '悉尼'], ['非洲', '埃及', '开罗']
  ];
  const copy = v => JSON.parse(JSON.stringify(v));
  const placeLabel = p => p[1]==='全区域' ? p[0]+' / 全区域' : p[0]+' / '+p[1]+' / '+(p[2]||'全国／全地区');
  const cooperationText = s => [s.service,(s.places||[]).map(placeLabel).join('；')].filter(Boolean).join('；');
  function validatePlace(p) {
    const [region,country,city]=p;
    if(!regions.includes(region)||!country)return '请选择业务区域，并填写国家／地区或选择全区域。';
    if(country==='全区域')return city?'全区域不能同时指定城市。':'';
    const countries=destinations.filter(x=>x[1]===country),cities=destinations.filter(x=>x[2]===city);
    if(countries.length&&!countries.some(x=>x[0]===region))return '国家／地区与业务区域不一致，请核对。';
    if(city&&cities.length&&!cities.some(x=>x[0]===region&&x[1]===country))return '城市与国家／地区不一致，请核对。';
    return '';
  }
  function placeMatches(p,f) {
    if(f.region&&p[0]!==f.region)return false;
    if(p[1]==='全区域')return (!f.country&&!f.city)||destinations.some(x=>x[0]===p[0]&&(!f.country||normalize(x[1]).includes(normalize(f.country)))&&(!f.city||normalize(x[2]).includes(normalize(f.city))));
    if(f.country&&!normalize(p[1]).includes(normalize(f.country)))return false;
    if(!f.city)return true;
    return p[2]?normalize(p[2]).includes(normalize(f.city)):destinations.some(x=>x[0]===p[0]&&x[1]===p[1]&&normalize(x[2]).includes(normalize(f.city)));
  }
  function addPlace(places,p) {
    const problem=validatePlace(p);if(problem)throw Error(problem);
    if(places.some(x=>x[0]===p[0]&&(x[1]==='全区域'||x[1]===p[1]&&(!x[2]||x[2]===p[2]))))throw Error('已添加的服务地区已包含此范围。');
    return places.filter(x=>!(x[0]===p[0]&&(p[1]==='全区域'||p[1]===x[1]&&!p[2]))).concat([p]);
  }
  const normalize = v => String(v || '').normalize('NFKC').replace(/[\s（）()·.,，。-]/g, '').toLowerCase();
  const localDay = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'); };
  const file = name => ({ name, sample: true, date: '2026-09-17' });
  const body = (company, kind = '事件后付款', days = '30', extra = {}) => Object.assign({ company, department: '产品采购部', owner: '王珊', kind, event: '实际回团', days, monthRule: '', otherRule: '', contact: '林娜', phone: '13800002601', fee: '按合同约定，待核对', note: '', currency: ['CNY'] }, extra);
  function term(b) {
    if (b.kind === '月结') return b.monthRule ? '月结；' + b.monthRule : '月结；结算日及付款日待确认';
    if (b.kind === '事件后付款') return b.event + '后' + b.days + '天';
    return b.otherRule || '具体约定待确认';
  }
  function agreement(no, name, bodies, extra = {}) {
    return Object.assign({ no, name, service: '旅游产品及地接服务', start: '2026-01-01', end: '2026-12-31', status: '已归档', bodies, contract: file(name + '（送审件）.pdf'), stamps: [{ file: file(name + '（双方盖章）.pdf'), date: '2026-06-18', uploader: '王珊' }], application: '', effective: '已确认', reason: '', history: [] }, extra);
  }
  function createSession(legacy = [], today = localDay()) {
    let sequence = 0;
    const suppliers = [];
    const applications = [];
    const profileChanges = {};
    function next(prefix) {
      let id;
      do { sequence++; if(sequence>9999)throw Error('当日演示编号已用完。'); id=prefix+today.replace(/-/g,'')+String(sequence).padStart(4,'0'); }
      while(suppliers.some(s=>s.id===id||s.agreements.some(a=>a.no===id))||applications.some(a=>a.no===id));
      return id;
    }
    function make(id, name, category, places, extra = {}) {
      return Object.assign({ id, name, english: '', brand: name, registered: places[0] ? places[0][1] : '', address: '', registration: '', legal: '', legalPhone: '', manager: '', managerPhone: '', contact: '林娜', phone: '13800002601', wechat: '', email: '', owner: '王珊', categories: category, regions: [...new Set(places.map(p=>p[0]))], places, groups: ['单团','定制'], service: '旅游产品及地接服务', status: '已准入', temporary: false, companies: ['福建凯撒'], documents: { business: file('营业执照.pdf'), license: file('经营资质.pdf') }, remark: '', agreements: [], accounts: [] }, extra);
    }
    suppliers.push(make('SUP-GRP-0001','北京协成国际旅行服务有限公司',['国内旅行社','出境批发商'],[destinations[0],destinations[2]], { brand:'协成', english:'Xiecheng Travel Services Co., Ltd.', registration:'91110105MA01XC2601', registered:'中国 / 北京', address:'北京市朝阳区建国路88号', legal:'林志成', manager:'陈红', owner:'张计调', companies:['福建凯撒','上海凯撒','北京凯撒'], agreements:[agreement('AGR-FJ-2026-018','2026年度欧洲外采合作协议',[body('福建凯撒'),body('上海凯撒','月结','',{monthRule:'每月对账，付款日待确认',owner:'林洁'})],{end:'2026-11-30'}),agreement('AGR-BJ-2026-009','短线产品单团结算协议',[body('北京凯撒','事件后付款','7')],{end:'2027-02-28'})]}));
    suppliers.push(make('SUP-GRP-0002','深圳新启航国际旅行社有限公司',['出境批发商','国内旅行社'],[destinations[8],destinations[11]], {brand:'新启航旅游', registration:'91440300MA5HNQ2602', owner:'毕业磊', companies:['福建凯撒','上海凯撒','北京凯撒'], agreements:[agreement('AGR-NQ-FJ-001','东南亚年度合作协议',[body('福建凯撒')]),agreement('AGR-BJ-20260917-01','京沪日韩产品合作协议',[body('北京凯撒','事件后付款','30'),body('上海凯撒','月结','',{monthRule:'按月核对，具体付款日待确认'})],{status:'审批中',effective:'待确认',application:'APR-AGR-20260917-006',stamps:[]}),agreement('AGR-NQ-RETURN','定制产品补充协议',[body('福建凯撒')],{status:'已退回',effective:'待确认',reason:'请补充结算日期约定。',application:'APR-AGR-20260918-007',stamps:[]}),agreement('AGR-NQ-APPROVED','冬季研学合作协议',[body('福建凯撒','事件后付款','3')],{status:'待归档',effective:'待确认',stamps:[],application:'APR-AGR-20260919-008',start:'2026-10-01',end:'2027-03-31'})]}));
    suppliers.push(make('SUP-GRP-0003','Nordic Aurora DMC Oy',['境外地接'],[destinations[4],destinations[5],destinations[6],destinations[7]],{brand:'北欧极光地接社',registration:'FI-REG-882071',registered:'芬兰 / 赫尔辛基',contact:'Mika',phone:'+358 0000 2071',owner:'王珊',status:'审批中',application:'APR-SUP-20260917-003',documents:{business:file('境外注册证明.pdf')}}));
    suppliers.push(make('SUP-GRP-0004','MSC Cruises S.A.',['单项供应商'],[destinations[0],destinations[2]],{brand:'地中海邮轮 MSC Cruises',registered:'瑞士 / 日内瓦',service:'邮轮包舱、单船票',owner:'赵明',agreements:[agreement('AGR-MSC-2026','邮轮资源合作协议',[body('福建凯撒')])]}));
    suppliers.push(make('SUP-GRP-0005','甘肃丝路专列运营有限公司',['单项供应商'],[destinations[16],destinations[17]],{brand:'丝路专列运营中心',service:'专列铺位及主题线路',owner:'赵明',agreements:[agreement('AGR-TRAIN-2026','专列资源合作协议',[body('福建凯撒')],{end:'2027-02-28'})]}));
    suppliers.push(make('SUP-GRP-0006','DEF Thailand Travel Co., Ltd.',['境外地接'],[destinations[11],destinations[12],destinations[13]],{brand:'泰国地接 DEF',status:'已停用',owner:'刘洋',agreements:[agreement('AGR-DEF-2025','泰国地接合作协议',[body('福建凯撒')],{start:'2025-01-01',end:'2025-07-31'})]}));
    const euro = make('SUP-GRP-0007','欧洲联合地接社',['境外地接'],[destinations[0],destinations[2]],{registration:'EU-DEMO-0007',owner:'王芳',companies:['福建凯撒','北京凯撒','上海凯撒']});
    euro.agreements = legacy.filter(a=>a.supplier===euro.name).map(a=>agreement(a.no,a.name,[body(a.company,'事件后付款',String(a.days),{event:a.event,owner:a.owner||'王芳'})],{service:a.service,start:a.start,end:a.end,status:a.status==='审批中'?'审批中':'已归档',effective:a.status==='审批中'?'待确认':'已确认',stamps:a.status==='审批中'?[]:[{file:file(a.name+'（双方盖章）.pdf'),date:'2026-06-18',uploader:'王芳'}]}));
    suppliers.push(euro);
    suppliers.push(make('SUP-GRP-0008','欧洲地接ABC',['境外地接','单项供应商'],[destinations[0],destinations[2]],{brand:'欧洲地接ABC',companies:['亿步','体坛','亿步山西分公司'],agreements:[agreement('AGR-ABC-2026-01','亿步与体坛年度地接协议',[body('亿步','月结',''),body('体坛','月结','')],{end:'2026-08-31'}),agreement('AGR-ABC-2026-02','山西分公司单团合作协议',[body('亿步山西分公司','事件后付款','3')])]}));
    suppliers.push(make('临202609170001','冰岛峡湾临时酒店',['单项供应商'],[destinations[7]],{brand:'冰岛峡湾临时酒店',temporary:true,status:'已退回',application:'APR-TMP-20260917-001',service:'单次团期住宿',reason:'原定酒店临时停业，替换本团住宿',business:'EU-ICE-20261001-01',useEnd:'2026-10-10',returnReason:'请补充收款账户证明及酒店经营许可。',documents:{business:file('酒店登记证明.pdf')},contact:'酒店前台',phone:'+354 0000 2601'}));
    suppliers.push(make('SUP-GRP-0009','北京光影会展服务有限公司',['综合类供应商'],[destinations[14]],{brand:'光影会展',status:'草稿',service:'会议摄影及会展执行',documents:{business:file('营业执照.pdf')}}));
    suppliers[0].accounts=[{id:'ACC-001',name:suppliers[0].name,bank:'中国银行北京朝阳支行',address:'北京市朝阳区',number:'62220000000000002601',swift:'',currencies:['CNY'],status:'财务已审核'}];
    euro.accounts=[{id:'ACC-007',name:'Europe United DMC',bank:'BNP Paribas',address:'Paris, France',number:'FR7600000000000000000000007',swift:'BNPAFRPP',currencies:['EUR','USD'],status:'财务已审核'}];
    suppliers.forEach(s=>{
      if(s.application) applications.push({no:s.application,supplier:s.id,matter:s.temporary?'临时供应商合作':'供应商准入',status:s.status,companies:s.companies,subject:s.name,date:'2026-09-17',external:'历史回执样例（未接真实系统）',reason:s.returnReason||''});
      s.agreements.forEach(a=>{if(a.application) applications.push({no:a.application,supplier:s.id,agreement:a.no,matter:'供应商合作与协议',status:a.status==='待归档'?'已通过':a.status,companies:a.bodies.map(b=>b.company),subject:a.name,date:a.application.replace(/^.*?(\d{4})(\d{2})(\d{2})-.*$/, '$1-$2-$3'),external:'历史回执样例（未接真实系统）',reason:a.reason});});
    });
    function find(id) { return suppliers.find(s=>s.id===id); }
    function duplicate(d, exclude) { return suppliers.find(s=>s.id!==exclude && (normalize(s.name)===normalize(d.name) || (d.registration && normalize(s.registration)===normalize(d.registration)))); }
    function visible(s, company) { return !company || s.companies.includes(company) || s.agreements.some(a=>a.bodies.some(b=>b.company===company)); }
    function filtered(f={}) { return suppliers.filter(s=>visible(s,f.company) && (!f.category||s.categories.includes(f.category)) && (!f.status||s.status===f.status) && ((!f.region&&!f.country&&!f.city)||s.places.some(p=>placeMatches(p,f))) && (!f.keyword||normalize([s.name,s.brand,s.english,s.owner,s.service,s.places.flat().join(' ')].join(' ')).includes(normalize(f.keyword)))); }
    function materials(s) { const travel=!s.temporary&&s.categories.some(c=>['境外地接','国内旅行社','出境批发商'].includes(c)); return [{key:'business',label:'营业执照／境外注册证明',required:!s.temporary},{key:'license',label:'经营许可证',required:travel,pending:!travel},{key:'insurance',label:'旅责险',required:false},{key:'quote',label:'报价单',required:!s.temporary&&s.categories.includes('综合类供应商')}].concat(s.temporary?[{key:'accountProof',label:'收款账户证明',required:false}]:[]); }
    function validateProfile(d, submit) {
      if(!d.name.trim()) return '请填写供应商全称。';
      if(!submit) return '';
      if(!d.categories.length) return '请选择供应商分类。';
      if(!d.companies.length) return '请选择本次申请公司。';
      if(!d.contact.trim()||!d.phone.trim()||!d.owner.trim()) return '请填写业务联系人、电话和我方负责人。';
      if(d.temporary&&d.useStart&&d.useEnd&&d.useEnd<d.useStart)return '合作结束日期不能早于开始日期。';
      if(d.temporary && (!d.reason.trim()||!d.business.trim())) return '请填写临时合作原因和本次团期／业务。';
      if(!d.temporary && (!d.service.trim()||!d.places.length)) return '请填写主要服务内容并添加服务地区。';
      if(!d.temporary){const invalid=d.places.map(validatePlace).find(Boolean);if(invalid)return invalid;}
      const missing=materials(d).find(m=>m.required&&!d.documents[m.key]);
      return missing?'请上传'+missing.label+'。':'';
    }
    function validateAgreement(a, submit) {
      if(!a.name.trim()) return '请填写协议名称。';
      if(!submit) return '';
      if(!a.start||!a.end||a.end<a.start) return '请填写正确的协议有效期，截止日不能早于开始日。';
      if(!a.service.trim()) return '请填写本次合作内容及地区。';
      if(!a.contract) return a.contractMode==='template'?'请预览协议并使用生成稿。':'请上传待审批合同。';
      if(a.contractMode==='template'&&(!a.templateId||!a.contract.generated||a.contract.templateId!==a.templateId))return '请使用当前所选模板重新生成协议。';
      if(a.contractMode==='upload'&&a.contract.generated)return '请上传已有协议。';
      if(!a.bodies.length) return '请至少添加一个我方签约主体。';
      if(new Set(a.bodies.map(b=>b.company)).size!==a.bodies.length) return '同一份协议的签约主体不能重复。';
      for(const b of a.bodies) {
        if(!b.company||!b.owner.trim()) return '请填写每个签约主体及我方负责人。';
        if(b.kind==='事件后付款' && (b.days===''||!Number.isInteger(Number(b.days))||Number(b.days)<0)) return '账期天数须为0或正整数。';
        if(!b.currency.length) return '请选择每个签约主体的结算币种。';
        if(b.kind==='其他约定'&&!b.otherRule.trim()) return '请填写其他账期约定。';
      }
      return '';
    }
    function saveProfile(d, submit, id) {
      const old=id&&find(id);
      if(id&&!old) throw Error('供应商不存在。');
      if(old&&['审批中','已停用'].includes(old.status)) throw Error('当前状态不可编辑档案。');
      if(!d.temporary)d.regions=[...new Set(d.places.map(p=>p[0]))];
      const dup=duplicate(d,id); if(dup) return {duplicate:dup};
      const error=validateProfile(d,submit); if(error) throw Error(error);
      if(submit&&!d.temporary&&(!old||old.status!=='已准入')){if(!d.initialAgreement)throw Error('请填写首份合作协议。');if(root.SupplierContractTools&&!root.SupplierContractTools.current(d.initialAgreement.contract,d,d.initialAgreement))throw Error('协议资料已变化，请重新生成合同或上传核对后的合同。');const aError=validateAgreement(d.initialAgreement,true);if(aError)throw Error(aError);}
      if(old&&old.status==='已准入') {
        if(profileChanges[id]&&profileChanges[id].status==='待发送致远')throw Error('本次变更已建立送审申请，请先撤回送审申请再修改。');
        profileChanges[id]={data:copy(d),status:submit?'待发送致远':'草稿'};
        if(submit){const no=next('APR-CHG-');profileChanges[id].application=no;applications.unshift({no,supplier:id,matter:'供应商资料变更',status:'待发送致远',companies:copy(old.companies),subject:old.name,date:today,external:'未发送',reason:'',proposed:copy(d)});}
        return {supplier:old,proposed:true};
      }
      const saved=copy(d); saved.id=id||next(d.temporary?'临':'SUP-'); saved.agreements=old?old.agreements:[]; saved.accounts=old?old.accounts:[];
      saved.status=old&&old.status==='已准入'?'已准入':submit?'审批中':'草稿';
      if(submit&&saved.status==='审批中') {
        saved.application=next(d.temporary?'APR-TMP-':'APR-SUP-');
        applications.unshift({no:saved.application,supplier:saved.id,matter:saved.temporary?'临时供应商合作':'供应商准入',status:'审批中',companies:saved.companies,subject:saved.name,date:today,external:'未发送',reason:''});
      }
      if(saved.initialAgreement&&(!old||old.status!=='已准入')&&(submit||saved.initialAgreement.name.trim()||saved.initialAgreement.contract)){const first=saved.initialAgreement;first.no=(old&&old.initialAgreement&&old.initialAgreement.no)||next('AGR-');first.status=submit?'审批中':'草稿';first.effective='待确认';first.stamps=[];first.history=[];first.application=saved.application||'';first.reason='';saved.agreements=saved.agreements.filter(a=>a.no!==first.no);saved.agreements.unshift(copy(first));const app=applications.find(a=>a.no===saved.application);if(app){app.agreement=first.no;app.subject=saved.name+' / '+first.name;}}
      if(old) suppliers.splice(suppliers.indexOf(old),1,saved); else suppliers.unshift(saved);
      return {supplier:saved};
    }
    function saveAgreement(id,d,submit,no) {
      const s=find(id); if(!s||s.status!=='已准入') throw Error('请先完成供应商准入。');
      const old=no&&s.agreements.find(a=>a.no===no);
      if(old&&!['草稿','已退回','已撤回'].includes(old.status)) throw Error('当前协议不可直接改写。');
      if(submit&&root.SupplierContractTools&&!root.SupplierContractTools.current(d.contract,s,d))throw Error('协议资料已变化，请重新生成合同或上传核对后的合同。');
      const error=validateAgreement(d,submit); if(error) throw Error(error);
      const a=copy(d); a.no=no||next('AGR-');a.status=submit?'审批中':'草稿';a.effective='待确认';a.stamps=old?old.stamps:[];a.history=old?old.history:[];a.reason='';
      if(submit){a.application=next('APR-AGR-');applications.unshift({no:a.application,supplier:id,agreement:a.no,matter:'供应商合作与协议',status:'审批中',companies:a.bodies.map(b=>b.company),subject:a.name,date:today,external:'未发送',reason:''});}
      if(old)s.agreements.splice(s.agreements.indexOf(old),1,a);else s.agreements.unshift(a);
      return a;
    }
    function withdraw(id,no) {
      const s=find(id),a=s&&s.agreements.find(x=>x.no===no); if(!a||a.status!=='审批中')throw Error('当前协议不可撤回。');
      a.status='已撤回';const app=applications.find(x=>x.no===a.application);if(app)app.status='已撤回';
    }
    function archive(id,no,upload,confirmed,bodies) {
      const s=find(id),a=s&&s.agreements.find(x=>x.no===no);
      if(!a||a.status!=='待归档')throw Error('只有已批准、待归档的协议可归档。');
      if(!upload||!confirmed)throw Error('请上传双方盖章件并确认双方已盖章。');
      if(bodies.some(b=>!b.contact.trim()||!b.phone.trim()))throw Error('请补充各签约主体的供应商业务联系人及电话。');
      if(bodies.length!==a.bodies.length||bodies.some((b,i)=>b.company!==a.bodies[i].company))throw Error('归档签约主体与批准协议不一致。');
      if(bodies.some(b=>!String(b.archiveTerm||'').trim()||!String(b.archiveFee||'').trim()))throw Error('请录入各签约主体的账期和平台费，无平台费请填写无。');
      a.archiveEntries=bodies.map((b,i)=>({company:b.company,contact:b.contact,phone:b.phone,term:b.archiveTerm.trim(),fee:b.archiveFee.trim(),date:today,review:b.archiveTerm.trim()===term(a.bodies[i])&&b.archiveFee.trim()===a.bodies[i].fee.trim()?'与批准条款一致':'与批准条款有差异，待核对'}));
      a.bodies.forEach((b,i)=>{b.contact=bodies[i].contact;b.phone=bodies[i].phone;});
      a.stamps.push({file:copy(upload),date:today,uploader:'王珊'});a.status='已归档'; // 归档不替代生效确认。
    }
    function usage(a, date=today) { if(a.status!=='已归档')return '协议未归档，不可新使用'; if(a.end&&a.end<date)return '已到期，不可新使用'; if(a.start>date)return '未到开始日'; if(a.effective!=='已确认')return '生效条件待确认'; return '可新使用'; }
    return {suppliers,applications,profileChanges,today,next,find,duplicate,visible,filtered,materials,validateProfile,validateAgreement,saveProfile,saveAgreement,withdraw,archive,usage};
  }
  root.SupplierManagementData={categories,regions,groupTypes,companies,destinations,copy,placeLabel,cooperationText,validatePlace,addPlace,placeMatches,body,term,createSession};
})(typeof window==='undefined'?globalThis:window);
