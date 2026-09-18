const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const repo = path.resolve(__dirname, '..');
let socket;
let sequence = 0;
const pending = new Map();
const browserErrors = [];

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
  return response.result.value;
}

async function waitForReady() {
  await evaluate(`new Promise(resolve => {
    const ready = () => document.readyState === 'complete' && document.querySelector('[data-inventory-no]') ? resolve(true) : setTimeout(ready, 25);
    ready();
  })`);
}

async function open(url) {
  const target = await (await fetch(`http://127.0.0.1:9222/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.method === 'Runtime.exceptionThrown') {
        browserErrors.push(message.params?.exceptionDetails?.exception?.description || message.params?.exceptionDetails?.text || 'browser error');
      }
      if (!message.id || !pending.has(message.id)) return;
      const handler = pending.get(message.id);
      pending.delete(message.id);
      message.error ? handler.reject(message.error) : handler.resolve(message.result);
    };
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await waitForReady();
  return target.id;
}

async function close(targetId) {
  socket.close();
  await fetch(`http://127.0.0.1:9222/json/close/${targetId}`);
}

function createServer() {
  return http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
      const file = path.resolve(repo, `.${pathname}`);
      assert.ok(file.startsWith(repo), 'request must stay inside repository');
      const data = await fs.promises.readFile(file);
      const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(file)] || 'application/octet-stream';
      response.writeHead(200, { 'Content-Type': `${mime}; charset=utf-8` }).end(data);
    } catch (error) {
      response.writeHead(404).end();
    }
  });
}

const groupStateExpression = `(() => {
  const quota = name => document.querySelector('[data-channel-quota="' + name + '"]');
  const quotaState = name => {
    const row = quota(name);
    return {
      status: row.children[1].textContent.trim(),
      allocated: row.children[3].textContent.trim(),
      used: row.querySelector('[data-channel-used]').textContent.trim(),
      available: row.querySelector('[data-channel-available]').textContent.trim()
    };
  };
  const inventory = document.querySelector('[data-inventory-no="OC20240618002"]');
  return {
    agent: quotaState('代理'),
    direct: quotaState('直营'),
    sold: document.getElementById('summarySold').textContent.trim(),
    available: document.getElementById('summaryAvailable').textContent.trim(),
    inventoryQty: inventory.children[2].textContent.trim(),
    inventoryStatus: inventory.children[5].textContent.trim(),
    inventoryAction: inventory.querySelector('[data-release-seat]').textContent.trim(),
    trafficAllocated: document.getElementById('trafficAllocated').textContent.trim(),
    paid: document.querySelector('.schedule-cost-stat-grid .schedule-cost-stat:nth-child(2) strong').textContent.trim()
  };
})()`;

