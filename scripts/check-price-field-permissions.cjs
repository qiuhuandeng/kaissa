const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const values = new Map();
const context = { module: { exports: {} }, localStorage: { getItem: k => values.get(k) || null, setItem: (k,v) => values.set(k,v) }, Date, Event };
vm.runInNewContext(fs.readFileSync('shared/price-field-permissions.js','utf8'), context);
const P = context.module.exports, target = {company:'fj',org:'store-a'};
let count = 0;
function test(name,fn){fn();count++;console.log('PASS '+name);}
const [call,manager,staff] = P.identities;
const state = P.seed();
test('三类岗位允许与拒绝',()=>{assert.equal(P.canView(state,call,target),false);assert.equal(P.canView(state,manager,target),true);assert.equal(P.canView(state,staff,target),false);});
test('跨店与跨公司拒绝',()=>{assert.equal(P.canView(state,manager,{...target,org:'store-b'}),false);assert.equal(P.canView(state,manager,{...target,company:'bj'}),false);});
test('任职停用、未生效和到期',()=>{for(const delta of [{active:false},{start:'2099-01-01'},{end:'2020-01-01'}])assert.equal(P.canView(state,{...manager,...delta},target),false);});
test('未知岗位、角色和身份默认拒绝',()=>{assert.equal(P.canView(state,null,target),false);assert.equal(P.canView(state,{...manager,positionId:'missing'},target),false);let s=P.seed();s.positions.find(x=>x.id==='P010').roleId='missing';assert.equal(P.canView(s,manager,target),false);});
test('兼岗不借用其他门店角色',()=>assert.equal(P.canView(state,{...staff,extraRoles:['franchise-manager']},target),false));
test('绕过控件请求不能开放店员／呼叫中心',()=>{assert.ok(P.saveRole('call-sales',true).error);assert.ok(P.saveRole('franchise-staff',true).error);});
test('岗位保存、复开与角色共用结果',()=>{const p=P.read().positions.find(x=>x.id==='P010');assert.equal(P.savePosition({...p,duty:'管理本店报价'},false).error,'');assert.equal(P.read().positions.find(x=>x.id==='P010').duty,'管理本店报价');assert.equal(P.role(P.read(),'franchise-manager').allowSettlement,false);assert.equal(P.canView(P.read(),manager,target),false);});
test('业务角色修改反映到岗位',()=>{assert.equal(P.saveRole('franchise-manager',true).error,'');assert.equal(P.canView(P.read(),manager,target),true);assert.ok(P.read().changes.length===2);});
test('岗位停用与重新启用',()=>{const p=P.read().positions.find(x=>x.id==='P010');P.savePosition({...p,status:'停用'},true);assert.equal(P.canView(P.read(),manager,target),false);P.savePosition({...p,status:'启用'},true);assert.equal(P.canView(P.read(),manager,target),true);});
test('预置受限岗位不能改绑绕过',()=>{const p=P.read().positions.find(x=>x.id==='P011');assert.ok(P.savePosition({...p,roleId:'franchise-manager'},true).error);});
test('空名、重复名称及未知角色不保存',()=>{const before=JSON.stringify(P.read());assert.ok(P.savePosition({name:''},false).error);assert.ok(P.savePosition({name:'产品经理'},false).error);assert.ok(P.savePosition({name:'临时岗',roleId:'missing'},false).error);assert.equal(JSON.stringify(P.read()),before);});
test('新增未关联岗位默认无价格权限',()=>{const result=P.savePosition({name:'临时销售岗',roleId:'',status:'启用'},false);assert.equal(result.error,'');assert.equal(P.canView(P.read(),{...manager,positionId:result.id},target),false);});
test('同角色岗位修改共用规则而不影响其他角色',()=>{P.savePosition({name:'加盟值班店长',roleId:'franchise-manager',status:'启用'},false);assert.equal(P.role(P.read(),'franchise-manager').allowSettlement,false);assert.equal(P.role(P.read(),'call-sales').allowSettlement,false);});
for(const file of ['admin/positions.html','admin/merchant-roles.html','merchant/sales/sales-product-quote.html']){
 const html=fs.readFileSync(file,'utf8');
 test(file+'内联脚本语法',()=>{for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1],{filename:file});});
}
console.log('完成 '+count+' 组岗位字段规则及脚本检查');
