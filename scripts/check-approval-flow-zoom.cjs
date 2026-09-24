const assert=require('node:assert/strict');
const {page,click,layer,close}=require('./check-approval-config-dom.cjs');
(async()=>{for(const query of ['?id=template-0','?id=template-0&mode=view&version=1']){const p=await page('admin/approval-template-edit.html'+query);const value=()=>p.d.querySelector('[data-flow-zoom]').textContent;
assert.equal(value(),'100%');for(let i=0;i<3;i++)click(p,'[data-ac=zoom-out]');assert.equal(value(),'70%');assert.equal(p.d.querySelector('.ac-flow-canvas').style.getPropertyValue('--ac-flow-scale'),'0.7');
click(p,'[data-ac=applicant]');assert(layer(p).querySelector('[data-field=name]'));assert(!layer(p).closest('.ac-flow-canvas'));close(p);assert.equal(value(),'70%');
click(p,'[data-step="1"]');assert(!p.d.querySelector('.ac-flow-zoom'));click(p,'[data-step="2"]');assert.equal(value(),'70%');
for(let i=0;i<20;i++)click(p,'[data-ac=zoom-out]');assert.equal(value(),'50%');assert(p.d.querySelector('[data-ac=zoom-out]').disabled);
for(let i=0;i<20;i++)click(p,'[data-ac=zoom-in]');assert.equal(value(),'150%');assert(p.d.querySelector('[data-ac=zoom-in]').disabled);assert.deepEqual(p.errors,[]);p.w.close();}
console.log('PASS 缩放默认值、步长、上下限、Tab保留、抽屉隔离和只读模式；实际布局待浏览器复核');})().catch(e=>{console.error(e);process.exitCode=1;});
