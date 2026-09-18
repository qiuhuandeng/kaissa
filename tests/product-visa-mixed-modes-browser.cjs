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
    const ready = () => document.readyState === 'complete' && document.querySelector('.product-visa-config-section') ? resolve(true) : setTimeout(ready, 25);
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

(async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const failures = [];
  let targetId;

  try {
    targetId = await open(`${base}/merchant/product/product-self-edit.html?type=outbound`);
    const initial = await evaluate(`(() => {
      const line = document.querySelector('.product-visa-config-section [data-line-form-panel="经济款"]');
      const checked = selector => line.querySelector(selector)?.checked;
      return {
        selfLine: checked('[data-product-visa-line-modes] [value="self"]'),
        agencyLine: checked('[data-product-visa-line-modes] [value="agency"]'),
        selfPlan: checked('[data-product-visa-plan-modes] [value="self"]'),
        agencyPlan: checked('[data-product-visa-plan-modes] [value="agency"]')
      };
    })()`);
    assert.deepEqual(initial, { selfLine: true, agencyLine: true, selfPlan: true, agencyPlan: true });
    assert.deepEqual(browserErrors, []);

    const savedDraft = await evaluate(`(() => {
      const line = document.querySelector('.product-visa-config-section [data-line-form-panel="经济款"]');
      const material = [...line.querySelectorAll('[data-product-visa-agency-material] input')].at(-1);
      material.value = '在职证明、资产证明及护照原件';
      material.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('[data-route-save]').click();
      return sessionStorage.getItem('caesar-product-self-visa-outbound');
    })()`);
    assert.match(savedDraft, /在职证明、资产证明及护照原件/);
    await send('Page.reload', { ignoreCache: true });
    await new Promise((resolve) => setTimeout(resolve, 700));
    await waitForReady();
    const restored = await evaluate(`(() => {
      const line = document.querySelector('.product-visa-config-section [data-line-form-panel="经济款"]');
      return {
        self: line.querySelector('[data-product-visa-line-modes] [value="self"]').checked,
        agency: line.querySelector('[data-product-visa-line-modes] [value="agency"]').checked,
        material: [...line.querySelectorAll('[data-product-visa-agency-material] input')].at(-1).value
      };
    })()`);
    assert.deepEqual(restored, { self: true, agency: true, material: '在职证明、资产证明及护照原件' });

    const cancelledLeave = await evaluate(`(() => {
      const line = document.querySelector('.product-visa-config-section [data-line-form-panel="经济款"]');
      const material = [...line.querySelectorAll('[data-product-visa-agency-material] input')].at(-1);
      material.value = '未保存的临时材料';
      material.dispatchEvent(new Event('input', { bubbles: true }));
      line.querySelector('[data-product-visa-line-modes] [value="self"]').click();
      let prompts = 0;
      window.confirm = () => { prompts += 1; return false; };
      const allowed = document.querySelector('[data-confirm-back]').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return {
        allowed,
        prompts,
        stored: sessionStorage.getItem('caesar-product-self-visa-outbound'),
        material: material.value
      };
    })()`);
    assert.equal(cancelledLeave.allowed, false);
    assert.equal(cancelledLeave.prompts, 1);
    assert.equal(cancelledLeave.stored, savedDraft);
    assert.equal(cancelledLeave.material, '未保存的临时材料');
    await send('Page.reload', { ignoreCache: true });
    await new Promise((resolve) => setTimeout(resolve, 700));
    await waitForReady();
    const afterCancelledReload = await evaluate(`(() => {
      const line = document.querySelector('.product-visa-config-section [data-line-form-panel="经济款"]');
      return {
        self: line.querySelector('[data-product-visa-line-modes] [value="self"]').checked,
        material: [...line.querySelectorAll('[data-product-visa-agency-material] input')].at(-1).value
      };
    })()`);
    assert.deepEqual(afterCancelledReload, { self: true, material: '在职证明、资产证明及护照原件' });

    const emptyLine = await evaluate(`(() => {
      const line = document.querySelector('.product-visa-config-section [data-line-form-panel="经济款"]');
      const group = line.querySelector('[data-product-visa-line-modes]');
      group.querySelectorAll('input').forEach(field => { field.checked = false; field.dispatchEvent(new Event('change', { bubbles: true })); });
      document.querySelector('[data-route-submit]').click();
      return {
        modal: document.querySelector('.route-submit-modal').classList.contains('show'),
        error: !group.querySelector('[data-product-visa-mode-error]').hidden
      };
    })()`);
    assert.deepEqual(emptyLine, { modal: false, error: true });

    const emptyPlan = await evaluate(`(() => {
      const line = document.querySelector('.product-visa-config-section [data-line-form-panel="经济款"]');
      line.querySelectorAll('[data-product-visa-line-modes] input').forEach(field => { field.checked = true; field.dispatchEvent(new Event('change', { bubbles: true })); });
      const group = line.querySelector('[data-product-visa-plan-modes]');
      group.querySelectorAll('input').forEach(field => { field.checked = false; field.dispatchEvent(new Event('change', { bubbles: true })); });
      document.querySelector('[data-route-submit]').click();
      return {
        modal: document.querySelector('.route-submit-modal').classList.contains('show'),
        error: !group.querySelector('[data-product-visa-mode-error]').hidden
      };
    })()`);
    assert.deepEqual(emptyPlan, { modal: false, error: true });

    const exempt = await evaluate(`(() => {
      const line = document.querySelector('.product-visa-config-section [data-line-form-panel="经济款"]');
      const policy = line.querySelector('[data-product-visa-policy]');
      policy.value = '免签';
      policy.dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector('[data-route-submit]').click();
      const modal = document.querySelector('.route-submit-modal');
      const result = { modal: modal.classList.contains('show'), modesHidden: line.querySelector('[data-product-visa-line-modes]').closest('.form-group').hidden };
      document.querySelector('[data-close-route-modal]').click();
      result.policyAfterCancel = policy.value;
      return result;
    })()`);
    assert.deepEqual(exempt, { modal: true, modesHidden: true, policyAfterCancel: '免签' });
    await close(targetId);
    targetId = null;

    for (const page of ['product-cruise-edit.html', 'product-train-edit.html', 'product-study-edit.html']) {
      const id = await open(`${base}/merchant/product/${page}`);
      const regression = await evaluate(`({
        checkboxes: document.querySelectorAll('[data-product-visa-mode]').length,
        hasOriginalSelect: [...document.querySelectorAll('.product-visa-config-section select')].some(field => /旅行社代办/.test(field.textContent))
      })`);
      try {
        assert.equal(regression.checkboxes, 0);
        assert.equal(regression.hasOriginalSelect, true);
      } catch (error) {
        failures.push({ page, error: error.message, regression });
      }
      await close(id);
    }

    targetId = await open(`${base}/merchant/product/product-self-edit.html?type=free`);
    const freeTravelRegression = await evaluate(`(() => {
      const line = document.querySelector('.product-visa-config-section [data-line-form-panel="机票+酒店套餐"]');
      return {
        labels: [...line.querySelectorAll('[data-product-visa-line-modes] label')].map(item => item.textContent.trim()),
        checked: line.querySelectorAll('[data-product-visa-line-modes] input:checked').length,
        policy: line.querySelector('[data-product-visa-policy]').value
      };
    })()`);
    assert.deepEqual(freeTravelRegression, {
      labels: ['游客自办', '随团办理'],
      checked: 2,
      policy: '需提前办理'
    });
    await close(targetId);
    targetId = null;

    targetId = await open(`${base}/merchant/product/product-self-edit.html?type=outbound`);
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    const narrow = await evaluate(`(() => {
      window.dispatchEvent(new Event('resize'));
      return {
        modes: document.querySelectorAll('[data-product-visa-mode]').length,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        labels: [...document.querySelectorAll('[data-product-visa-line-modes] label')].map(item => item.textContent.trim()).slice(0, 2)
      };
    })()`);
    assert.equal(narrow.horizontalOverflow, false);
    assert.deepEqual(narrow.labels, ['游客自办', '随团办理']);
    assert.equal(failures.length, 0);
    assert.deepEqual(browserErrors, []);
    console.log(JSON.stringify({
      mixedModes: 'passed',
      emptySelectionBlocked: 'passed',
      materialPreservedAfterReload: 'passed',
      visaExempt: 'passed',
      cancelPreserved: 'passed',
      sharedPageRegressions: 4,
      narrowScreen: narrow,
      pageErrors: browserErrors.length,
      failures
    }, null, 2));
  } finally {
    if (targetId) await close(targetId).catch(() => {});
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
