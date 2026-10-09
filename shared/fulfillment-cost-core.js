/* 从团期结算成本草稿提取共用字段及金额校验；单团三个入口使用本文件的同一编辑区。 */
(function(root){
'use strict';
const core={createDraft(data={},company=''){return Object.assign({subject:'',supplier:'',currency:'CNY',originalAmount:'',rate:'1.0000',localAmount:'',note:'',company,agreementNo:''},data);},total(quantity,price){return Math.round((Number(quantity)*Number(price)+Number.EPSILON)*100)/100;},convert(amount,rate){return amount==null||!Number(rate)?null:Math.round((Number(amount)*Number(rate)+Number.EPSILON)*100)/100;}};root.FulfillmentCostEditor=core;
})(window);
