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

// ── WAVEFORM LOGO — injected into .dash-nav-logo anchors on load ──────────────
const _TSE_DASH_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300" width="180" height="36" aria-label="The Speaking Edge">
  <defs><style>
    .nb{transform-origin:center 150px;animation:npulse 1.4s ease-in-out 2 both}
    .nb0{animation-delay:3s;animation-duration:1.6s}.nb1{animation-delay:3.08s;animation-duration:1.5s}
    .nb2{animation-delay:3.16s;animation-duration:1.7s}.nb3{animation-delay:3.24s;animation-duration:1.4s}
    .nb4{animation-delay:3.32s;animation-duration:1.6s}.nb5{animation-delay:3.05s;animation-duration:1.3s}
    .nb6{animation-delay:3.4s;animation-duration:1.5s}.nb7{animation-delay:3.12s;animation-duration:1.8s}
    .nb8{animation-delay:3.48s;animation-duration:1.4s}.nb9{animation-delay:3.2s;animation-duration:1.6s}
    .nb10{animation-delay:3.56s;animation-duration:1.5s}.nb11{animation-delay:3.28s;animation-duration:1.3s}
    .nb12{animation-delay:3.64s;animation-duration:1.7s}.nb13{animation-delay:3.36s;animation-duration:1.4s}
    .nb14{animation-delay:3.1s;animation-duration:1.5s}.nb15{animation-delay:3.44s;animation-duration:1.6s}
    .nb16{animation-delay:3.72s;animation-duration:1.4s}.nb17{animation-delay:3.18s;animation-duration:1.7s}
    .nb18{animation-delay:3.52s;animation-duration:1.5s}.nb19{animation-delay:3.26s;animation-duration:1.3s}
    .nb20{animation-delay:3.6s;animation-duration:1.6s}.nb21{animation-delay:3.34s;animation-duration:1.8s}
    .nb22{animation-delay:3.68s;animation-duration:1.4s}
    @keyframes npulse{0%{transform:scaleY(1);opacity:1}30%{transform:scaleY(1.6);opacity:.9}60%{transform:scaleY(.5);opacity:.65}100%{transform:scaleY(1);opacity:1}}
  </style></defs>
  <g transform="translate(40,150)">
    <rect class="nb nb0"  x="0"   y="-8"   width="12" height="16"  rx="6" fill="#C8392B" opacity=".18"/>
    <rect class="nb nb1"  x="18"  y="-22"  width="12" height="44"  rx="6" fill="#C8392B" opacity=".30"/>
    <rect class="nb nb2"  x="36"  y="-14"  width="12" height="28"  rx="6" fill="#C8392B" opacity=".24"/>
    <rect class="nb nb3"  x="54"  y="-50"  width="12" height="100" rx="6" fill="#C8392B" opacity=".50"/>
    <rect class="nb nb4"  x="72"  y="-22"  width="12" height="44"  rx="6" fill="#C8392B" opacity=".36"/>
    <rect class="nb nb5"  x="90"  y="-90"  width="12" height="180" rx="6" fill="#E8A020"/>
    <rect class="nb nb6"  x="108" y="-38"  width="12" height="76"  rx="6" fill="#C8392B" opacity=".52"/>
    <rect class="nb nb7"  x="126" y="-68"  width="12" height="136" rx="6" fill="#C8392B" opacity=".74"/>
    <rect class="nb nb8"  x="144" y="-28"  width="12" height="56"  rx="6" fill="#C8392B" opacity=".38"/>
    <rect class="nb nb9"  x="162" y="-16"  width="12" height="32"  rx="6" fill="#C8392B" opacity=".26"/>
    <rect class="nb nb10" x="180" y="-34"  width="12" height="68"  rx="6" fill="#C8392B" opacity=".44"/>
    <rect class="nb nb11" x="198" y="-20"  width="12" height="40"  rx="6" fill="#C8392B" opacity=".32"/>
    <rect class="nb nb12" x="216" y="-44"  width="12" height="88"  rx="6" fill="#C8392B" opacity=".54"/>
    <rect class="nb nb13" x="234" y="-26"  width="12" height="52"  rx="6" fill="#C8392B" opacity=".40"/>
    <rect class="nb nb14" x="252" y="-76"  width="12" height="152" rx="6" fill="#E8A020" opacity=".88"/>
    <rect class="nb nb15" x="270" y="-82"  width="12" height="164" rx="6" fill="#C8392B"/>
    <rect class="nb nb16" x="288" y="-54"  width="12" height="108" rx="6" fill="#C8392B" opacity=".68"/>
    <rect class="nb nb17" x="306" y="-62"  width="12" height="124" rx="6" fill="#C8392B" opacity=".76"/>
    <rect class="nb nb18" x="324" y="-36"  width="12" height="72"  rx="6" fill="#C8392B" opacity=".48"/>
    <rect class="nb nb19" x="342" y="-48"  width="12" height="96"  rx="6" fill="#C8392B" opacity=".58"/>
    <rect class="nb nb20" x="360" y="-18"  width="12" height="36"  rx="6" fill="#C8392B" opacity=".28"/>
    <rect class="nb nb21" x="378" y="-28"  width="12" height="56"  rx="6" fill="#C8392B" opacity=".36"/>
    <rect class="nb nb22" x="396" y="-10"  width="12" height="20"  rx="6" fill="#C8392B" opacity=".18"/>
  </g>
