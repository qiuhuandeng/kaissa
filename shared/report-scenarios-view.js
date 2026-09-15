(function(){
  'use strict';const host=document.querySelector('[data-report-scenarios]'),m=window.CaesarReportScenarios;if(!host||!m)return;
  window.CaesarReadonlyReport.mount(host,{title:'业务场景核对',defaults:{view:'s1'},views:m.views,query:m.query,labels:{metric:'核对项目',amount:'核对数值',unit:'单位',period:'对应日期/期间',reference:'来源范围',company:'责任公司/范围',id:'来源单据',type:'业务内容',evidence:'确认依据'},money:['amount'],columns:()=>['metric','amount','unit','period','reference','company'],extras:[],filters:[],definition:'六类独立业务场景只用于核对期间、责任与防重复计数。具体金额政策仍待确认，算例通过不替代真实数据平行核对。'});
})();
