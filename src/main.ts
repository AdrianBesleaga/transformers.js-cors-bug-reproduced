import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>Transformers.js v4 — CORS Reproduction</h1>
    <p>
      <a href="https://github.com/huggingface/transformers.js/issues/1527">#1527</a>
      — CDN <code>wasmPaths</code> + COEP headers breaks local dev servers
    </p>
    <p id="status" style="font-weight:bold; color:#fbbf24;">
      ⏳ Auto-starting pipeline in worker…
    </p>
    <p id="isolation" style="font-size:0.85rem; color:#94a3b8;"></p>
    <pre id="log" style="text-align:left; background:#1a1a2e; padding:1rem; border-radius:8px; max-height:400px; overflow-y:auto; font-size:0.85rem;"></pre>
  </div>
`;

const logEl = document.getElementById('log')!;
const statusEl = document.getElementById('status')!;
const isolationEl = document.getElementById('isolation')!;

// Show cross-origin isolation status
isolationEl.textContent = 'Main page crossOriginIsolated: ' + self.crossOriginIsolated;

function log(msg: string) {
  const line = document.createElement('div');
  line.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
  console.log(msg);
}

log('Creating worker…');

const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

worker.onmessage = (e) => {
  const d = e.data;
  if (d.type === 'config') {
    log('wasmPaths = ' + JSON.stringify(d.wasmPaths));
    log('proxy = ' + d.proxy);
    log('worker crossOriginIsolated = ' + d.crossOriginIsolated);
    return;
  }
  log('Result: ' + JSON.stringify(d));
  if (d.type === 'success') {
    statusEl.textContent = '✅ Pipeline loaded (no CORS error)';
    statusEl.style.color = '#34d399';
  } else {
    statusEl.textContent = '❌ Error: ' + d.message;
    statusEl.style.color = '#f87171';
  }
};

worker.onerror = (e) => {
  log('Worker error: ' + e.message);
  statusEl.textContent = '❌ CORS / Worker Error — see console';
  statusEl.style.color = '#f87171';
};
