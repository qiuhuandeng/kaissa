const assert = require('node:assert/strict');
require('../shared/product-supplier-contacts.js');
const C = global.ProductSupplierContacts;
let passed = 0;
function check(name, fn) { fn(); passed++; console.log('通过：' + name); }
const fj = C.context(''), bj = C.context('?company=北京凯撒'), sh = C.context('?company=上海凯撒');
check('默认公司及已知公司',()=>{assert.equal(fj.company,'福建凯撒');assert(C.visible('欧洲联合地接社',fj));});
check('未签约与未知公司不返回供应商',()=>{for(const company of ['亿步','不存在','']) assert.equal(C.visible('欧洲联合地接社',C.context('?company='+company)),false);});
check('准确名称查找，不按相似名合并',()=>{for(const name of ['未知供应商','地中海邮轮','MSC Cruises S.A.','北京凯撒']) assert.equal(C.contact(name,fj),null);});
check('同一供应商返回对应公司联系人',()=>{assert.equal(C.contact('北京国旅地接部',fj).contact,'周宁');assert.equal(C.contact('北京国旅地接部',bj).contact,'赵琳');assert.equal(C.contact('樱花旅游地接',sh).contact,'杨悦');});
check('无联系人权限仍可查看授权产品',()=>{const c=C.context('?contactAccess=none');assert(C.visible('欧洲联合地接社',c));assert.equal(C.contact('欧洲联合地接社',c),null);});
check('未知联系人权限拒绝展示',()=>{assert.equal(C.contact('欧洲联合地接社',C.context('?contactAccess=invalid')),null);});
check('未获公司授权即使有联系人权限也不能查看',()=>{assert.equal(C.contact('巴厘岛阳光地接',fj),null);assert(C.contact('巴厘岛阳光地接',bj));});
check('只读资料严格限定四个字段',()=>{assert.deepEqual(Object.keys(C.contact('欧洲联合地接社',fj)).sort(),['supplier','company','contact','phone'].sort());});
check('返回副本不会改写其他查询',()=>{const data=C.contact('欧洲联合地接社',fj);data.company='北京凯撒';assert.equal(C.contact('欧洲联合地接社',fj).company,'福建凯撒');});
check('内部提供公司不冒充外部供应商',()=>{assert(C.visible('北京凯撒',fj,'internal'));assert.equal(C.visible('北京凯撒',sh,'internal'),false);assert.equal(C.contact('北京凯撒',fj),null);});
check('详情链接保留公司、联系人权限和产品编号',()=>{const u=new URL(C.href('product-outsource-detail.html?type=cruise&source=OUT-CR-0006'),'https://test.invalid');assert.equal(u.searchParams.get('source'),'OUT-CR-0006');assert.equal(u.searchParams.get('company'),'福建凯撒');assert.equal(u.searchParams.get('contactAccess'),'allowed');});
console.log(`${passed} 组通过`);