</svg>`;

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a.dash-nav-logo').forEach(el => {
    el.innerHTML = _TSE_DASH_LOGO;
    el.style.display = 'flex';
    el.style.alignItems = 'center';
  });
});

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
  if (!session) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return null;
  }
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

// ── GUIDE ACCESS (14-day trial) ───────────────────────────────────────────────
async function tseRequireGuideAccess() {
  const session = await tseRequireAuth();
  if (!session) return null;

  const { data } = await db
    .from('guide_access')
    .select('expires_at')
    .eq('user_id', session.user.id)
    .maybeSingle();

  let expiresAt;

  if (!data) {
    // First visit — start the 14-day trial
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 14);
    expiresAt = expiry.toISOString();
    await db.from('guide_access').insert({ user_id: session.user.id, expires_at: expiresAt });
  } else {
    expiresAt = data.expires_at;
  }

  if (new Date(expiresAt) < new Date()) {
    window.location.href = '/index.html';
    return null;
  }

  return { session, expiresAt };
}

function tseShowGuideBanner(expiresAt) {
  const msPerDay = 86400000;
  const days = Math.ceil((new Date(expiresAt) - new Date()) / msPerDay);
  const msg = days <= 1
    ? 'Your free access expires today.'
    : `Your free access expires in ${days} day${days === 1 ? '' : 's'}.`;
  const banner = document.createElement('div');
  banner.id = 'guide-access-banner';
  banner.innerHTML = msg + ' <a href="/index.html" style="color:#fff;text-decoration:underline;">Learn more &rarr;</a>';
  banner.style.cssText = 'background:#C8392B;color:#fff;text-align:center;padding:8px 16px;font-size:14px;position:fixed;top:64px;left:0;right:0;z-index:850;transition:opacity 0.6s ease;';
  document.body.appendChild(banner);
  setTimeout(function() {
    banner.style.opacity = '0';
    setTimeout(function() { banner.remove(); }, 650);
  }, 6000);
}

// ── COURSE ACCESS (paid, 6-month) ─────────────────────────────────────────────
async function tseRequireCourseAccess() {
  const session = await tseRequireAuth();
  if (!session) return null;

  const { data } = await db
    .from('course_access')
    .select('expires_at')
    .eq('user_id', session.user.id)
    .eq('course_id', TSE_CONFIG.courseId)
    .maybeSingle();

  if (!data) {
    window.location.href = '/workbooks-and-courses.html';
    return null;
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    window.location.href = '/workbooks-and-courses.html';
    return null;
  }

  return { session, expiresAt: data.expires_at };
}

function tseShowCourseBanner(expiresAt) {
  if (!expiresAt) return;
  const msPerDay = 86400000;
  const daysLeft = Math.ceil((new Date(expiresAt) - new Date()) / msPerDay);
  if (daysLeft > 30) return;
  const msg = daysLeft <= 1
    ? 'Your course access expires today.'
    : `Your course access expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`;
  const banner = document.createElement('div');
  banner.id = 'course-access-banner';
  banner.innerHTML = msg + ' <a href="/workbooks-and-courses.html" style="color:#fff;text-decoration:underline;">Renew access &rarr;</a>';
  banner.style.cssText = 'background:#C8392B;color:#fff;text-align:center;padding:8px 16px;font-size:14px;position:fixed;top:64px;left:0;right:0;z-index:850;transition:opacity 0.6s ease;';
  document.body.appendChild(banner);
  setTimeout(function() {
    banner.style.opacity = '0';
    setTimeout(function() { banner.remove(); }, 650);
  }, 6000);
}

// ── COURSE PAGE INIT (auth + profile + progress in one call) ─────────────────
async function tseInitCoursePage(moduleSlug) {
  const access = await tseRequireCourseAccess();
  if (!access) return null;

  const [profile, progress] = await Promise.all([
    tseGetProfile(access.session.user.id),
    tseGetProgress(access.session.user.id),
  ]);

  if (moduleSlug && progress[moduleSlug]?.status !== 'complete') {
    db.from('progress').upsert({
      user_id:   access.session.user.id,
      course_id: TSE_CONFIG.courseId,
      module_id: moduleSlug,
      status:    'in_progress',
    }, { onConflict: 'user_id,course_id,module_id' });
    if (!progress[moduleSlug]) progress[moduleSlug] = {};
    progress[moduleSlug].status = 'in_progress';
  }

  return { session: access.session, expiresAt: access.expiresAt, profile, progress };
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
