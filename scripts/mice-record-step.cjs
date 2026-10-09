/* 每个步骤测试后人工核对证据，再调用本脚本登记，不自动判定业务通过。 */
const fs=require('fs');const [step,status,done,next]=process.argv.slice(2);if(!step||!done||!next)throw Error('步骤 状态 完成记录 唯一下一动作');
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
let p='docs/会奖项目原型执行清单.md',s=read(p);s=s.replace(new RegExp('(\\| '+step+' [^\\n]+?\\| )(进行中|未开始|待验收|已验收)( \\| )[^\\n]+'),(_,a,b,c)=>a+status+c+done+' |');write(p,s);
p='docs/业财报表自动化改造进度.md';s=read(p).replace(/\*\*本轮会奖工作线当前步骤（2026-10-08）：[^\n]+/,'**本轮会奖工作线当前步骤（2026-10-08）：'+step+' '+status+'。** '+done+'。按用户连续授权继续；原8批及并行工作线保持。').replace(/\*\*本轮会奖工作线唯一下一步（2026-10-08）：\*\*[^\n]+/,'**本轮会奖工作线唯一下一步（2026-10-08）：** '+next+'。继续逐步自测并推进M01—M12，最终完整重读原逐字稿，修正缺口后统一交付，不逐步询问。');const log='### 2026-10-08 会奖原型 '+step+' '+status+'\n\n'+done+'。下一步按第四节执行。\n\n';s=s.replace('## 三、当前步骤',log+'## 三、当前步骤');write(p,s);
p='docs/财务要求-现有功能-缺口-修改对照表.md';s=read(p);if(!s.includes('连续执行实施记录'))s=s.replace('\n\n','\n\n> 2026-10-08连续执行实施记录：用户已明确授权M01—M12。下方旧“仅方案／撤回”是历史，各项现状以本记录、执行清单及实际证据为准。\n\n');s=s.replace('细化验收（均未实施）','细化验收（实施见顶部记录及清单）');s=s.replace('## 2026-10-08 会奖基于现有单团的整体改造方案','- '+step+' '+status+'：'+done+'。\n\n## 2026-10-08 会奖基于现有单团的整体改造方案');write(p,s);
