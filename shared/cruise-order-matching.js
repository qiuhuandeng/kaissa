/* 将原订单提交的邮轮认款显示在统一财务复核列表，不生成银行回单或 NC 凭证。 */
(function(root){
'use strict';
const M=root.CruiseOrderMainflow,host=document.getElementById('matchingRows');if(!M||!host)return;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function hydrate(row,r){const done=r.status==='已确认',before=Math.max(0,r.received-(done?r.amount:0));Object.assign(row.dataset,{cruiseOrder:r.orderNo,matchNo:r.id,sourceNo:r.reference,source:'订单付款凭据（原型）',payer:r.customer,business:r.orderNo,products:r.product,receivables:'本单应收',receivableAmounts:M.money(r.total),recognizedAmounts:M.money(before),currentAmounts:M.money(r.amount),afterAmounts:M.money(Math.max(0,r.total-before-r.amount)),diffs:'¥0',amount:M.money(r.amount),diff:'¥0',scenario:r.node,status:r.status,company:r.company||'',submitter:'订单经办人',submitTime:r.at,date:r.at.slice(0,10),voucher:r.reference,receiptNo:'未生成真实凭证',nc:'未接入',check:'本单应收及本次分配待财务核对；提交不计已收',result:done?'本次认款已确认，已计入订单已收；未生成真实凭证':r.status==='已退回'?'认款已退回：'+r.reason:'待财务复核'});}
function mount(){const host=document.getElementById('matchingRows');if(!host)return;for(const r of M.claims()){const row=document.createElement('tr');hydrate(row,r);row.innerHTML=['<div class="table-cell-main"><strong>'+E(r.id)+'</strong><span>'+E(r.reference)+'</span></div>',E(r.customer),'<div class="table-cell-main"><strong>'+E(r.orderNo)+'</strong><span>'+E(r.product)+'</span></div>','本单应收',M.money(r.amount),'¥0',E(r.node),E(r.status),'<div class="table-action">'+(r.status==='待复核'?'<button class="table-action-primary" data-open-review>复核</button>':'')+'<button data-open-detail>详情</button></div>'].map(x=>'<td>'+x+'</td>').join('');host.prepend(row);}}
root.CruiseOrderMatching={
 mount,
 review(row,action,reason){if(!row.dataset.cruiseOrder)return false;M.review(row.dataset.matchNo,action==='退回补充'?'已退回':'已确认',reason);hydrate(row,M.claims().find(r=>r.id===row.dataset.matchNo));return true;},
 details(row){if(!row.dataset.cruiseOrder)return;const r=M.claims().find(r=>r.id===row.dataset.matchNo);document.getElementById('detailVoucherGrid').innerHTML='<div class="description-item"><div class="description-label">订单认款结果</div><div class="description-value">'+E(row.dataset.result)+'</div></div><div class="description-item"><div class="description-label">关联订单</div><div class="description-value"><a href="../sales/orders-detail.html?type=cruise&orderNo='+encodeURIComponent(r.orderNo)+'&tab=receivable">'+E(r.orderNo)+'</a></div></div>';document.getElementById('detailLogRows').innerHTML='<tr><td>'+E(r.at)+'</td><td>提交认款</td><td>待财务复核</td><td>订单经办人</td></tr>'+(r.reviewedAt?'<tr><td>'+E(r.reviewedAt)+'</td><td>财务复核</td><td>'+E(r.status+' '+(r.reason||''))+'</td><td>认款财务</td></tr>':'');}
};
root.initFinanceMatching?.();
})(window);
