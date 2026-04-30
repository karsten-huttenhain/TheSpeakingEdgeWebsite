/* ═══════════════════════════════════════════════════════════════
   TSE MODULE PAGE — Shared logic for all dashboard module pages
   Each page defines window.TSE_MODULE_DATA before loading this.
   ═══════════════════════════════════════════════════════════════ */

'use strict';

let _session = null;
let _userId  = null;

async function initModulePage() {
  _session = await tseRequireAuth();
  if (!_session) return;
  _userId = _session.user.id;

  // Check course access (free modules skip this)
  if (!TSE_MODULE_DATA.free) {
    const hasAccess = await tseHasCourseAccess(_userId);
    if (!hasAccess) {
      window.location.href = '/dashboard.html';
      return;
    }
  }

  // Load nav user name
  const profile = await tseGetProfile(_userId);
  const el = document.getElementById('navUser');
  if (el) { el.textContent = tseFirstName(profile?.full_name); el.style.display = 'block'; }

  // Load progress
  const progressMap = await tseGetProgress(_userId);
  const isComplete  = progressMap[TSE_MODULE_DATA.id]?.status === 'complete';
  updateCompleteBtn(isComplete);

  // Load journal
  const journal = await tseGetJournal(_userId, TSE_MODULE_DATA.id);
  const journalArea = document.getElementById('journalText');
  if (journalArea && journal?.content) {
    journalArea.value = journal.content;
    updateJournalSaveStatus('saved');
  }

  // Journal auto-save
  if (journalArea) {
    const debouncedSave = tseDebounce(async (val) => {
      updateJournalSaveStatus('saving');
      await tseSaveJournal(_userId, TSE_MODULE_DATA.id, val);
      updateJournalSaveStatus('saved');
    }, 1500);
    journalArea.addEventListener('input', e => {
      updateJournalSaveStatus('unsaved');
      debouncedSave(e.target.value);
    });
  }

  // Show content
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('moduleContent').style.display = 'block';
}

// ── JOURNAL STATUS ────────────────────────────────────────────────────────────
function updateJournalSaveStatus(state) {
  const el = document.getElementById('journalStatus');
  if (!el) return;
  const states = {
    unsaved: { text: 'Unsaved changes',   color: 'var(--steel)' },
    saving:  { text: 'Saving…',           color: 'var(--gold)' },
    saved:   { text: '✓ Saved',           color: '#27AE60' },
  };
  el.textContent  = states[state].text;
  el.style.color  = states[state].color;
}

// ── MARK COMPLETE ─────────────────────────────────────────────────────────────
function updateCompleteBtn(isComplete) {
  const btn = document.getElementById('completeBtn');
  if (!btn) return;
  if (isComplete) {
    btn.textContent = '✓ Module complete';
    btn.style.background = '#27AE60';
    btn.disabled = true;
  }
}

async function markComplete() {
  const btn = document.getElementById('completeBtn');
  btn.disabled = true;
  btn.textContent = 'Saving…';
  const ok = await tseMarkComplete(_userId, TSE_MODULE_DATA.id);
  if (ok) {
    updateCompleteBtn(true);
  } else {
    btn.disabled = false;
    btn.textContent = 'Mark as complete';
  }
}

// ── FILE UPLOAD ───────────────────────────────────────────────────────────────
function handleFileSelect(input) {
  const file = input.files[0];
  if (!file) return;

  const err = tseValidateFile(file);
  if (err) {
    showUploadMessage(err, 'error');
    input.value = '';
    return;
  }

  const sizeLabel = file.size > 1024 * 1024
    ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
    : (file.size / 1024).toFixed(0) + ' KB';

  document.getElementById('uploadFilename').textContent = `${file.name} (${sizeLabel})`;
  document.getElementById('uploadFileInfo').style.display = 'block';
  document.getElementById('uploadSubmitBtn').style.display = 'inline-flex';
  showUploadMessage('', '');
}

async function submitUpload() {
  const input = document.getElementById('fileInput');
  const file  = input.files[0];
  if (!file) return;

  const btn = document.getElementById('uploadSubmitBtn');
  btn.disabled    = true;
  btn.textContent = 'Uploading…';

  const progressBar  = document.getElementById('uploadProgress');
  const progressFill = document.getElementById('uploadProgressFill');
  progressBar.style.display = 'block';

  try {
    await tseUploadSubmission(_userId, TSE_MODULE_DATA.id, file, (evt) => {
      if (evt.loaded && evt.total) {
        const pct = Math.round((evt.loaded / evt.total) * 100);
        progressFill.style.width = pct + '%';
      }
    });
    progressFill.style.width = '100%';
    showUploadMessage('✓ Submission uploaded successfully.', 'success');
    document.getElementById('uploadFileInfo').style.display = 'none';
    btn.style.display = 'none';
    input.value = '';
  } catch (e) {
    showUploadMessage('Upload failed: ' + e.message, 'error');
    btn.disabled    = false;
    btn.textContent = 'Upload submission';
  }

  setTimeout(() => { progressBar.style.display = 'none'; progressFill.style.width = '0%'; }, 2000);
}

function showUploadMessage(msg, type) {
  const el = document.getElementById('uploadMessage');
  if (!el) return;
  el.textContent  = msg;
  el.style.display = msg ? 'block' : 'none';
  el.className = 'upload-message ' + (type || '');
}

// ── START ─────────────────────────────────────────────────────────────────────
initModulePage();
