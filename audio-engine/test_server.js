const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const engine = require('./dist/index.js');

const PORT = 3333;
const DEFAULT_SONG = 'D:\\Music\\Youtube Music\\Gryffin - Air (feat. Julia Michaels).mp3';

// Ensure scratch directory exists for temporary upload testing
const SCRATCH_DIR = path.join(__dirname, 'scratch');
if (!fs.existsSync(SCRATCH_DIR)) {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
}

let lastUploadedFile = null;

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nora Native Audio Engine — Interactive Tester</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #0b0f14;
      --card-bg: #141b24;
      --card-border: rgba(255, 255, 255, 0.08);
      --accent-green: #38ef7d;
      --accent-glow: rgba(56, 239, 125, 0.3);
      --text-main: #f0f4f8;
      --text-sub: #94a3b8;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: var(--bg-dark);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
    }

    .container {
      width: 100%;
      max-width: 780px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 24px;
      padding: 2.5rem;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--card-border);
    }

    .header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #ffffff, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .badge {
      background: rgba(56, 239, 125, 0.12);
      color: var(--accent-green);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      border: 1px solid rgba(56, 239, 125, 0.3);
    }

    .section { margin-bottom: 1.8rem; }
    label { display: block; font-size: 0.85rem; color: var(--text-sub); margin-bottom: 0.5rem; font-weight: 500; }

    .file-input-group {
      display: flex;
      gap: 10px;
    }

    input[type="text"] {
      flex: 1;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--card-border);
      color: #fff;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 0.95rem;
      font-family: inherit;
      outline: none;
      transition: border 0.2s;
    }
    input[type="text"]:focus { border-color: var(--accent-green); }

    .btn-browse {
      flex: none;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      border-radius: 12px;
      font-size: 0.85rem;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
    }
    .btn-browse:hover { background: rgba(255, 255, 255, 0.16); }

    .controls { display: flex; gap: 1rem; margin-top: 1rem; }
    button {
      flex: 1;
      padding: 14px 20px;
      border-radius: 14px;
      border: none;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
    }
    button:hover { background: rgba(255, 255, 255, 0.12); }
    button.primary {
      background: linear-gradient(135deg, #11998e, #38ef7d);
      color: #000;
      box-shadow: 0 4px 20px var(--accent-glow);
    }
    button.primary:hover { transform: translateY(-2px); }

    .seeker-box {
      margin: 1.8rem 0;
      background: rgba(0, 0, 0, 0.25);
      padding: 1.2rem;
      border-radius: 16px;
      border: 1px solid var(--card-border);
    }

    .time-labels { display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-sub); margin-bottom: 8px; }

    input[type="range"] {
      width: 100%;
      accent-color: var(--accent-green);
      cursor: pointer;
    }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

    .eq-grid {
      display: grid;
      grid-template-columns: repeat(10, 1fr);
      gap: 6px;
      margin-top: 1rem;
    }
    .eq-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .eq-col input[type="range"] {
      writing-mode: bt-lr;
      -webkit-appearance: slider-vertical;
      width: 16px;
      height: 110px;
    }
    .eq-col span { font-size: 0.7rem; color: var(--text-sub); }

    select {
      width: 100%;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--card-border);
      color: #fff;
      padding: 10px 14px;
      border-radius: 12px;
      outline: none;
    }

    .log-console {
      background: #000;
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 10px 14px;
      font-family: monospace;
      font-size: 0.8rem;
      color: #38ef7d;
      height: 90px;
      overflow-y: auto;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Nora Audio Engine Interactive Tester</h1>
      <span class="badge">CPAL + Symphonia Native</span>
    </div>

    <div class="section">
      <label for="filePath">Audio File Path</label>
      <div class="file-input-group">
        <input type="text" id="filePath" value="${DEFAULT_SONG.replace(/\\/g, '\\\\')}">
        <button class="btn-browse" onclick="triggerHtmlFilePicker()">📂 Select File</button>
        <button class="btn-browse" onclick="triggerNativeDialog()">🖥️ Windows Dialog</button>
        <input type="file" id="htmlFilePicker" style="display:none;" accept=".mp3,.flac,.wav,.aac,.m4a,.ogg,.opus" onchange="onHtmlFileSelected(this)">
      </div>
      <div class="controls">
        <button class="primary" onclick="playSong()">▶ Play</button>
        <button onclick="pauseSong()">⏸ Pause</button>
        <button onclick="resumeSong()">▶ Resume</button>
        <button onclick="stopSong()">⏹ Stop</button>
      </div>
    </div>

    <div class="seeker-box">
      <div class="time-labels">
        <span id="currTime">00:00</span>
        <span id="statusLabel">Stopped</span>
        <span id="durTime">00:00</span>
      </div>
      <input type="range" id="seekSlider" min="0" max="100" value="0" step="0.1" onchange="onSeekChange(this.value)">
    </div>

    <div class="grid-2 section">
      <div>
        <label>Volume (<span id="volVal">100</span>%)</label>
        <input type="range" min="0" max="100" value="100" oninput="onVolumeChange(this.value)">
      </div>
      <div>
        <label>Pitch-Preserving Speed Rate (<span id="speedVal">1.0</span>x)</label>
        <select onchange="onSpeedChange(this.value)">
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1.0" selected>1.0x (Normal Pitch)</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2.0">2.0x</option>
        </select>
      </div>
    </div>

    <div class="section">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <label style="margin:0;">10-Band Equalizer (Peaking Filters)</label>
        <button style="flex:none; padding:4px 12px; font-size:0.8rem;" onclick="resetEq()">Reset EQ</button>
      </div>
      <div class="eq-grid">
        <div class="eq-col"><span>60</span><input type="range" min="-12" max="12" value="0" oninput="setEq(60, this.value)"></div>
        <div class="eq-col"><span>170</span><input type="range" min="-12" max="12" value="0" oninput="setEq(170, this.value)"></div>
        <div class="eq-col"><span>310</span><input type="range" min="-12" max="12" value="0" oninput="setEq(310, this.value)"></div>
        <div class="eq-col"><span>600</span><input type="range" min="-12" max="12" value="0" oninput="setEq(600, this.value)"></div>
        <div class="eq-col"><span>1k</span><input type="range" min="-12" max="12" value="0" oninput="setEq(1000, this.value)"></div>
        <div class="eq-col"><span>3k</span><input type="range" min="-12" max="12" value="0" oninput="setEq(3000, this.value)"></div>
        <div class="eq-col"><span>6k</span><input type="range" min="-12" max="12" value="0" oninput="setEq(6000, this.value)"></div>
        <div class="eq-col"><span>12k</span><input type="range" min="-12" max="12" value="0" oninput="setEq(12000, this.value)"></div>
        <div class="eq-col"><span>14k</span><input type="range" min="-12" max="12" value="0" oninput="setEq(14000, this.value)"></div>
        <div class="eq-col"><span>16k</span><input type="range" min="-12" max="12" value="0" oninput="setEq(16000, this.value)"></div>
      </div>
    </div>

    <div>
      <label>Diagnostic Console Log</label>
      <div class="log-console" id="logConsole">Engine ready.</div>
    </div>
  </div>

  <script>
    let isSeeking = false;
    let selectedFileObject = null;

    function logMsg(msg, isErr = false) {
      const consoleEl = document.getElementById('logConsole');
      const time = new Date().toLocaleTimeString();
      const prefix = isErr ? '<span style="color:#ff5555;">[ERR]</span> ' : '<span style="color:#38ef7d;">[LOG]</span> ';
      consoleEl.innerHTML += '<div>[' + time + '] ' + prefix + msg + '</div>';
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }

    function formatTime(secs) {
      if (!secs || isNaN(secs)) return "00:00";
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return String(m).padStart(2, '0') + ":" + String(s).padStart(2, '0');
    }

    async function api(path, body) {
      try {
        const res = await fetch('/api/' + path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body || {})
        });
        const data = await res.json();
        if (data.error) {
          logMsg(path + ' failed: ' + data.error, true);
        }
        return data;
      } catch (err) {
        logMsg(path + ' error: ' + err.message, true);
        return { error: err.message };
      }
    }

    function triggerHtmlFilePicker() {
      document.getElementById('htmlFilePicker').click();
    }

    async function onHtmlFileSelected(input) {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        selectedFileObject = file;
        
        if (file.path) {
          document.getElementById('filePath').value = file.path;
          logMsg('File selected: ' + file.path);
        } else {
          document.getElementById('filePath').value = file.name;
          logMsg('File selected: ' + file.name + ' (' + Math.round(file.size/1024) + ' KB). Uploading file to engine...');
          await uploadAndPlayFile(file);
        }
      }
    }

    async function uploadAndPlayFile(file) {
      try {
        const res = await fetch('/api/upload_play', {
          method: 'POST',
          headers: {
            'x-file-name': encodeURIComponent(file.name)
          },
          body: file
        });
        const data = await res.json();
        if (data.success) {
          logMsg('Uploaded and started playback: ' + data.path);
          if (data.duration) {
            document.getElementById('durTime').innerText = formatTime(data.duration);
          }
        } else {
          logMsg('Upload playback failed: ' + data.error, true);
        }
      } catch (err) {
        logMsg('Upload network error: ' + err.message, true);
      }
    }

    async function triggerNativeDialog() {
      logMsg('Opening Windows Native OpenFileDialog...');
      const data = await api('browse');
      if (data.path) {
        selectedFileObject = null;
        document.getElementById('filePath').value = data.path;
        logMsg('Selected via dialog: ' + data.path);
      }
    }

    async function playSong() {
      if (selectedFileObject && !selectedFileObject.path) {
        logMsg('Playing selected file: ' + selectedFileObject.name);
        await uploadAndPlayFile(selectedFileObject);
        return;
      }

      const path = document.getElementById('filePath').value;
      logMsg('Playing: ' + path);
      const res = await api('play', { path });
      if (res.success) logMsg('Play command sent successfully');
    }

    async function pauseSong() { logMsg('Pausing...'); await api('pause'); }
    async function resumeSong() { logMsg('Resuming...'); await api('resume'); }
    async function stopSong() { logMsg('Stopping...'); await api('stop'); }

    async function onSeekChange(val) {
      isSeeking = false;
      logMsg('Seeking to ' + val + 's');
      await api('seek', { position: parseFloat(val) });
    }

    async function onVolumeChange(val) {
      document.getElementById('volVal').innerText = val;
      await api('volume', { volume: parseFloat(val) / 100.0 });
    }

    async function onSpeedChange(val) {
      document.getElementById('speedVal').innerText = val;
      logMsg('Setting playback speed rate: ' + val + 'x');
      await api('speed', { rate: parseFloat(val) });
    }

    async function setEq(freq, gain) {
      await api('eq', { frequencyHz: parseFloat(freq), gainDb: parseFloat(gain) });
    }

    async function resetEq() {
      const sliders = document.querySelectorAll('.eq-col input');
      sliders.forEach(s => s.value = 0);
      logMsg('Reset EQ to flat 0dB');
      await api('resetEq');
    }

    setInterval(async () => {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        
        if (!isSeeking && data.duration > 0) {
          document.getElementById('seekSlider').max = data.duration;
          document.getElementById('seekSlider').value = data.position;
          document.getElementById('currTime').innerText = formatTime(data.position);
          document.getElementById('durTime').innerText = formatTime(data.duration);
          document.getElementById('statusLabel').innerText = data.isPlaying ? "Playing 🎵" : "Paused ⏸";
        }
      } catch (e) {}
    }, 250);

    document.getElementById('seekSlider').addEventListener('mousedown', () => isSeeking = true);
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML_CONTENT);
    return;
  }

  if (req.method === 'GET' && req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      position: engine.engineGetPosition(),
      duration: engine.engineGetDuration(),
      isPlaying: engine.engineGetDuration() > 0 && engine.engineGetPosition() < engine.engineGetDuration()
    }));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/upload_play') {
    const rawFileName = req.headers['x-file-name'] ? decodeURIComponent(req.headers['x-file-name']) : 'temp_song.mp3';
    const ext = path.extname(rawFileName) || '.mp3';
    const tempFilePath = path.join(SCRATCH_DIR, `temp_uploaded_play${ext}`);

    console.log(`[SERVER] Receiving uploaded file: ${rawFileName} -> saving to ${tempFilePath}`);
    const fileStream = fs.createWriteStream(tempFilePath);
    
    req.pipe(fileStream);

    fileStream.on('finish', () => {
      console.log(`[SERVER] File upload complete (${fs.statSync(tempFilePath).size} bytes). Triggering enginePlay...`);
      try {
        engine.enginePlay(tempFilePath);
        const duration = engine.engineGetDuration();
        console.log(`[SERVER] enginePlay succeeded. Duration: ${duration}s`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, path: tempFilePath, duration }));
      } catch (err) {
        console.error(`[SERVER ERROR] enginePlay failed: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.toString() }));
      }
    });

    fileStream.on('error', (err) => {
      console.error(`[SERVER ERROR] File save error: ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {};

        if (req.url === '/api/browse') {
          console.log('[SERVER] Launching Windows Native OpenFileDialog via PowerShell...');
          const psCommand = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.OpenFileDialog; $f.Filter = 'Audio Files (*.mp3;*.flac;*.wav;*.aac;*.m4a;*.ogg;*.opus)|*.mp3;*.flac;*.wav;*.aac;*.m4a;*.ogg;*.opus'; $f.Title = 'Select Audio File for Nora Engine'; $top = New-Object System.Windows.Forms.Form; $top.TopMost = $true; if ($f.ShowDialog($top) -eq 'OK') { Write-Output $f.FileName }"`;
          exec(psCommand, (err, stdout) => {
            const selectedPath = stdout ? stdout.trim() : '';
            console.log('[SERVER] Dialog returned path:', selectedPath);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ path: selectedPath }));
          });
          return;
        }

        if (req.url === '/api/play') {
          const targetPath = data.path || DEFAULT_SONG;
          console.log(`[SERVER] Playing path: ${targetPath}`);
          engine.enginePlay(targetPath);
          console.log(`[SERVER] Play success. Duration: ${engine.engineGetDuration()}s`);
        } else if (req.url === '/api/pause') {
          console.log('[SERVER] Pause');
          engine.enginePause();
        } else if (req.url === '/api/resume') {
          console.log('[SERVER] Resume');
          engine.engineResume();
        } else if (req.url === '/api/stop') {
          console.log('[SERVER] Stop');
          engine.engineStop();
        } else if (req.url === '/api/seek') {
          console.log(`[SERVER] Seek to ${data.position}s`);
          engine.engineSeek(data.position || 0);
        } else if (req.url === '/api/volume') {
          console.log(`[SERVER] Volume target: ${data.volume}`);
          engine.engineSetVolumeWithRamp(data.volume, 250);
        } else if (req.url === '/api/speed') {
          console.log(`[SERVER] Speed rate: ${data.rate}x`);
          engine.engineSetPlaybackRate(data.rate);
        } else if (req.url === '/api/eq') {
          console.log(`[SERVER] EQ band ${data.frequencyHz}Hz = ${data.gainDb}dB`);
          engine.engineSetEqBand(data.frequencyHz, data.gainDb);
        } else if (req.url === '/api/resetEq') {
          console.log('[SERVER] Reset EQ');
          engine.engineResetEq();
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error(`[SERVER ERROR] ${req.url} failed: ${err.toString()}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.toString() }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Nora Native Audio Engine Interactive Web UI`);
  console.log(`👉 Open your browser at: http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});
