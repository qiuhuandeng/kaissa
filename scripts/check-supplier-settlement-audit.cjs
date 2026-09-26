/* 汇总本工作线既有业务检查，不用历史测试数代替本次执行。 */
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=process.env.SUPPLIER_AUDIT_DIR||'/private/tmp/supplier-settlement-audit';
const cases=[
 ['reconciliation',22],['bill-submission',18],['purchase',15],['finance',17],['closeout',17],['payment-request',18],['purchase-payments',10],['adjustment',14],
 ['reconciliation-browser',37],['reconciliation-navigation',3],['bill-submission-browser',24],['purchase-browser',26],['finance-browser',33],['finance-navigation',19],['closeout-browser',29],['payment-request-browser',25],['purchase-payments-browser',15],['adjustment-browser',23]
].map(([name,expected])=>({file:'check-supplier-'+name+'.cjs',expected,browser:/browser|navigation/.test(name)}));
fs.mkdirSync(out,{recursive:true});const results=[];let cursor=0;
async function run(test){return new Promise(resolve=>{
 let output='',timedOut=false,finished=false;const start=Date.now(),child=spawn(process.execPath,[path.join(__dirname,test.file)],{cwd:root,detached:true,stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);
 function finish(code,error){if(finished)return;finished=true;clearTimeout(timer);const count=Number([...output.matchAll(/完成\s*(\d+)\s*组/g)].at(-1)?.[1]||0);const result={...test,code,count,timedOut,error:error||null,seconds:Math.round((Date.now()-start)/1000),passed:code===0&&!timedOut&&!error&&count===test.expected};fs.writeFileSync(path.join(out,test.file+'.log'),output);results.push(result);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log((result.passed?'PASS ':'FAIL ')+test.file+' '+count+'/'+test.expected+' groups, exit '+code+(timedOut?' (timed out)':''));resolve();}
 const timer=setTimeout(()=>{timedOut=true;try{process.kill(-child.pid,'SIGKILL');}catch(e){output+='\nCleanup: '+e.message;}finish(null,'测试或退出超过180秒');},180000);
 child.on('error',e=>finish(null,e.message));child.on('close',code=>finish(code));
 });}
async function worker(){while(cursor<cases.length)await run(cases[cursor++]);}
(async()=>{await Promise.all([worker(),worker()]);const pass=results.every(x=>x.passed),sum=browser=>results.filter(x=>x.browser===browser&&x.passed).reduce((n,x)=>n+x.count,0);console.log(JSON.stringify({passed:pass,suites:results.length,rules:sum(false),browser:sum(true),report:path.join(out,'results.json')},null,2));if(!pass)process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1});
