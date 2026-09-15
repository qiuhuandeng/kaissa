const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');
const repo = path.resolve(__dirname, '..');
const legacy = ['order-report', 'return-report', 'product-report', 'channel-report', 'settlement-report', 'supplier-report', 'overview-report', 'budget-target', 'report-management'];
const standalone = ['finance-cashflow', 'finance-balances', 'finance-prepayments', 'finance-funds', 'finance-invoice-report', 'finance-accounting', 'monthly-profit', 'channel-margin', 'return-finance', 'report-local-preview', 'report-final'];
async function main() {
  const results = [];
  const server = http.createServer(async (req, res) => {
    try {
      const file = path.resolve(repo, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
      if (!file.startsWith(repo + path.sep)) { res.writeHead(403).end(); return; }
      const body = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream' }).end(body);
    } catch { res.writeHead(404).end(); }
  });
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const run = async (name, protocol, base) => {
      let output = '';
      await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [path.join(__dirname, name + '-browser.cjs')], {
          cwd: repo, env: { ...process.env, ...(base ? { REPORT_BASE_URL: base } : {}) }, stdio: ['ignore', 'pipe', 'pipe']
        });
        child.stdout.on('data', b => { output += b; });
        child.stderr.on('data', b => { output += b; });
        child.once('error', reject);
        child.once('exit', code => code === 0 ? resolve() : reject(new Error(name + ' ' + protocol + '\n' + output)));
      });
      results.push({ name, protocol, output });
      console.log('PASS ' + protocol + ': ' + name);
    };
    for (const protocol of ['file', 'http']) {
      const base = protocol === 'file' ? pathToFileURL(repo).href : 'http://127.0.0.1:' + server.address().port;
      for (const name of legacy) await run(name, protocol, base);
    }
    for (const name of standalone) await run(name, 'file+http');
    await fs.mkdir('/private/tmp/caesar-report-regression-qa', { recursive: true });
    await fs.writeFile('/private/tmp/caesar-report-regression-qa/results.json', JSON.stringify(results, null, 2));
    console.log(JSON.stringify({ scriptsPassed: results.length, output: '/private/tmp/caesar-report-regression-qa/results.json' }));
  } finally { await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
