/* 从集团演示档案生成业务端字段白名单；不输出合同文件、账户、审批或内部备注。 */
const fs=require('fs'),vm=require('vm');const context={};vm.createContext(context);
for(const name of ['supplier-company-agreements','supplier-management-data'])vm.runInContext(fs.readFileSync('shared/'+name+'.js','utf8'),context);
const d=context.SupplierManagementData,s=d.createSession(context.SupplierCompanyAgreements.records);
const rows=s.suppliers.filter(x=>['已准入','已停用'].includes(x.status)).map(x=>({id:x.id,name:x.name,brand:x.brand,english:x.english,registration:x.registration,registered:x.registered,address:x.address,legal:x.legal,manager:x.manager,contact:x.contact,phone:x.phone,wechat:x.wechat,email:x.email,regions:x.regions,groups:x.groups,categories:x.categories,service:x.service,places:x.places,status:x.status,agreements:x.agreements.filter(a=>a.status==='已归档').map(a=>({no:a.no,name:a.name,status:a.status,start:a.start,end:a.end,effective:a.effective,service:a.service,bodies:a.bodies.map(b=>({company:b.company,contact:b.contact,phone:b.phone,owner:b.owner,term:d.term(b),currency:b.currency}))}))})).filter(x=>x.agreements.length);
const output='/* 业务端只读演示资料。由 scripts/build-supplier-company-view.cjs 生成；正式环境须由服务端按登录公司返回。 */\n(function(root){root.SupplierCompanyView='+JSON.stringify(rows,null,2)+';})(typeof window==="undefined"?globalThis:window);\n';
fs.writeFileSync('shared/supplier-company-view.js',output);
