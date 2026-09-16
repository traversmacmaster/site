


// This panel and canvas survive the instrument's UI rebuilds during a take.
export function createRecorder(renderOutput) {
  const panel = document.createElement('section');
  panel.className = 'live-recorder';
  panel.innerHTML = `<h3><span>●</span> LIVE RECORD</h3><small>Records clean artwork while you draw</small>
    <div class="record-grid"><label>WIDTH<input id="recordW" type="number" min="256" max="3840" step="2" value="1080"></label><label>HEIGHT<input id="recordH" type="number" min="256" max="3840" step="2" value="1080"></label></div>
    <div class="record-grid"><label>MAX SECONDS<input id="recordDuration" type="number" min="1" max="300" value="30"></label><label>FRAME RATE<select id="recordFps"><option>24</option><option selected>30</option><option>60</option></select></label><label>FILE TYPE<select id="recordFormat"><option value="mp4">MP4</option><option value="webm">WEBM</option></select></label></div>
    <small>MP4/WebM use BACKGROUND COLOR as a solid background. For transparency, export PNG or SVG.</small><button id="recordStart">● START LIVE RECORDING</button><div class="record-grid"><button id="recordPause" disabled>❚❚ PAUSE</button><button id="recordDiscard" disabled>× DISCARD</button></div><progress id="recordProgress" value="0" max="1"></progress><small id="recordStatus" role="status">Ready · press DRAW to animate the pattern.</small>`;
  const $ = id => panel.querySelector(`#${id}`);
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { alpha: false });
  let session = null, busy = false;
  if (!window.spiroDesktop?.saveRecording) {
    $('recordFormat').value = 'webm';
    $('recordFormat').querySelector('[value="mp4"]').disabled = true;
  }
  function controls() {
    panel.querySelectorAll('input,select').forEach(el => { el.disabled = !!session || busy; });
    $('recordStart').disabled = busy;
    $('recordStart').textContent = busy ? '… FINISHING VIDEO' : session ? '■ STOP & SAVE' : '● START LIVE RECORDING';
    $('recordStart').classList.toggle('recording', !!session);
    $('recordPause').disabled = $('recordDiscard').disabled = !session;
    $('recordPause').textContent = session?.paused ? '▶ RESUME' : '❚❚ PAUSE';
  }
  function draw() { renderOutput(ctx, canvas.width, canvas.height); }
  function stop(discard = false) {
    if (!session || session.recorder.state === 'inactive') return;
    session.discard = discard;
    session.recorder.stop();
    session.stream.getTracks().forEach(track => track.stop());
  }
  async function finish(s) {
    session = null; busy = true; controls();
    try {
      if (s.error) throw s.error;
      if (s.discard) { $('recordStatus').textContent = 'Recording discarded.'; return; }
      const blob = new Blob(s.chunks, { type: s.recorder.mimeType || 'video/webm' });
      if (!blob.size) throw Error('No video frames were captured.');
      const stem = `spirofield-live-${s.w}x${s.h}-${s.fps}fps`;
      $('recordStatus').textContent = `Finishing ${s.format.toUpperCase()} · ${s.fps} FPS…`;
      if (window.spiroDesktop?.saveRecording) {
        const result = await window.spiroDesktop.saveRecording({ data: new Uint8Array(await blob.arrayBuffer()), fps: s.fps, format: s.format, defaultName: `${stem}.${s.format}` });
        $('recordStatus').textContent = result ? `Saved ${s.format.toUpperCase()} · ${(result.size / 1048576).toFixed(1)} MB` : 'Save cancelled.';
      } else {
        const url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url; a.download = `${stem}.webm`; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        $('recordStatus').textContent = 'Saved WebM recording.';
      }
    } catch (error) { $('recordStatus').textContent = `Recording failed: ${error.message}`; }
    finally { busy = false; $('recordProgress').value = 0; controls(); }
  }
  $('recordStart').onclick = () => {
    if (session) return stop();
    let stream;
    try {
      if (!window.MediaRecorder || !canvas.captureStream) throw Error('Live recording is not supported on this system.');
      const size = id => Math.round(Math.max(256, Math.min(3840, Number($(id).value) || 1080)) / 2) * 2;
      const w = size('recordW'), h = size('recordH'), fps = Number($('recordFps').value);
      if (w * h * fps > 3840 * 2160 * 30) throw Error('Reduce resolution or frame rate for safe recording.');
      canvas.width = w; canvas.height = h; draw();
      stream = canvas.captureStream(fps);
      const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t));
      const recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: Math.min(40000000, Math.max(6000000, w * h * fps * .22)) });
      const s = { recorder, stream, w, h, fps, format: $('recordFormat').value, duration: Math.max(1, Math.min(300, Number($('recordDuration').value) || 30)) * 1000, start: performance.now(), pausedTotal: 0, paused: false, chunks: [], bytes: 0 };
      recorder.ondataavailable = e => { if (e.data.size) { s.chunks.push(e.data); s.bytes += e.data.size; if (s.bytes > 480 * 1048576) stop(); } };
      recorder.onstop = () => finish(s);
      recorder.onerror = e => { s.error = e.error || Error('Capture failed.'); stop(); };
      recorder.start(250); session = s; controls();
    } catch (error) { stream?.getTracks().forEach(track => track.stop()); $('recordStatus').textContent = error.message; }
  };
  $('recordPause').onclick = () => {
    if (!session) return;
    if (session.paused) { session.pausedTotal += performance.now() - session.pauseStart; session.recorder.resume(); }
    else { session.pauseStart = performance.now(); session.recorder.pause(); }
    session.paused = !session.paused; controls();
  };
  $('recordDiscard').onclick = () => stop(true);
  return {
    mount(parent) { parent.append(panel); },
    frame(state, now) {

      if (!session) return;
      if (!session.paused) draw();
      const elapsed = (session.paused ? session.pauseStart : now) - session.start - session.pausedTotal;
      $('recordProgress').value = elapsed / session.duration;
      $('recordStatus').textContent = `${session.paused ? 'PAUSED' : 'RECORDING LIVE'} · ${(elapsed / 1000).toFixed(1)}s / ${session.duration / 1000}s · ${(session.bytes / 1048576).toFixed(1)} MB`;
      if (elapsed >= session.duration) stop();
    },
  };
}


