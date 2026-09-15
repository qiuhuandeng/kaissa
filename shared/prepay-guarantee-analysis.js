(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./finance-prepayments-model.js'));else root.CaesarPrepayGuarantee=factory(root.CaesarPrepayments);})(typeof globalThis==='object'?globalThis:this,function(base){
 const columns={prepay:['id','party','company','currency','closing','frozen','available','refundDue','coverage','ledger'],guarantee:['id','direction','party','company','currency','closing','frozen','refundDue','returnDue','overdueReturn','coverage','ledger']};
 function query(input={},data){const q={...base.defaults,...input};if(!['prepay','guarantee'].includes(q.view))throw Error('请选择预付款或保证金');if(q.view==='prepay')q.direction='支付';
 const source=base.query(q,data);
 return {rows:source.rows.map(r=>({...r,allocated:r.closing==null?null:r.allocated,unallocated:null,coverage:r.closing==null?'余额资料不足':q.view==='prepay'?'余额齐全；分配余额待核对':r.refundDue>0&&!r.returnDue?'退回期限待补':'余额资料齐全'})),columns:columns[q.view],title:q.view==='prepay'?'预付账户余额':'保证金余额',sections:[],pending:source.pending,
 notice:source.notice+'；逐账户按公司、账簿及原币列示。冻结只减可用，不再扣账面；待退仅已确认余额，不等于获准立即退款。'+(q.view==='prepay'?'累计团期分摊是历史分配金额，不是当前已分配余额；没有逐笔核销对应，不用账面余额减累计分摊推算未分配。期间流水归款项变动，供应商风险归预付占用。':'收取与支付分别列示，不互抵、不计销售收入；到期日缺失不填假日期或假零逾期，期间流水归款项变动。')};
 }
 return {query,columns};
});
