const API = 'http://localhost:8000';

let selectedFile = null;
let metricsLoaded = false;

/* ── Backend status check ────────────────────────────── */
async function checkBackend() {
  try {
    const res = await fetch(`${API}/`);
    const data = await res.json();
    setStatus(data.model_loaded ? 'green' : 'red', data.model_loaded ? 'model ready' : 'backend offline');
  } catch {
    setStatus('red', 'backend offline');
  }
}

function setStatus(color, text) {
  const dot  = document.getElementById('status-dot');
  const span = document.getElementById('status-text');
  dot.className = `status-dot status-dot--${color}`;
  span.textContent = text;
}

/* ── Tab switching ───────────────────────────────────── */
function switchTab(tab) {
  document.getElementById('tab-detect').style.display  = tab === 'detect'  ? '' : 'none';
  document.getElementById('tab-metrics').style.display = tab === 'metrics' ? '' : 'none';

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('nav-btn--active', btn.dataset.tab === tab);
  });

  if (tab === 'metrics' && !metricsLoaded) loadMetrics();
}

/* ── File handling ───────────────────────────────────── */
function onFileChange(e) {
  const file = e.target.files[0];
  if (file) handleFile(file);
}

function onDragOver(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.add('upload-zone--drag');
}

function onDragLeave() {
  document.getElementById('upload-zone').classList.remove('upload-zone--drag');
}

function onDrop(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.remove('upload-zone--drag');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) handleFile(file);
}

function handleFile(file) {
  selectedFile = file;

  // Clear previous results
  document.getElementById('result-area').style.display = 'none';
  document.getElementById('result-placeholder').style.display = '';
  document.getElementById('result-count').style.display = 'none';
  document.getElementById('error-box').style.display = 'none';

  // Show preview
  const preview = document.getElementById('preview-img');
  preview.src = URL.createObjectURL(file);
  document.getElementById('preview-area').style.display = 'block';
}

/* ── Detection ───────────────────────────────────────── */
async function runDetection() {
  if (!selectedFile) return;

  setLoading(true);
  document.getElementById('error-box').style.display = 'none';

  try {
    const fd = new FormData();
    fd.append('file', selectedFile);

    const res = await fetch(`${API}/detect`, { method: 'POST', body: fd });
    if (!res.ok) throw new Error(`Server error ${res.status}`);

    const data = await res.json();
    showResult(data);
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

function setLoading(on) {
  const zone    = document.getElementById('upload-zone');
  const idle    = document.getElementById('upload-idle');
  const loading = document.getElementById('upload-loading');
  const preview = document.getElementById('preview-area');

  if (on) {
    zone.classList.add('upload-zone--loading');
    idle.style.display    = 'none';
    loading.style.display = 'block';
    preview.style.display = 'none';
  } else {
    zone.classList.remove('upload-zone--loading');
    idle.style.display    = 'block';
    loading.style.display = 'none';
    if (selectedFile) preview.style.display = 'block';
  }
}

function showResult(data) {
  // Show annotated image
  document.getElementById('result-img').src = `data:image/jpeg;base64,${data.image}`;

  // Count label
  const count = document.getElementById('result-count');
  count.textContent = `${data.total} object${data.total !== 1 ? 's' : ''} found`;
  count.style.display = '';

  // Detection badges
  const list = document.getElementById('detections-list');
  list.innerHTML = '';

  if (data.detections.length === 0) {
    list.innerHTML = '<p class="no-detections">No objects detected</p>';
  } else {
    data.detections.forEach((d, i) => {
      const conf    = Math.round(d.confidence * 100);
      const variant = conf > 75 ? 'green' : conf > 50 ? 'amber' : 'red';
      const badge   = document.createElement('div');
      badge.className = `detection-badge detection-badge--${variant} fadein`;
      badge.style.animationDelay = `${i * 0.04}s`;
      badge.innerHTML = `
        <div class="detection-badge__dot detection-badge__dot--${variant}"></div>
        <span class="detection-badge__label">${d.label}</span>
        <span class="detection-badge__conf detection-badge__conf--${variant}">${conf}%</span>
      `;
      list.appendChild(badge);
    });
  }

  document.getElementById('result-placeholder').style.display = 'none';
  document.getElementById('result-area').style.display = '';
}

function showError(msg) {
  const box = document.getElementById('error-box');
  box.textContent = msg;
  box.style.display = '';
}

/* ── Metrics ─────────────────────────────────────────── */
async function loadMetrics() {
  metricsLoaded = true;
  try {
    const res  = await fetch(`${API}/metrics`);
    const data = await res.json();

    const pct = v => typeof v === 'number' ? (v * 100).toFixed(1) + '%' : '—';

    document.getElementById('m-precision').textContent = pct(data.precision);
    document.getElementById('m-recall').textContent    = pct(data.recall);
    document.getElementById('m-map50').textContent     = pct(data.mAP50);
    document.getElementById('m-map5095').textContent   = pct(data.mAP50_95);
    document.getElementById('m-epochs').textContent    = data.epochs  ?? '—';
    document.getElementById('m-boxloss').textContent   = data.box_loss != null ? data.box_loss.toFixed(4) : '—';
    document.getElementById('m-clsloss').textContent   = data.cls_loss != null ? data.cls_loss.toFixed(4) : '—';

    if (data.note) {
      const warn = document.getElementById('metrics-warning');
      warn.textContent    = data.note;
      warn.style.display  = '';
    }
  } catch {
    // leave values as dashes
  } finally {
    document.getElementById('metrics-loading').style.display  = 'none';
    document.getElementById('metrics-content').style.display  = '';
  }
}

/* ── Init ────────────────────────────────────────────── */
checkBackend();