(async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let targetId;

  try {
    targetId = await open(`${base}/merchant/tour/schedules-detail.html?type=group&tab=inventory`);
    const initial = await evaluate(groupStateExpression);
    assert.deepEqual(initial.agent, { status: '停售', allocated: '10人', used: '6', available: '4' });
    assert.equal(initial.inventoryQty, '6人 / 原6人');

    const drawer = await evaluate(`(() => {
      document.querySelector('[data-inventory-no="OC20240618002"] [data-release-seat]').click();
      const rows = [...document.querySelectorAll('#releaseSeatRows tr')];
      return {
        open: document.getElementById('releaseSeatModal').getAttribute('aria-hidden') === 'false',
        orders: rows.map(row => row.querySelector('.schedule-release-record strong').textContent.trim()),
        channels: rows.map(row => row.querySelector('.schedule-release-channel strong').textContent.trim()),
        original: rows.map(row => row.querySelector('[data-release-original]').textContent.trim()),
        remaining: rows.map(row => row.querySelector('[data-release-remaining]').textContent.trim()),
        units: rows.map(row => row.children[3].textContent.trim())
      };
    })()`);
    assert.deepEqual(drawer, {
      open: true,
      orders: ['KS202406180021', 'KS202406180022'],
      channels: ['代理', '代理'],
      original: ['4', '2'],
      remaining: ['4', '2'],
      units: ['人', '人']
    });

    await evaluate(`(() => {
      const row = document.querySelector('#releaseSeatRows tr');
      row.querySelector('[data-release-select]').click();
      row.querySelector('[data-release-qty]').value = '2';
      row.querySelector('[data-release-reason]').value = '订单取消2人';
      document.getElementById('confirmReleaseSeat').click();
      document.getElementById('confirmReleaseSeat').click();
    })()`);
    const released = await evaluate(groupStateExpression);
    assert.deepEqual(released.agent, { status: '停售', allocated: '10人', used: '4', available: '6' });
    assert.deepEqual(released.direct, initial.direct);
    assert.equal(released.sold, '25');
    assert.equal(released.available, '5人');
    assert.equal(released.inventoryQty, '4人 / 原6人');
    assert.equal(released.inventoryStatus, '部分释放');
    assert.equal(released.trafficAllocated, initial.trafficAllocated);
    assert.equal(released.paid, initial.paid);

    await evaluate(`document.querySelector('[data-close-success]').click()`);
    const invalid = await evaluate(`(() => {
      document.querySelector('[data-inventory-no="OC20240618002"] [data-release-seat]').click();
      const row = document.querySelector('#releaseSeatRows tr');
      row.querySelector('[data-release-select]').click();
      const qty = row.querySelector('[data-release-qty]');
      const reason = row.querySelector('[data-release-reason]');
      reason.value = '超量测试';
      qty.value = '5';
      document.getElementById('confirmReleaseSeat').click();
      const over = row.querySelector('[data-release-row-error]').textContent.trim();
      qty.value = '0';
      document.getElementById('confirmReleaseSeat').click();
      const zero = row.querySelector('[data-release-row-error]').textContent.trim();
      qty.value = '-1';
      document.getElementById('confirmReleaseSeat').click();
      const negative = row.querySelector('[data-release-row-error]').textContent.trim();
      qty.value = '1.5';
      document.getElementById('confirmReleaseSeat').click();
      const decimal = row.querySelector('[data-release-row-error]').textContent.trim();
      return { over, zero, negative, decimal };
    })()`);
    assert.match(invalid.over, /最多可释放2人/);
    assert.match(invalid.zero, /正整数/);
    assert.match(invalid.negative, /正整数/);
    assert.match(invalid.decimal, /正整数/);
    assert.deepEqual(await evaluate(groupStateExpression), released);

    const cancelled = await evaluate(`(() => {
      const row = document.querySelector('#releaseSeatRows tr');
      row.querySelector('[data-release-qty]').value = '1';
      row.querySelector('[data-release-reason]').value = '取消测试';
      document.querySelector('#releaseSeatModal [data-close-release]').click();
      document.querySelector('[data-inventory-no="OC20240618002"] [data-release-seat]').click();
      return [...document.querySelectorAll('#releaseSeatRows [data-release-remaining]')].map(item => item.textContent.trim());
    })()`);
    assert.deepEqual(cancelled, ['2', '2']);
    assert.deepEqual(await evaluate(groupStateExpression), released);

    const completed = await evaluate(`(() => {
      const rows = [...document.querySelectorAll('#releaseSeatRows tr')];
      rows.forEach(row => {
        row.querySelector('[data-release-select]').click();
        row.querySelector('[data-release-qty]').value = row.querySelector('[data-release-remaining]').textContent.trim();
        row.querySelector('[data-release-reason]').value = '完成剩余释放';
      });
      document.getElementById('confirmReleaseSeat').click();
      document.querySelector('[data-close-success]').click();
      document.querySelector('[data-inventory-no="OC20240618002"] [data-release-seat]').click();
      const agentRow = document.querySelector('[data-channel-quota="代理"]');
      const inventoryRow = document.querySelector('[data-inventory-no="OC20240618002"]');
      return {
        agentUsed: agentRow.querySelector('[data-channel-used]').textContent.trim(),
        agentAvailable: agentRow.querySelector('[data-channel-available]').textContent.trim(),
        inventoryAction: inventoryRow.querySelector('[data-release-seat]').textContent.trim(),
        submitHidden: document.getElementById('confirmReleaseSeat').hidden,
        remaining: [...document.querySelectorAll('#releaseSeatRows [data-release-remaining]')].map(item => item.textContent.trim())
      };
    })()`);
    assert.equal(completed.agentUsed, '0');
    assert.equal(completed.agentAvailable, '10');
    assert.equal(completed.inventoryAction, '查看');
    assert.equal(completed.submitHidden, true);
    assert.deepEqual(completed.remaining, ['0', '0']);
    await close(targetId);
    targetId = null;

    for (const sample of [
      { type: 'cruise', inventoryNo: 'CB20240701001', unit: '间', marker: '不占舱' },
      { type: 'train', inventoryNo: 'SB20240705001', unit: '铺', marker: '不占铺' }
    ]) {
      targetId = await open(`${base}/merchant/tour/schedules-detail.html?type=${sample.type}&tab=inventory`);
      const result = await evaluate(`(() => {
        const trafficBefore = document.getElementById('trafficAllocated').textContent.trim();
        const paidBefore = document.querySelector('.schedule-cost-stat-grid .schedule-cost-stat:nth-child(2) strong').textContent.trim();
        document.querySelector('[data-inventory-no="${sample.inventoryNo}"] [data-release-seat]').click();
        const rows = [...document.querySelectorAll('#releaseSeatRows tr')];
        const nonOccupying = rows[1];
        const first = rows[0];
        first.querySelector('[data-release-select]').click();
        first.querySelector('[data-release-qty]').value = '1';
        first.querySelector('[data-release-reason]').value = '按实际占用单位释放';
        document.getElementById('confirmReleaseSeat').click();
        return {
          marker: nonOccupying.textContent.trim(),
          disabled: nonOccupying.querySelector('[data-release-select]').disabled,
          original: nonOccupying.querySelector('[data-release-original]').textContent.trim(),
          trafficBefore,
          trafficAfter: document.getElementById('trafficAllocated').textContent.trim(),
          paidBefore,
          paidAfter: document.querySelector('.schedule-cost-stat-grid .schedule-cost-stat:nth-child(2) strong').textContent.trim(),
          inventory: document.querySelector('[data-inventory-no="${sample.inventoryNo}"]').children[2].textContent.trim()
        };
      })()`);
      assert.match(result.marker, new RegExp(sample.marker));
      assert.equal(result.disabled, true);
      assert.equal(result.original, '0');
      assert.equal(result.trafficAfter, result.trafficBefore);
      assert.equal(result.paidAfter, result.paidBefore);
      assert.match(result.inventory, new RegExp(` / 原\\d+${sample.unit}$`));
      await close(targetId);
      targetId = null;
    }

    targetId = await open(`${base}/merchant/tour/schedules-detail.html?type=group&tab=inventory`);
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    const narrow = await evaluate(`(() => {
      document.querySelector('[data-inventory-no="OC20240618002"] [data-release-seat]').click();
      const drawer = document.querySelector('.schedule-release-drawer');
      const submit = document.getElementById('confirmReleaseSeat').getBoundingClientRect();
      return {
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        drawerFits: drawer.getBoundingClientRect().width <= window.innerWidth,
        submitVisible: submit.left >= 0 && submit.right <= window.innerWidth && submit.bottom <= window.innerHeight
      };
    })()`);
    assert.deepEqual(narrow, { horizontalOverflow: false, drawerFits: true, submitVisible: true });
    assert.deepEqual(browserErrors, []);

    console.log(JSON.stringify({
      originalChannelRelease: 'passed',
      duplicateSubmission: 'passed',
      overZeroNegativeValidation: 'passed',
      cancelPreserved: 'passed',
      stoppedChannelPreserved: 'passed',
      cruiseNoBerthRule: 'passed',
      trainNoBerthRule: 'passed',
      procurementAndPaidUnchanged: 'passed',
      narrowScreen: narrow,
      pageErrors: browserErrors.length
    }, null, 2));
  } finally {
    if (targetId) await close(targetId).catch(() => {});
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
