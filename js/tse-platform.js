/* ═══════════════════════════════════════════════════════════════
   TSE PLATFORM — Shared utilities for dashboard and module pages
   Requires: @supabase/supabase-js loaded before this file
   ═══════════════════════════════════════════════════════════════ */

// ── CONFIG — fill in after creating Supabase project ─────────────────────────
const TSE_CONFIG = {
  supabaseUrl:     'https://bkfkupyvwfbposjumcyq.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZmt1cHl2d2ZicG9zanVtY3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTA0NzAsImV4cCI6MjA5MzEyNjQ3MH0.rrRaCKDgwzfvzVjs0W5NGB00WC78Q57XAf_bNGprDHE',
  courseId:        '7c4c6ad1-97a5-4bb1-a214-8a43387119bd',
};
// ─────────────────────────────────────────────────────────────────────────────

const db = window.supabase.createClient(TSE_CONFIG.supabaseUrl, TSE_CONFIG.supabaseAnonKey);

// ── MODULES (database-driven) ─────────────────────────────────────────────────
async function tseGetModules(courseId) {
  const { data } = await db
    .from('modules')
    .select('id, slug, module_number, acronym, theme, title, color, is_free, sort_order')
    .eq('course_id', courseId || TSE_CONFIG.courseId)
    .order('sort_order');
  return data || [];
}

async function tseGetModule(slug, courseId) {
  const { data } = await db
    .from('modules')
    .select('*')
    .eq('course_id', courseId || TSE_CONFIG.courseId)
    .eq('slug', slug)
    .single();
  return data;
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
async function tseGetSession() {
  const { data: { session } } = await db.auth.getSession();
  return session;
}

async function tseRequireAuth() {
  const session = await tseGetSession();
  if (!session) { window.location.href = '/login.html'; return null; }
  return session;
}

async function tseGetProfile(userId) {
  const { data } = await db.from('profiles').select('full_name, role').eq('id', userId).single();
  return data;
}

async function tseHasCourseAccess(userId) {
  const { data } = await db
    .from('course_access')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', TSE_CONFIG.courseId)
    .maybeSingle();
  return !!data;
}

async function tseSignOut() {
  await db.auth.signOut();
  window.location.href = '/index.html';
}

// ── PROGRESS ──────────────────────────────────────────────────────────────────
async function tseGetProgress(userId) {
  const { data } = await db
    .from('progress')
    .select('module_id, status, completed_at')
    .eq('user_id', userId)
    .eq('course_id', TSE_CONFIG.courseId);
  // Return as map: { 'module-id': { status, completed_at } }
  const map = {};
  (data || []).forEach(r => { map[r.module_id] = r; });
  return map;
}

async function tseMarkComplete(userId, moduleId) {
  const { error } = await db.from('progress').upsert({
    user_id: userId,
    course_id: TSE_CONFIG.courseId,
    module_id: moduleId,
    status: 'complete',
    completed_at: new Date().toISOString(),
  }, { onConflict: 'user_id,course_id,module_id' });
  return !error;
}

// ── JOURNAL ───────────────────────────────────────────────────────────────────
async function tseGetJournal(userId, moduleId) {
  const { data } = await db
    .from('journal_entries')
    .select('content, updated_at')
    .eq('user_id', userId)
    .eq('course_id', TSE_CONFIG.courseId)
    .eq('module_id', moduleId)
    .maybeSingle();
  return data;
}

async function tseSaveJournal(userId, moduleId, content) {
  const { error } = await db.from('journal_entries').upsert({
    user_id: userId,
    course_id: TSE_CONFIG.courseId,
    module_id: moduleId,
    content,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,course_id,module_id' });
  return !error;
}

// ── FILE SUBMISSIONS ──────────────────────────────────────────────────────────
const TSE_ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-m4a'];
const TSE_ALLOWED_EXTS  = ['mp4', 'mov', 'mp3', 'm4a', 'wav'];
const TSE_MAX_BYTES     = 500 * 1024 * 1024; // 500 MB

function tseValidateFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!TSE_ALLOWED_EXTS.includes(ext)) {
    return 'File type not accepted. Please upload MP4, MOV, MP3, M4A or WAV.';
  }
  if (file.size > TSE_MAX_BYTES) {
    return 'File is too large. Maximum size is 500 MB.';
  }
  return null;
}

async function tseUploadSubmission(userId, moduleId, file, onProgress) {
  const ext  = file.name.split('.').pop().toLowerCase();
  const path = `${TSE_CONFIG.courseId}/${userId}/${moduleId}/${Date.now()}.${ext}`;

  const { data, error } = await db.storage
    .from('participant-submissions')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      onUploadProgress: onProgress,
    });

  if (error) throw error;

  await db.from('submissions').insert({
    user_id:    userId,
    course_id:  TSE_CONFIG.courseId,
    module_id:  moduleId,
    file_url:   data.path,
    file_type:  ext,
  });

  return data.path;
}

// ── DEBOUNCE ──────────────────────────────────────────────────────────────────
function tseDebounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── FIRST NAME ────────────────────────────────────────────────────────────────
function tseFirstName(fullName) {
  if (!fullName) return 'there';
  return fullName.split(' ')[0];
}
