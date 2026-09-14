(function (root) {
  'use strict';
  const M = root.CaesarStoreGovernance || (typeof require === 'function' ? require('./store-governance-model.js') : null);
  const typeName = value => ({group:'参团游',standard:'参团游',cruise:'邮轮',train:'专列',free:'自由行',single:'单项服务',manual:'单项服务',study:'研学',customProject:'单团项目',MICE:'单团项目'}[value] || value);
  function store(name) { return M.create().stores.find(s => s.profile.name === name); }
  function authorization(c) {
    if (c.source && c.source !== '门店') return [];
    const s = store(c.storeName);
    if (!s) return ['门店有效档案未提供'];
    const gaps = [];
    if (s.status !== '正常') gaps.push('门店' + s.status + '，不能新增预订或名额');
    if (s.profile.expiry < M.day()) gaps.push('合作资质已到期');
    if (s.reviews.sales !== '已生效') gaps.push('销售授权未生效');
    else if (!s.sales.products.includes(typeName(c.productType))) gaps.push('产品类型不在当前门店可售范围');
    if (c.saleStatus !== '可售') gaps.push(c.saleStatus === '停售' ? '产品已停售' : '产品可售状态待核对');
    return gaps;
  }
  function payment(c, stage) {
    const rule = stage === 'send' ? c.contractPayment : c.paymentRule;
    if (!rule || !rule.known || !Number.isFinite(Number(rule.required)) || Number(rule.required) < 0) return ['本单' + (stage === 'send' ? '签约' : '确认') + '付款条件待确认（销售、财务）'];
    if (rule.required > 0 && (!c.receivedConfirmed || Number(c.paid || 0) < rule.required)) return ['财务已确认收款未达到本次付款节点；截图、待认款和预存冻结不计已付'];
    return [];
  }
  function protectedReasons(c) {
    const reasons = [];
    if (Number(c.paid || 0) > 0) reasons.push('已有付款');
    if (c.paymentPending) reasons.push('收款结果待核查');
    if (['签署中','已签署','已生效'].includes(c.contractState)) reasons.push('合同' + c.contractState);
    if (c.ticketed) reasons.push('已出票或已确认不可直接退回的资源');
    return reasons;
  }
  function timestamp(value) { return Date.parse(/Z$|[+-]\d{2}:?\d{2}$/.test(value || '') ? value : String(value || '').replace(' ', 'T') + '+08:00'); }
  function check(c, action) {
    if (action === 'draft') return [];
    if (['new','reserve','hold','confirm','increase'].includes(action)) {
      const gaps = authorization(c);
      if (action === 'increase' && !['预留','占位','待确认','已确认'].includes(c.orderStatus)) gaps.push('当前订单状态不允许增加人数');
      if (action === 'reserve' || action === 'hold') {
        const s = store(c.storeName), hours = s?.sales[action === 'reserve' ? 'reserveHours' : 'holdHours'];
        if (!(Number(hours) > 0)) gaps.push('保留时长待业务确认，先保存草稿或提交待确认订单');
        if (!c.capacityAvailable) gaps.push('可保留数量待资源方确认');
      }
      if (action === 'confirm') {
        if (!['预留','占位','待确认'].includes(c.orderStatus)) gaps.push('当前订单状态不能转确认');
        if (c.resourceState !== '已确认') gaps.push('资源待计调或资源方确认');
        if (c.occupation === '已释放') gaps.push('名额已释放，到账后仍需重新确认余位');
        if (c.deadline && !Number.isFinite(timestamp(c.deadline))) gaps.push('名额保留截止无效，先由计调核对');
        if (c.deadline && timestamp(c.deadline) <= timestamp(c.now || new Date().toISOString())) gaps.push('名额保留已到期，先由计调重新确认保留结果');
        gaps.push(...payment(c,'confirm'));
      }
      return gaps;
    }
    if (action === 'release') {
      if (!['预留','占位'].includes(c.orderStatus) || c.occupation === '已释放') return ['当前没有可直接释放的预留或占位'];
      const reasons = protectedReasons(c);
      if (reasons.length) return [reasons.join('、') + '；交由销售负责人、计调及财务核查，不能直接释放'];
      if (!c.releaseMode) return ['释放方式待业务确认，由计调核对后处理'];
      return [];
    }
    if (action === 'send') {
      const gaps = [];
      if (['已取消','已作废','草稿','待核对'].includes(c.orderStatus)) gaps.push('订单尚未成立或已结束，不能发起签署');
      if (!c.historicalConfirmed) gaps.push(...authorization(c));
      if (!c.canServe) gaps.push('当前经办人没有本单签约权限，请交有权限的负责人处理');
      if (!c.templateValid) gaps.push('适用合同模板及版本待法务核对');
      if (!c.companyValid) gaps.push('签约公司与本单不一致或未获授权');
      if (!c.documentsReady) gaps.push('签署人或合同资料待补齐');
      if (!['待发送'].includes(c.contractState)) gaps.push('当前合同不允许重复发起签署');
      if (c.occupation === '已释放' && !c.historicalConfirmed) gaps.push('名额已释放，先由计调重新确认资源');
      if (c.signDeadline && timestamp(c.signDeadline + 'T23:59:59') < timestamp(c.now || new Date().toISOString())) gaps.push('签署截止已过期，请重新核对截止日期');
      gaps.push(...payment(c,'send'));
      return [...new Set(gaps)];
    }
    return [];
  }
  function expiry(c) {
    if (c.occupation === '已释放') return '名额已释放；迟到款项交财务核对，并由计调重新确认余位。';
    if (!c.deadline) return '保留截止及释放方式待确认，不按固定时长自动释放。';
    if (!Number.isFinite(timestamp(c.deadline))) return '名额保留截止无效，交计调核对。';
    if (timestamp(c.deadline) > timestamp(c.now || new Date().toISOString())) return '按本单保留截止处理；延期须经计调确认。';
    const reasons = protectedReasons(c);
    if (reasons.length) return '已到期，' + reasons.join('、') + '；保留处理记录，交负责人核查，不直接取消或释放。';
    if (!c.releaseMode) return '已到期，释放规则待确认；交计调处理。';
    return c.releaseMode === 'auto' ? '已到期且无付款、签约或出票异常，按已批准规则释放。' : '已到期，由计调核对后释放；未处理前不假报已释放。';
  }
  function existing(values) {
    return Object.assign({source:'门店',storeName:'软件园门店',productType:'参团游',saleStatus:'可售',orderStatus:'待确认',resourceState:'待确认',occupation:'保留中',deadline:'',releaseMode:'',paid:0,receivedConfirmed:false,paymentRule:{known:false},contractPayment:{known:false},contractState:'待生成',canServe:true,templateValid:false,companyValid:false,documentsReady:false,historicalConfirmed:false}, values);
  }
  function summary(c) {
    const auth = authorization(c);
    return [
      ['销售授权', auth.join('；') || '当前可售范围已核对', '销售负责人'],
      ['资源确认', c.resourceState + (c.occupation === '已释放' ? '；原名额已释放' : ''), '计调／资源方'],
      ['确认付款条件', payment(c,'confirm').join('；') || '本单付款节点已满足；不代表全款已收', '公司财务'],
      ['名额保留', c.deadline ? c.deadline.replace('T',' ').replace('Z','') : '截止时间待确认', '计调'],
      ['到期处理', expiry(c), '销售负责人、计调及财务']
    ];
  }
  function html(rows) {
    const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    return '<div class="store-order-checks"><div class="table-wrap"><table><thead><tr><th>核对事项</th><th>当前结果</th><th>处理岗位</th></tr></thead><tbody>' + rows.map(row => '<tr>' + row.map(v => '<td>' + escape(v) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div></div>';
  }
  const api = {typeName,store,authorization,payment,protectedReasons,check,expiry,existing,summary,html};
  root.CaesarStoreOrderRules = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
