(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./finance-cashflow-model.js') : root.CaesarCashflow);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CaesarBalances = api;
})(typeof globalThis === 'object' ? globalThis : this, function (cashflow) {
  'use strict';
  const { sum, money, fmt, esc, csv, sort } = cashflow;
  const views = { ar: '应收明细', ap: '应付明细', aging: '账龄汇总', clearing: '内部待清算' };
  const cases = { BA01: '历史余额与期后收款', BA02: '企业项目分阶段收款', BA03: '减项与核销冲回', BA04: '付款与预付冲抵', BA05: '缺日期、金额及历史', BA06: '同名往来与原币', BA07: '集团代收代付', BA08: '迟到调整与资料截止', BA09: '到期日变更', BA10: '重复、冲突及反向余额', BA11: '账龄与逾期边界', BA12: '分页及完整导出' };
  const kinds = { adjustment: '应收应付调整', cash: '收付核销', offset: '预款冲抵', relief: '批准减免核销', terms: '到期日变更' };
  const dateOK = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
  const timeOK = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s) && dateOK(s.slice(0, 10)) && Number(s.slice(11, 13)) < 24 && Number(s.slice(14, 16)) < 60 && (s.length === 16 || Number(s.slice(17, 19)) < 60);
  const days = (a, b) => Math.round((Date.parse(a) - Date.parse(b)) / 86400000);
  const key = d => JSON.stringify([d.source, d.company, d.ledger, d.currency, d.id]);
  const signature = r => JSON.stringify(Object.keys(r).sort().map(k => [k, r[k]]));
  const defaults = () => ({ dataset: 'pending', view: 'ar', case: '', asOf: '2026-09-30', cutoff: '2026-10-31T23:59', dueStart: '', dueEnd: '', confirmedStart: '', confirmedEnd: '', company: '', ledger: '', currency: '', party: '', customerType: '', channel: '', salesCompany: '', productCompany: '', department: '', store: '', center: '', order: '', scope: '', status: '', direction: 'ar', ageBasis: 'age', group: 'party' });

  function fixture() {
    const documents = [], events = [];
    function doc(c, id, amount, more = {}) {
      const d = { case: c, id, amount, type: 'ar', source: '独立验收资料', company: '北京凯撒旅游', ledger: '北京业务账', currency: 'CNY', scope: '外部往来',
        partyId: 'C001', party: '华光科技有限公司', customerType: '企业客户', channel: '企业直销', order: 'KS-' + id, business: '企业项目 / 首款',
        confirmedAt: '2026-08-01', recordedAt: '2026-08-01T10:00:00', due: '2026-09-10', confirmed: true, historyComplete: true,
        proof: '合同阶段确认-' + id, salesCompany: '北京凯撒旅游', productCompany: '福建凯撒旅游', department: '会奖事业部', store: '', center: '',
        businessCompany: '', fundsCompany: '', relation: '', peerCompany: '', peerKey: '', clearingType: '', ...more };
      documents.push(d); return d;
    }
    function event(d, id, kind, amount, effectiveAt, more = {}) {
      const r = { docKey: key(d), id, kind, amount, effectiveAt, recordedAt: effectiveAt + 'T12:00:00', confirmed: true, source: '独立验收资料', currency: d.currency,
        proof: '确认依据-' + id, reference: '凭据-' + id, original: '', fundsCompany: d.company, actualAt: kind === 'cash' ? effectiveAt : '', ...more };
      events.push(r); return r;
    }
    let d = doc('BA01', 'YS-26080101', 10000);
    event(d, 'HX-090501', 'cash', 4000, '2026-09-05'); event(d, 'HX-100501', 'cash', 6000, '2026-10-05');
    d = doc('BA02', 'YS-PROJECT-01', 30000, { order: 'KSMICE-260901', business: '年会项目 / 第一阶段', confirmedAt: '2026-09-01', recordedAt: '2026-09-01T10:00:00', due: '2026-09-15' });
    event(d, 'HX-PROJECT-01', 'cash', 10000, '2026-09-10');
    doc('BA02', 'YS-PROJECT-02', 70000, { order: d.order, business: '年会项目 / 第二阶段', confirmedAt: '2026-10-01', recordedAt: '2026-10-01T10:00:00', due: '2026-10-20' });
    d = doc('BA03', 'YS-ADJUST-01', 10000);
    event(d, 'TZ-0901', 'adjustment', -2000, '2026-09-10');
    event(d, 'HX-0912', 'cash', 8000, '2026-09-12');
    event(d, 'CH-0920', 'cash', -1000, '2026-09-20', { original: 'HX-0912', proof: '部分认款冲回确认' });
    event(d, 'TZ-PENDING', 'adjustment', 500, '2026-09-21', { confirmed: false });
    d = doc('BA04', 'AP-CRUISE-01', 20000, { type: 'ap', partyId: 'S001', party: '远航邮轮公司', customerType: '供应商', channel: '不适用', business: '包舱账单 / 团期分配', order: '', due: '2026-10-10' });
    event(d, 'FKHX-01', 'cash', 5000, '2026-09-10'); event(d, 'PP-OFFSET-01', 'offset', 6000, '2026-09-12', { reference: 'PP-26060101' });
    event(d, 'FKHX-RETURN', 'cash', -2000, '2026-09-20', { original: 'FKHX-01', proof: '付款退回及原应付核销冲回确认' });
    doc('BA05', 'YS-NODUE', 5000, { due: '' }); doc('BA05', 'YS-NOHISTORY', 9000, { historyComplete: false });
    doc('BA05', 'YS-NOAMOUNT', null); doc('BA05', 'YS-PENDING', 3000, { confirmed: false });
    doc('BA05', 'YS-NODATE', 4000, { confirmedAt: '' });
    doc('BA06', 'YS-SAME-01', 6000, { partyId: 'C002', party: '阳光旅行社', customerType: '渠道客户', channel: '加盟门店', store: '朝阳门店', department: '渠道事业部' });
    doc('BA06', 'YS-SAME-02', 8000, { partyId: 'C003', party: '阳光旅行社', company: '福建凯撒旅游', ledger: '福建业务账', channel: '呼叫中心', center: '厦门呼叫中心' });
    doc('BA06', 'YS-SAME-03', 1000, { partyId: 'C002', party: '阳光旅行社', currency: 'USD', ledger: '北京外币账' });
    doc('BA06', 'YS-ZERO', 0, { partyId: 'C004', due: '' });
    d = doc('BA07', 'YS-CUSTOMER-01', 8000);
    event(d, 'HX-AGENT-01', 'cash', 8000, '2026-09-05', { fundsCompany: '福建凯撒旅游', reference: 'SK-AGENT-01' });
    function pair(id, amount, clearingType, receivableCompany, payableCompany, businessCompany, fundsCompany) {
      const common = { scope: '内部资金清算', relation: id, clearingType, businessCompany, fundsCompany, order: d.order, business: clearingType + ' / 内部清算', customerType: '集团公司', channel: '不适用' };
      const ar = doc('BA07', id + '-AR', amount, { ...common, company: receivableCompany, ledger: receivableCompany + '业务账', peerCompany: payableCompany, partyId: 'GROUP-' + payableCompany, party: payableCompany });
      const ap = doc('BA07', id + '-AP', amount, { ...common, type: 'ap', company: payableCompany, ledger: payableCompany + '业务账', peerCompany: receivableCompany, partyId: 'GROUP-' + receivableCompany, party: receivableCompany });
      ar.peerKey = key(ap); ap.peerKey = key(ar);
      event(ar, id + '-HX-AR', 'cash', clearingType === '代收' ? 3000 : 1000, '2026-09-15');
      event(ap, id + '-HX-AP', 'cash', clearingType === '代收' ? 3000 : 1000, '2026-09-15');
    }
    pair('QS-AGENT-01', 8000, '代收', '北京凯撒旅游', '福建凯撒旅游', '北京凯撒旅游', '福建凯撒旅游');
    pair('QS-PAY-01', 5000, '代付', '福建凯撒旅游', '北京凯撒旅游', '北京凯撒旅游', '福建凯撒旅游');
    doc('BA07', 'QS-MISSING', 2000, { scope: '内部资金清算', relation: 'QS-UNKNOWN', clearingType: '代收', businessCompany: '北京凯撒旅游', fundsCompany: '福建凯撒旅游', peerCompany: '福建凯撒旅游', party: '福建凯撒旅游', partyId: 'GROUP-FJ' });
    doc('BA07', 'QS-SAME-LEGAL', 1000, { scope: '内部资金清算', relation: 'QS-SAME', clearingType: '代收', businessCompany: '北京凯撒旅游', fundsCompany: '北京凯撒旅游', peerCompany: '北京凯撒旅游' });
    d = doc('BA08', 'YS-LATE', 10000);
    event(d, 'TZ-LATE', 'adjustment', -1000, '2026-09-01', { recordedAt: '2026-10-08T10:00:00' });
    d = doc('BA09', 'YS-DUE-CHANGE', 10000, { due: '2026-09-01' });
    event(d, 'TERM-0920', 'terms', null, '2026-09-20', { due: '2026-10-15', proof: '批准延期记录' });
    d = doc('BA10', 'YS-DUPLICATE', 10000);
    const r = event(d, 'HX-DUP', 'cash', 1000, '2026-09-10'); events.push({ ...r });
    d = doc('BA10', 'YS-CONFLICT', 10000);
    const conflict = event(d, 'HX-CONFLICT', 'cash', 1000, '2026-09-10'); events.push({ ...conflict, amount: 2000 });
    d = doc('BA10', 'YS-REVERSE', 1000); event(d, 'HX-OVER', 'cash', 1200, '2026-09-10');
    d = doc('BA10', 'YS-NOORIGINAL', 1000); event(d, 'CH-MISSING', 'cash', -500, '2026-09-10', { original: 'HX-NOT-PROVIDED' });
    [0, 1, 30, 31, 60, 61, 90, 91, 180, 181, -1].forEach((n, i) => {
      const due = new Date(Date.parse('2026-09-30') - n * 86400000).toISOString().slice(0, 10);
      doc('BA11', 'YS-BOUNDARY-' + i, 100, { confirmedAt: '2026-03-01', recordedAt: '2026-03-01T10:00:00', due });
    });
    for (let i = 1; i <= 25; i++) doc('BA12', 'YS-EXPORT-' + String(i).padStart(2, '0'), i * 100, { party: i === 25 ? '=客户,"测试"\n第二行' : '导出客户', partyId: 'EXPORT-' + i });
    return { start: '2026-03-01', end: '2026-10-31', documents, events };
  }

  function query(input, data = fixture()) {
    const q = { ...defaults(), ...input };
    if (!views[q.view] || !['pending', 'demo'].includes(q.dataset) || !['age', 'overdue'].includes(q.ageBasis) || !['ar', 'ap'].includes(q.direction) || !['party', 'channel', 'department'].includes(q.group)) throw new Error('查询方式无效');
    if (!dateOK(q.asOf) || !timeOK(q.cutoff) || q.asOf > q.cutoff.slice(0, 10)) throw new Error('请核对余额截止日与资料截止时间');
    for (const [start, end] of [['dueStart', 'dueEnd'], ['confirmedStart', 'confirmedEnd']]) {
      if ((q[start] && !dateOK(q[start])) || (q[end] && !dateOK(q[end])) || (q[start] && q[end] && q[start] > q[end])) throw new Error('请核对到期日或确认日期范围');
    }
    const empty = { q, rows: [], details: [], totals: [], evidence: [], exceptions: [], pending: q.dataset === 'pending', notice: '正式来源及历史记录待接入' };
    if (q.dataset === 'pending') return empty;
    if (q.asOf < data.start || q.asOf > data.end || q.cutoff.slice(0, 10) > data.end) return { ...empty, pending: true, notice: '所选时点超出资料覆盖期，无法还原余额' };
    const cutoff = q.cutoff.length === 16 ? q.cutoff + ':59' : q.cutoff;
    const visible = r => !timeOK(r.recordedAt) || r.recordedAt <= cutoff;
    const exceptions = [], evidence = [], entries = new Map();
    function issue(d, id, message) { exceptions.push({ ...d, id, issue: message }); }
    function unique(rows, getKey, onConflict) {
      const groups = new Map();
      rows.filter(visible).forEach(r => { const k = getKey(r); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); });
      const accepted = [];
      groups.forEach(rs => {
        if (new Set(rs.map(signature)).size > 1) onConflict(rs, true);
        else { accepted.push(rs[0]); if (rs.length > 1) onConflict(rs, false); }
      });
      return accepted;
    }
    const docs = unique(data.documents, key, (rs, conflict) => {
      issue(rs[0], rs[0].id, conflict ? '同号来源冲突，余额不可还原' : '重复来源仅计一次');
      if (conflict) entries.set(key(rs[0]), { ...rs[0], invalid: true });
    });
    docs.forEach(d => entries.set(key(d), { ...d }));
    const evs = unique(data.events, r => JSON.stringify([r.docKey, r.source, r.id]), (rs, conflict) => {
      const d = entries.get(rs[0].docKey);
      if (d) { issue(d, rs[0].id, conflict ? '同号变动金额或依据冲突' : '重复变动仅计一次'); if (conflict && rs.some(r => !dateOK(r.effectiveAt) || r.effectiveAt <= q.asOf)) d.invalid = true; }
    });
    evs.filter(r => !entries.has(r.docKey)).forEach(r => issue({ case: r.case, company: '', currency: r.currency, type: q.direction, scope: '来源未对应' }, r.id, '未匹配应收应付来源，不分配到其他订单'));
    const allDetails = [];
    for (const [docKey, d] of entries) {
      if (dateOK(d.confirmedAt) && d.confirmedAt > q.asOf) continue;
      const errors = [];
      if (!d.confirmed) errors.push('应收应付尚未确认');
      if (!dateOK(d.confirmedAt) || !timeOK(d.recordedAt)) errors.push('缺有效确认或录入日期');
      if (!d.company || !d.ledger || !d.currency || !d.proof || !d.partyId) errors.push('主体、账簿、往来身份或确认依据缺失');
      if (!money(d.amount) || d.historyComplete !== true || d.invalid) errors.push('金额或完整历史不足');
      if (d.scope === '内部资金清算' && (!d.businessCompany || !d.fundsCompany || !d.relation || d.businessCompany === d.fundsCompany)) errors.push('清算责任缺失或同法人协作误列内部债权债务');
      if (d.scope === '内部资金清算') {
        const receivableCompany = d.clearingType === '代收' ? d.businessCompany : d.fundsCompany;
        const payableCompany = d.clearingType === '代收' ? d.fundsCompany : d.businessCompany;
        if (!['代收', '代付'].includes(d.clearingType) || d.company !== (d.type === 'ar' ? receivableCompany : payableCompany)) errors.push('代收代付与应收应付责任不符');
      }
      let due = d.due, adjustments = 0, cash = 0, offset = 0, relief = 0;
      const applied = new Map(), reversed = new Map();
      const related = evs.filter(r => r.docKey === docKey).sort((a, b) => String(a.effectiveAt).localeCompare(String(b.effectiveAt)) || Number(Boolean(a.original)) - Number(Boolean(b.original)) || String(a.recordedAt).localeCompare(String(b.recordedAt)));
      evidence.push({ ...d, docKey, reference: d.proof, kindLabel: '应收应付原确认', effectiveAt: d.confirmedAt, inclusion: errors.length ? '资料不足，不计余额' : '纳入', original: '', fundsCompany: '' });
      for (const r of related) {
        let reason = !r.confirmed ? '尚未确认，不计余额' : dateOK(r.effectiveAt) && r.effectiveAt > q.asOf ? '余额截止后，不计入' : '';
        if (!reason) {
          if (!dateOK(r.effectiveAt) || !timeOK(r.recordedAt) || !r.proof || !r.reference || !kinds[r.kind] || r.currency !== d.currency || r.effectiveAt < d.confirmedAt) reason = '变动日期、币种或依据不完整';
          else if (r.kind === 'terms') { if (!dateOK(r.due)) reason = '变更到期日无效'; }
          else if (!money(r.amount)) reason = '变动金额缺失';
          else if (r.kind === 'cash' && (!dateOK(r.actualAt) || r.actualAt > r.effectiveAt || !r.fundsCompany)) reason = '收付核销缺有效资金日期或资金公司';
          else if (r.original) {
            const original = applied.get(r.original), used = reversed.get(r.original) || 0;
            if (!original || original.kind !== r.kind || original.original || r.amount * original.amount >= 0 || Math.abs(sum([used, r.amount])) > Math.abs(original.amount)) reason = '冲回缺原记录、方向错误或超过原额';
            else reversed.set(r.original, sum([used, r.amount]));
          } else if (r.kind !== 'adjustment' && r.amount < 0) reason = '反向核销缺原记录';
        }
        if (!reason) {
          if (r.kind === 'terms') due = r.due;
          if (r.kind === 'adjustment') adjustments = sum([adjustments, r.amount]);
          if (r.kind === 'cash') cash = sum([cash, r.amount]);
          if (r.kind === 'offset') offset = sum([offset, r.amount]);
          if (r.kind === 'relief') relief = sum([relief, r.amount]);
          applied.set(r.id, r);
        } else if (!reason.includes('不计')) errors.push(reason);
        evidence.push({ ...d, ...r, kindLabel: kinds[r.kind] || '未知变动', inclusion: reason || '纳入' });
      }
      const net = money(d.amount) ? sum([d.amount, adjustments]) : null, settled = sum([cash, offset, relief]);
      const balance = errors.length ? null : sum([net, -settled]);
      const ageDays = dateOK(d.confirmedAt) ? days(q.asOf, d.confirmedAt) : null;
      const overdueDays = dateOK(due) ? Math.max(0, days(q.asOf, due)) : null;
      const status = !money(balance) ? '资料不足' : balance < 0 ? '反向余额待核对' : balance === 0 ? '已结清' : !dateOK(due) ? '到期日待补' : due > q.asOf ? '未到期' : due === q.asOf ? '当日到期' : '已逾期';
      if (!dateOK(due) && balance !== 0) issue(d, d.id, '缺有效到期日，逾期金额未知');
      if (balance < 0) issue(d, d.id, '反向余额单列，不能抵减其他单据待收待付');
      [...new Set(errors)].forEach(message => issue(d, d.id, message));
      allDetails.push({ ...d, docKey, due, originalAmount: d.amount, adjustments, net: errors.length ? null : net, cash: errors.length ? null : cash,
        offset: errors.length ? null : offset, relief: errors.length ? null : relief, settled: errors.length ? null : settled,
        balance, ageDays, overdueDays, overdue: money(balance) && balance > 0 ? overdueDays == null ? null : overdueDays > 0 ? balance : 0 : balance == null ? null : 0,
        status, issue: [...new Set(errors)].join('；') });
    }
    allDetails.filter(d => d.scope === '内部资金清算').forEach(d => {
      const peer = allDetails.find(p => p.docKey === d.peerKey);
      const matched = peer && peer.relation === d.relation && peer.peerKey === d.docKey && peer.company === d.peerCompany && peer.peerCompany === d.company && peer.type !== d.type && peer.currency === d.currency && peer.businessCompany === d.businessCompany && peer.fundsCompany === d.fundsCompany && peer.clearingType === d.clearingType;
      d.peerId = matched ? peer.id : ''; d.peerBalance = matched ? peer.balance : null;
      d.difference = matched && money(d.balance) && money(peer.balance) ? sum([d.balance, -peer.balance]) : null;
      d.pairStatus = !matched ? '对方记录未对应' : d.difference == null ? '双方资料不足' : d.difference === 0 ? '双方余额一致' : '双方余额有差异';
      if (d.pairStatus !== '双方余额一致') issue(d, d.id, d.pairStatus);
    });
    function matches(d, includeStatus = true) {
      if (q.view === 'clearing' ? d.scope !== '内部资金清算' : d.scope === '内部资金清算' || d.type !== (q.view === 'aging' ? q.direction : q.view)) return false;
      if (q.case && d.case !== q.case) return false;
      for (const k of ['company', 'ledger', 'currency', 'customerType', 'channel', 'salesCompany', 'productCompany', 'department', 'store', 'center', 'scope']) if (q[k] && d[k] !== q[k]) return false;
      if (q.order && !(d.order || '').includes(q.order)) return false;
      if (q.party && ![d.party, d.partyId].some(v => (v || '').includes(q.party))) return false;
      for (const [field, start, end] of [['due', 'dueStart', 'dueEnd'], ['confirmedAt', 'confirmedStart', 'confirmedEnd']]) {
        if ((q[start] || q[end]) && (!dateOK(d[field]) || (q[start] && d[field] < q[start]) || (q[end] && d[field] > q[end]))) return false;
      }
      if (includeStatus && q.status && d.status !== q.status) return false;
      return true;
    }
    const details = allDetails.filter(d => matches(d));
    const chosen = new Set(details.map(d => d.docKey));
    const totals = summarize(details, false, q), rows = q.view === 'aging' ? summarize(details, true, q) : details;
    return { q, rows, details, totals, evidence: evidence.filter(r => chosen.has(r.docKey)), exceptions: exceptions.filter(d => matches(d, false)), pending: false,
      notice: '独立验收算例 · 非正式账务 · 截至 ' + q.asOf + ' · 资料截止 ' + q.cutoff.replace('T', ' ') };
  }
  const bucketKeys = ['b0', 'b1', 'b2', 'b3', 'b4', 'notDue', 'dueToday', 'missingDate', 'reverse'];
  function summarize(details, grouped, q) {
    const result = new Map();
    for (const d of details) {
      const group = !grouped ? '' : q.group === 'party' ? d.partyId : q.group === 'channel' ? d.channel : JSON.stringify([d.salesCompany, d.department]);
      const k = JSON.stringify([d.company, d.ledger, d.currency, d.type, d.scope, group]);
      if (!result.has(k)) result.set(k, { company: d.company, ledger: d.ledger, currency: d.currency, type: d.type, scope: d.scope,
        groupLabel: !grouped ? '' : q.group === 'party' ? d.party + ' / ' + d.partyId : q.group === 'channel' ? d.channel || '未归渠道' : [d.salesCompany, d.department].join(' / '),
        count: 0, unknown: 0, overdueUnknown: 0, net: 0, cash: 0, offset: 0, relief: 0, settled: 0, balance: 0, overdue: 0, ...Object.fromEntries(bucketKeys.map(b => [b, 0])) });
      const t = result.get(k); t.count++;
      if (!money(d.balance)) { t.unknown++; continue; }
      ['net', 'cash', 'offset', 'relief', 'settled', 'balance', 'overdue'].forEach(f => t[f] = sum([t[f], d[f]]));
      if (d.balance === 0) continue;
      let bucket;
      if (d.balance < 0) bucket = 'reverse';
      else {
        if (d.overdue == null) t.overdueUnknown++;
        const n = q.ageBasis === 'age' ? d.ageDays : d.overdueDays;
        bucket = n == null ? 'missingDate' : q.ageBasis === 'overdue' && d.due > q.asOf ? 'notDue' : q.ageBasis === 'overdue' && d.due === q.asOf ? 'dueToday' : n <= 30 ? 'b0' : n <= 60 ? 'b1' : n <= 90 ? 'b2' : n <= 180 ? 'b3' : 'b4';
      }
      t[bucket] = sum([t[bucket], d.balance]);
    }
    return [...result.values()].map(t => {
      if (t.unknown === t.count) ['net', 'cash', 'offset', 'relief', 'settled', 'balance', 'overdue', ...bucketKeys].forEach(k => t[k] = null);
      t.coverage = t.unknown ? '仅已知金额；余额缺 ' + t.unknown + ' 笔' : '余额资料齐全';
      if (t.overdueUnknown) t.coverage += '；逾期缺到期日 ' + t.overdueUnknown + ' 笔';
      return t;
    });
  }
  return { defaults, fixture, query, summarize, views, cases, kinds, bucketKeys, key, dateOK, days, sum, money, fmt, esc, csv, sort };
});
