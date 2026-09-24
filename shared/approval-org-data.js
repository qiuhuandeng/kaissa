/* Shared organization examples for approval configuration; session-only prototype. */
(function(root){
'use strict';
const KEY='caesar-approval-organization-v1';
const seed={
  "schema": 1,
  "people": [
    {
      "id": "zhou",
      "name": "周伟",
      "companies": [
        "fj"
      ],
      "active": true
    },
    {
      "id": "liu",
      "name": "刘洋",
      "companies": [
        "fj"
      ],
      "active": true
    },
    {
      "id": "sun",
      "name": "孙丽",
      "companies": [
        "fj"
      ],
      "active": true
    },
    {
      "id": "chenhong",
      "name": "陈红",
      "companies": [
        "fj"
      ],
      "active": true
    },
    {
      "id": "wangjie",
      "name": "王洁",
      "companies": [
        "fj",
        "bj"
      ],
      "active": true
    },
    {
      "id": "limin",
      "name": "李敏",
      "companies": [
        "fj",
        "bj"
      ],
      "active": true
    },
    {
      "id": "chentao",
      "name": "陈涛",
      "companies": [
        "fj"
      ],
      "active": true
    },
    {
      "id": "wufang",
      "name": "吴芳",
      "companies": [
        "bj"
      ],
      "active": true
    },
    {
      "id": "zheng",
      "name": "郑华",
      "companies": [
        "bj"
      ],
      "active": true
    },
    {
      "id": "zhoumin",
      "name": "周敏",
      "companies": [
        "bj"
      ],
      "active": true
    },
    {
      "id": "chenxiao",
      "name": "陈晓",
      "companies": [
        "bj"
      ],
      "active": true
    },
    {
      "id": "fj-person-11",
      "name": "郑华",
      "companies": [
        "fj"
      ],
      "active": true
    },
    {
      "id": "fj-person-12",
      "name": "陈刚",
      "companies": [
        "fj"
      ],
      "active": true
    },
    {
      "id": "fj-person-13",
      "name": "李梅",
      "companies": [
        "fj"
      ],
      "active": true
    },
    {
      "id": "fj-person-14",
      "name": "吴芳",
      "companies": [
        "fj"
      ],
      "active": true
    },
    {
      "id": "fj-person-15",
      "name": "陈琳",
      "companies": [
        "fj"
      ],
      "active": true
    },
    {
      "id": "fj-person-16",
      "name": "赵明",
      "companies": [
        "fj"
      ],
      "active": true
    },
    {
      "id": "fj-person-17",
      "name": "黄敏",
      "companies": [
        "fj"
      ],
      "active": true
    }
  ],
  "departments": [
    {
      "id": "fj-center",
      "company": "fj",
      "name": "长线中心",
      "parent": "",
      "active": true,
      "owners": [
        {
          "person": "fj-person-15",
          "start": "2020-01-01",
          "end": ""
        }
      ]
    },
    {
      "id": "fj-europe",
      "company": "fj",
      "name": "欧洲部",
      "parent": "fj-center",
      "active": true,
      "owners": [
        {
          "person": "zhou",
          "start": "2020-01-01",
          "end": ""
        }
      ]
    },
    {
      "id": "fj-xiamen",
      "company": "fj",
      "name": "厦门分公司",
      "parent": "",
      "active": true,
      "owners": [
        {
          "person": "liu",
          "start": "2020-01-01",
          "end": ""
        }
      ]
    },
    {
      "id": "fj-store",
      "company": "fj",
      "name": "软件园门店",
      "parent": "fj-org-1",
      "active": true,
      "owners": [
        {
          "person": "sun",
          "start": "2020-01-01",
          "end": ""
        }
      ]
    },
    {
      "id": "bj-sales",
      "company": "bj",
      "name": "销售中心",
      "parent": "",
      "active": true,
      "owners": [
        {
          "person": "zheng",
          "start": "2020-01-01",
          "end": ""
        }
      ]
    },
    {
      "id": "bj-team",
      "company": "bj",
      "name": "销售一部",
      "parent": "bj-sales",
      "active": true,
      "owners": [
        {
          "person": "zhoumin",
          "start": "2020-01-01",
          "end": ""
        }
      ]
    },
    {
      "id": "fj-org-1",
      "company": "fj",
      "name": "厦门思明区门市部",
      "parent": "fj-xiamen",
      "active": true,
      "owners": [
        {
          "person": "sun",
          "start": "2020-01-01",
          "end": ""
        }
      ]
    },
    {
      "id": "fj-org-3",
      "company": "fj",
      "name": "文灶门店",
      "parent": "fj-org-1",
      "active": true,
      "owners": [
        {
          "person": "fj-person-11",
          "start": "2020-01-01",
          "end": ""
        }
      ]
    },
    {
      "id": "fj-org-4",
      "company": "fj",
      "name": "观音山门店",
      "parent": "fj-org-1",
      "active": true,
      "owners": [
        {
          "person": "chenhong",
          "start": "2020-01-01",
          "end": ""
        }
      ]
    },
    {
      "id": "fj-org-5",
      "company": "fj",
      "name": "泉州分公司",
      "parent": "",
      "active": true,
      "owners": [
        {
          "person": "fj-person-12",
          "start": "2020-01-01",
          "end": ""
        }
      ]
    },
    {
      "id": "fj-org-6",
      "company": "fj",
      "name": "泉州丰泽门市部",
      "parent": "fj-org-5",
      "active": true,
      "owners": [
        {
          "person": "fj-person-12",
          "start": "2020-01-01",
          "end": ""
        }
      ]
    },
    {
      "id": "fj-org-7",
      "company": "fj",
      "name": "泉州丰泽门店",
      "parent": "fj-org-6",
      "active": true,
      "owners": [
        {
          "person": "fj-person-13",
          "start": "2020-01-01",
          "end": ""
        }
      ]
    },
    {
      "id": "fj-org-8",
      "company": "fj",
      "name": "泉州鲤城门店",
      "parent": "fj-org-6",
      "active": true,
      "owners": [
        {
          "person": "fj-person-14",
          "start": "2020-01-01",
          "end": ""
        }
      ]
    },
    {
      "id": "fj-org-9",
      "company": "fj",
      "name": "泉州东海门店",
      "parent": "fj-org-6",
      "active": true,
      "owners": [
        {
          "person": "zhou",
          "start": "2020-01-01",
          "end": ""
        }
      ]
    },
    {
      "id": "fj-org-10",
      "company": "fj",
      "name": "福州分公司",
      "parent": "",
      "active": false,
      "owners": []
    },
    {
      "id": "fj-org-11",
      "company": "fj",
      "name": "漳州分公司",
      "parent": "",
      "active": false,
      "owners": []
    },
    {
      "id": "fj-org-12",
      "company": "fj",
      "name": "产品中心",
      "parent": "",
      "active": false,
      "owners": []
    },
    {
      "id": "fj-org-15",
      "company": "fj",
      "name": "澳洲部",
      "parent": "fj-center",
      "active": true,
      "owners": [
        {
          "person": "fj-person-14",
          "start": "2020-01-01",
          "end": ""
        }
      ]
    },
    {
      "id": "fj-org-16",
      "company": "fj",
      "name": "美洲部",
      "parent": "fj-center",
      "active": true,
      "owners": [
        {
          "person": "fj-person-16",
          "start": "2020-01-01",
          "end": ""
        }
      ]
    },
    {
      "id": "fj-org-17",
      "company": "fj",
      "name": "短线中心 / 销售中心",
      "parent": "",
      "active": true,
      "owners": [
        {
          "person": "fj-person-17",
          "start": "2020-01-01",
          "end": ""
        }
      ]
    }
  ],
  "appointments": [
    {
      "id": "fj-job-zhou",
      "person": "zhou",
      "company": "fj",
      "department": "fj-europe",
      "primary": true,
      "start": "2020-01-01",
      "end": "",
      "manager": "fj-job-fj-person-15"
    },
    {
      "id": "fj-job-liu",
      "person": "liu",
      "company": "fj",
      "department": "fj-xiamen",
      "primary": true,
      "start": "2020-01-01",
      "end": "",
      "manager": "fj-job-chentao"
    },
    {
      "id": "fj-job-sun",
      "person": "sun",
      "company": "fj",
      "department": "fj-store",
      "primary": true,
      "start": "2020-01-01",
      "end": "",
      "manager": "fj-job-liu"
    },
    {
      "id": "fj-job-chenhong",
      "person": "chenhong",
      "company": "fj",
      "department": "fj-org-4",
      "primary": true,
      "start": "2020-01-01",
      "end": "",
      "manager": "fj-job-sun"
    },
    {
      "id": "fj-job-wangjie",
      "person": "wangjie",
      "company": "fj",
      "department": "fj-europe",
      "primary": true,
      "start": "2020-01-01",
      "end": "",
      "manager": ""
    },
    {
      "id": "bj-job-wangjie",
      "person": "wangjie",
      "company": "bj",
      "department": "bj-team",
      "primary": true,
      "start": "2020-01-01",
      "end": "",
      "manager": ""
    },
    {
      "id": "fj-job-limin",
      "person": "limin",
      "company": "fj",
      "department": "fj-europe",
      "primary": true,
      "start": "2020-01-01",
      "end": "",
      "manager": ""
    },
    {
      "id": "bj-job-limin",
      "person": "limin",
      "company": "bj",
      "department": "bj-team",
      "primary": true,
      "start": "2020-01-01",
      "end": "",
      "manager": ""
    },
    {
      "id": "fj-job-chentao",
      "person": "chentao",
      "company": "fj",
      "department": "fj-europe",
      "primary": true,
      "start": "2020-01-01",
      "end": "",
      "manager": ""
    },
    {
      "id": "bj-job-wufang",
      "person": "wufang",
      "company": "bj",
      "department": "bj-team",
      "primary": true,
      "start": "2020-01-01",
      "end": "",
      "manager": ""
    },
    {
      "id": "bj-job-zheng",
      "person": "zheng",
      "company": "bj",
      "department": "bj-sales",
      "primary": true,
      "start": "2020-01-01",
      "end": "",
      "manager": ""
    },
    {
      "id": "bj-job-zhoumin",
      "person": "zhoumin",
      "company": "bj",
      "department": "bj-team",
      "primary": true,
      "start": "2020-01-01",
      "end": "",
      "manager": "bj-job-zheng"
    },
    {
      "id": "bj-job-chenxiao",
      "person": "chenxiao",
      "company": "bj",
      "department": "bj-team",
      "primary": true,
      "start": "2020-01-01",
      "end": "",
      "manager": "bj-job-zhoumin"
    },
    {
      "id": "fj-job-fj-person-11",
      "person": "fj-person-11",
      "company": "fj",
      "department": "fj-org-3",
      "primary": true,
      "start": "2020-01-01",
      "end": "",
      "manager": ""
    },
    {
      "id": "fj-job-fj-person-12",
      "person": "fj-person-12",
      "company": "fj",
      "department": "fj-org-5",
      "primary": true,
      "start": "2020-01-01",
      "end": "",
      "manager": ""
    },
    {
      "id": "fj-job-fj-person-13",
      "person": "fj-person-13",
      "company": "fj",
      "department": "fj-org-7",
      "primary": true,
      "start": "2020-01-01",
      "end": "",
      "manager": ""
    },
    {
      "id": "fj-job-fj-person-14",
      "person": "fj-person-14",
      "company": "fj",
      "department": "fj-org-15",
      "primary": true,
      "start": "2020-01-01",
      "end": "",
      "manager": ""
    },
    {
      "id": "fj-job-fj-person-15",
      "person": "fj-person-15",
      "company": "fj",
      "department": "fj-center",
      "primary": true,
      "start": "2020-01-01",
      "end": "",
      "manager": "fj-job-chentao"
    },
    {
      "id": "fj-job-fj-person-16",
      "person": "fj-person-16",
      "company": "fj",
      "department": "fj-org-16",
      "primary": true,
      "start": "2020-01-01",
      "end": "",
      "manager": ""
    },
    {
      "id": "fj-job-fj-person-17",
      "person": "fj-person-17",
      "company": "fj",
      "department": "fj-org-17",
      "primary": true,
      "start": "2020-01-01",
      "end": "",
      "manager": ""
    }
  ],
  "requests": []
};
const clone=v=>JSON.parse(JSON.stringify(v));
const dateOK=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const companies=[{id:'fj',name:'福建凯撒国际旅行社有限公司',short:'福建凯撒'},{id:'bj',name:'北京凯撒国际旅行社有限公司',short:'北京凯撒'}];
function atDate(a,date){return {...a,...(a.revisions||[]).filter(r=>r.effectiveFrom<=date).sort((x,y)=>x.effectiveFrom.localeCompare(y.effectiveFrom)).at(-1)};}
const effective=(a,date)=>{const v=atDate(a,date);return v.start<=date&&(!v.end||v.end>=date);};
const appointmentsAt=(org,date=today())=>org.appointments.map(a=>atDate(a,date));
function departmentAt(d,date=today()){const base=d.initial||d,v={...base,...(d.revisions||[]).filter(r=>r.effectiveFrom<=date).sort((a,b)=>a.effectiveFrom.localeCompare(b.effectiveFrom)).at(-1)};return {...d,...v,active:v.active!==false&&(!v.start||v.start<=date)};}
const departmentsAt=(org,date=today())=>org.departments.map(d=>departmentAt(d,date));
function orgType(d){return d.type||(/门店/.test(d.name)?'store':/门市部/.test(d.name)?'storeDepartment':/分公司/.test(d.name)?'branch':/中心/.test(d.name)?'center':'department');}

function normalize(org){org.departments=departmentsAt(org).map(d=>({...d,type:orgType(d)}));org.changes=org.changes||[];org.requests=org.requests||[];org.people.forEach((p,i)=>{p.code=p.code||'KS'+String(1001+i).padStart(6,'0');p.phone=p.phone||'';p.backendRoles=p.backendRoles||[];p.businessRoles=p.businessRoles||({sun:['门店店长'],zhou:['产品经理'],chenhong:['门店店员'],liu:['中心管理员']}[p.id]||[]);});return org;}
function departmentPath(org,id){const names=[],seen=new Set();let d=org.departments.find(x=>x.id===id);while(d&&!seen.has(d.id)){seen.add(d.id);names.unshift(d.name);d=org.departments.find(x=>x.id===d.parent);}return names.join(' / ');}
function currentPerson(org,id,company,date=today()){org={...org,departments:departmentsAt(org,date)};const p=org.people.find(x=>x.id===id);return !!(p?.active&&p.companies.includes(company)&&jobs(org,id,company,date).some(a=>org.departments.some(d=>d.id===a.department&&d.active)));}

function read(){try{const v=JSON.parse(root.sessionStorage?.getItem(KEY)||'null');if(v?.schema===1&&Array.isArray(v.departments)&&Array.isArray(v.appointments)&&Array.isArray(v.people))return normalize(v);}catch(_){}return normalize(clone(seed));}
function save(v){try{root.sessionStorage.setItem(KEY,JSON.stringify(v));return [];}catch(_){return ['浏览器无法保存本次组织资料，请保留页面后重试'];}}
function owners(org,d,date=today()){return (d?.owners||[]).filter(o=>effective(o,date)).map(o=>o.person);}
function jobs(org,person,company,date){return appointmentsAt(org,date).filter(a=>a.person===person&&a.company===company&&effective(a,date));}
function appointment(org,c){const matches=jobs(org,c.applicant,c.company,c.date);return c.appointment?matches.find(a=>a.id===c.appointment):matches.length===1?matches[0]:null;}
function configErrors(n){const h=n.hierarchy;if(!h)return n.source==='manager'?['请配置上级层级']:[];const errors=[];if(!['single','continuous'].includes(h.mode)||!['bottom','top'].includes(h.origin)||!Number.isInteger(Number(h.level))||Number(h.level)<1||Number(h.level)>10)errors.push('请设置有效的审批层级（1—10级）');if(!['business','applicant'].includes(h.base)||!['block','parent'].includes(h.empty)||!['any','all'].includes(h.within))errors.push('请重新设置部门取人规则');return errors;}
function levels(org,n,c){
 org={...org,departments:departmentsAt(org,c.date)};
 const errors=configErrors(n),layers=[],h=n.hierarchy||{mode:'single',origin:'bottom',level:1,base:'applicant',empty:'block',within:'all'};
 if(errors.length)return {errors,layers};
 const job=appointment(org,c);let chain=[];
 if(n.source==='manager'){
  if(!job)return {layers,errors:['请选择申请人在本公司的有效任职；兼任时需明确本次申请身份']};
  let a=job;const seen=new Set([a.id]),persons=new Set([a.person]);
  while(a.manager){const parent=appointmentsAt(org,c.date).find(x=>x.id===a.manager);if(!parent||parent.company!==c.company||!effective(parent,c.date)){errors.push('上级任职失效或超出本公司，请维护直属上级');break;}if(seen.has(parent.id)||persons.has(parent.person)){errors.push('直属上级存在循环或本人，请调整汇报关系');break;}seen.add(parent.id);persons.add(parent.person);chain.push({key:parent.id,name:'第'+(chain.length+1)+'级上级',members:[parent.person]});a=parent;}
 }else{
  if(h.base==='applicant'&&!job)return {layers,errors:['请选择申请人在本公司的有效任职']};
  let id=h.base==='applicant'?job.department:c.department;const seen=new Set();
  while(id){const d=org.departments.find(x=>x.id===id);if(!d||d.company!==c.company||d.active===false){errors.push('部门失效或超出本公司，请维护组织归属');break;}if(seen.has(id)){errors.push('部门层级存在循环，请调整组织架构');break;}seen.add(id);chain.push({key:d.id,name:d.name,members:owners(org,d,c.date)});id=d.parent;}
 }
 if(errors.length)return {layers,errors};
 const index=h.origin==='top'?chain.length-Number(h.level):Number(h.level)-1;
 if(index<0||index>=chain.length)return {layers,errors:['当前组织关系不足所选层级，暂停并交审批管理员处理']};
 const selected=h.mode==='continuous'?chain.slice(0,index+1):[chain[index]];
 for(const entry of selected){let resolved=entry;
  if(!entry.members.length&&n.source!=='manager'&&h.empty==='parent')resolved=chain.slice(chain.indexOf(entry)+1).find(x=>x.members.length)||entry;
  if(!resolved.members.length){errors.push(entry.name+'未配置有效负责人，暂停并交审批管理员处理');continue;}
  layers.push({...entry,members:resolved.members,notice:resolved!==entry?entry.name+'无负责人，由'+resolved.name+'负责人审批':''});
 }
 return {layers,errors};
}
function checkAppointmentGraph(org,from){
 const errors=[],dates=new Set([from]);
 [...org.appointments,...org.departments].forEach(a=>[a,...(a.revisions||[])].forEach(v=>{if(v.start)dates.add(v.start);if(v.effectiveFrom)dates.add(v.effectiveFrom);if(v.end&&dateOK(v.end))dates.add(new Date(Date.parse(v.end)+86400000).toISOString().slice(0,10));}));
 for(const date of [...dates].filter(d=>d>=from)){
  const active=appointmentsAt(org,date).filter(a=>effective(a,date));
  const departments=departmentsAt(org,date);
  for(const a of active){
   if(!departments.some(d=>d.id===a.department&&d.company===a.company&&d.active))errors.push('任职期间部门存在未启用或计划停用安排');
   const peers=active.filter(b=>b.id!==a.id&&b.person===a.person&&b.company===a.company);
   if(peers.some(b=>b.department===a.department))errors.push('同一部门存在重叠任职，请编辑原任职');
   if(a.primary&&peers.some(b=>b.primary))errors.push('同一公司同一期间只能有一个主任职，请先调整原主任职');
   let current=a;const seen=new Set([a.id]),persons=new Set([a.person]);
   while(current.manager){const m=active.find(x=>x.id===current.manager);if(!m||m.company!==a.company){errors.push('直属上级的公司或有效期不能承接该任职');break;}if(seen.has(m.id)||persons.has(m.person)){errors.push('不能选择本人或形成循环汇报关系的上级');break;}seen.add(m.id);persons.add(m.person);current=m;}
  }
 }
 return [...new Set(errors)];
}
function validateAppointment(org,value,from=value.start){
 const errors=[],p=org.people.find(p=>p.id===value.person),d=departmentsAt(org,from).find(d=>d.id===value.department);
 if(!p?.active||!p.companies.includes(value.company)||!d?.active||d.company!==value.company)errors.push('员工及任职部门须属于当前公司且有效');
 if(!dateOK(value.start)||(value.end&&(!dateOK(value.end)||value.end<value.start)))errors.push('请填写有效的任职日期范围');
 if(typeof value.primary!=='boolean')errors.push('请选择主任职或兼任');
 if(value.manager){const m=org.appointments.find(a=>a.id===value.manager),mp=org.people.find(p=>p.id===m?.person);if(!mp?.active)errors.push('直属上级账号未启用');}
 if(errors.length)return errors;
 const next=clone(org),i=next.appointments.findIndex(a=>a.id===value.id);if(i<0)next.appointments.push(value);else next.appointments[i]=value;
 return checkAppointmentGraph(next,from);
}
function saveAppointment(org,value,effectiveFrom,reason){
 const base=org.appointments.find(a=>a.id===value.id),errors=[];
 if(!dateOK(effectiveFrom)||effectiveFrom<today())errors.push('变更生效日期不得早于今天');
 if(!reason?.trim())errors.push('请填写调整原因');
 if(value.end&&value.end<effectiveFrom)errors.push('任职结束日期不能早于本次生效日期');
 if(base&&(base.person!==value.person||base.company!==value.company))errors.push('不能更换原任职的员工或公司，请新增任职');
 if(base&&(base.revisions||[]).some(r=>r.effectiveFrom>effectiveFrom))errors.push('已有之后的任职安排，请先核对待生效记录');
 if(errors.length)return errors;
 const projected={...value,start:base?.start||effectiveFrom};delete projected.revisions;
 const trial=clone(org),i=trial.appointments.findIndex(a=>a.id===value.id);
 if(i<0)trial.appointments.push(projected);else trial.appointments[i]={...trial.appointments[i],revisions:[...(trial.appointments[i].revisions||[]),{...projected,effectiveFrom}]};
 const at=appointmentsAt(trial,effectiveFrom);const valid=validateAppointment({...trial,appointments:at},at.find(a=>a.id===value.id),effectiveFrom);
 if(valid.length)return valid;
 const future=checkAppointmentGraph(trial,effectiveFrom);if(future.length)return future;
 org.appointments=trial.appointments;org.changes=org.changes||[];org.changes.unshift({id:'change-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),kind:'appointment',person:value.person,company:value.company,department:value.department,job:value.id,effectiveFrom,reason:reason.trim(),before:base?atDate(base,effectiveFrom):null,after:projected,at:today()});return [];
}
function savePerson(org,value){
 const errors=[],old=org.people.find(p=>p.id===value.id);
 if(!value.name?.trim())errors.push('请填写员工姓名');
 if(!value.code?.trim()||org.people.some(p=>p.id!==value.id&&p.code===value.code.trim()))errors.push('请填写不重复的工号');
 if(value.phone&&value.phone!==old?.phone&&!/^1\d{10}$/.test(value.phone))errors.push('手机号请填写11位数字');
 if(value.phone&&org.people.some(p=>p.id!==value.id&&p.phone===value.phone))errors.push('手机号已用于其他员工账号');
 if(!value.companies?.length||value.companies.some(id=>!companies.some(c=>c.id===id)))errors.push('请至少选择一家可任职公司');
 if(old&&org.appointments.some(a=>a.person===old.id&&!value.companies.includes(a.company)&&(!a.end||a.end>=today())))errors.push('该公司仍有任职记录，请先处理任职再移除公司');
 if(errors.length)return errors;
 const record={...old,...clone(value),name:value.name.trim(),code:value.code.trim()};const i=org.people.findIndex(p=>p.id===value.id);if(i<0)org.people.push(record);else org.people[i]=record;return [];
}
function personImpact(org,id){return {jobs:appointmentsAt(org).filter(a=>a.person===id&&effective(a,today())),owners:org.departments.filter(d=>owners(org,d).includes(id)),reports:appointmentsAt(org).filter(a=>effective(a,today())&&org.appointments.some(m=>m.id===a.manager&&m.person===id))};}
function validateOwners(org,department,values){const d=org.departments.find(d=>d.id===department),errors=[];if(!d?.active)errors.push('请选择有效组织');if(!values.length)errors.push('请至少选择一位负责人');values.forEach(o=>{const p=org.people.find(p=>p.id===o.person);if(!currentPerson(org,o.person,d?.company,o.start))errors.push('负责人须在本公司有效任职');if(!dateOK(o.start)||(o.end&&(!dateOK(o.end)||o.end<o.start)))errors.push('请填写有效的负责人任期');});if(new Set(values.map(o=>o.person)).size!==values.length)errors.push('请勿重复选择负责人');return [...new Set(errors)];}
function applyOwners(org,id,values){const d=org.departments.find(d=>d.id===id);const errors=validateOwners(org,id,values);if(errors.length)return errors;const start=values[0].start;if(values.some(v=>v.start!==start))return ['本次设置的负责人须使用相同生效日期'];const end=new Date(Date.parse(start)-86400000).toISOString().slice(0,10);d.owners=[...(d.owners||[]).filter(o=>o.start<start).map(o=>({...o,end:!o.end||o.end>=start?end:o.end})),...clone(values)];return [];}
function hydrate(nodes,company='fj'){const org=read();nodes.forEach(n=>{const nodeCompany=n.company||company;n.company=nodeCompany;const d=org.departments.find(d=>d.company===nodeCompany&&d.name===n.name);if(d){n.id=d.id;n.owner=owners(org,d).map(id=>org.people.find(p=>p.id===id)?.name||id).join('、')||'待配置';}if(n.children)hydrate(n.children,nodeCompany);});return nodes;}
const api={normalize,departmentAt,departmentsAt,orgType,checkAppointmentGraph,companies,atDate,appointmentsAt,departmentPath,currentPerson,saveAppointment,savePerson,personImpact,KEY,seed,clone,today,dateOK,effective,read,save,owners,jobs,appointment,configErrors,levels,validateAppointment,validateOwners,applyOwners,hydrate};
if(typeof module==='object'&&module.exports)module.exports=api;else root.ApprovalOrgData=api;
})(typeof window==='object'?window:globalThis);
