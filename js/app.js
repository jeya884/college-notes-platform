// MBA College Notes Platform - Master Frontend Application Controller
// Synchronized with Firebase Firestore and organized by Year & Semester

let currentActiveTab = 'notes';
let selectedTimetableDay = 'Monday';
let selectedYear = 'all';
let selectedSemester = 'all';
let currentActiveDbTable = 'students';

// Cohort Determination Helper (Standardized Rule):
// Roll numbers starting with 26 (e.g. 26MBA01) = 1st Year (Year 1)
// Roll numbers starting with 25 (e.g. 25MBA01) = 2nd Year (Year 2)
function getRollCohort(inputRoll) {
  if (!inputRoll) return { year: 'Year 1', semester: 'Semester 2', label: '1st Year', batch: '2026-2028' };
  const clean = String(inputRoll).trim().toUpperCase();
  if (clean.startsWith('25') || clean.includes('25MBA')) {
    return { year: 'Year 2', semester: 'Semester 4', label: '2nd Year', batch: '2025-2027' };
  }
  if (clean.startsWith('26') || clean.includes('26MBA')) {
    return { year: 'Year 1', semester: 'Semester 2', label: '1st Year', batch: '2026-2028' };
  }
  if (clean.startsWith('24') || clean.includes('24MBA')) {
    return { year: 'Year 2', semester: 'Semester 4', label: '2nd Year (Senior)', batch: '2024-2026' };
  }
  return { year: 'Year 1', semester: 'Semester 2', label: '1st Year', batch: '2026-2028' };
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// Master Multi-Screen Flow Router (Screen 1: Login -> Screen 2: Year Select -> Screen 3: Home)
function showScreen(screenId) {
  const screenLogin = document.getElementById('screenLogin');
  const screenYearSelect = document.getElementById('screenYearSelect');
  const screenHome = document.getElementById('screenHome');

  if (screenLogin) screenLogin.style.display = screenId === 'screenLogin' ? 'block' : 'none';
  if (screenYearSelect) screenYearSelect.style.display = screenId === 'screenYearSelect' ? 'block' : 'none';
  if (screenHome) screenHome.style.display = screenId === 'screenHome' ? 'block' : 'none';

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (screenId === 'screenHome') {
    updateUserUI();
    updateYearSemUI();
    updateAdminYearUI();
    loadTabData(currentActiveTab);
  }
}

function initApp() {
  setupPortalForms();
  setupTabNavigation();
  setupYearSemNavigation();
  setupFilterEvents();
  setupAuthModal();
  setupAdminForms();

  const user = window.API.getCurrentUser();
  const urlParams = new URLSearchParams(window.location.search);
  const forceAdminYear = urlParams.get('admin_year_select') === '1';

  // Deep linking via URL hash (e.g. #admin, #timetable, #assignments)
  const hash = window.location.hash.replace('#', '');
  const tabParam = urlParams.get('tab') || hash;
  if (['notes', 'assignments', 'timetable', 'announcements', 'admin'].includes(tabParam)) {
    currentActiveTab = tabParam;
  }

  // Determine initial screen flow based on user authentication
  if (!user) {
    // Screen 1: User is not logged in -> Display first login form
    showScreen('screenLogin');
  } else if (user.role === 'admin') {
    // Admin user: check if academic year already selected
    const savedAdminYear = localStorage.getItem('mba_admin_year');
    if (forceAdminYear || !savedAdminYear) {
      showScreen('screenYearSelect');
    } else {
      selectedYear = savedAdminYear;
      showScreen('screenHome');
    }
  } else {
    // Student user: display Home directly locked to student's year & semester
    const cohort = getRollCohort(user.rollNumber || user.id);
    selectedYear = cohort.year;
    selectedSemester = cohort.semester;
    showScreen('screenHome');
  }
}

// Portal Form Handlers (Screen 1)
function setupPortalForms() {
  const studentForm = document.getElementById('portalStudentForm');
  const adminForm = document.getElementById('portalAdminForm');
  const alertEl = document.getElementById('portalLoginAlert');

  if (studentForm) {
    studentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const roll = document.getElementById('portalStudentRoll').value.trim();
      const pass = document.getElementById('portalStudentPass').value.trim();

      try {
        const res = await window.API.loginStudent(roll, pass);
        if (alertEl) alertEl.style.display = 'none';

        if (res.user && res.user.role === 'admin') {
          showToast('🛡️ Administrator verified!');
          showScreen('screenYearSelect');
          return;
        }

        const cohort = getRollCohort(res.user?.rollNumber || res.user?.id || roll);
        selectedYear = cohort.year;
        selectedSemester = cohort.semester;
        updateUserUI();
        updateYearSemUI();
        showToast(res.message || `Welcome ${res.user.name || res.user.rollNumber}! (${cohort.year} • ${cohort.label})`);
        showScreen('screenHome');
      } catch (err) {
        if (alertEl) {
          alertEl.style.display = 'block';
          alertEl.style.color = '#dc2626';
          alertEl.textContent = '❌ ' + err.message;
        }
        showToast(err.message, true);
      }
    });
  }

  if (adminForm) {
    adminForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pass = document.getElementById('portalAdminPass').value.trim();

      try {
        await window.API.loginAdmin(pass);
        if (alertEl) alertEl.style.display = 'none';
        showToast('🛡️ Administrator verified! Choose your Academic Year.');
        updateUserUI();
        showScreen('screenYearSelect');
      } catch (err) {
        if (alertEl) {
          alertEl.style.display = 'block';
          alertEl.style.color = '#dc2626';
          alertEl.textContent = '❌ ' + err.message;
        }
        showToast(err.message, true);
      }
    });
  }
}

function switchPortalAuthTab(mode) {
  const tabBtnStudent = document.getElementById('portalTabBtnStudent');
  const tabBtnAdmin = document.getElementById('portalTabBtnAdmin');
  const studentBox = document.getElementById('portalStudentAuthBox');
  const adminBox = document.getElementById('portalAdminAuthBox');
  const alertEl = document.getElementById('portalLoginAlert');

  if (tabBtnStudent) tabBtnStudent.classList.toggle('active', mode === 'student');
  if (tabBtnAdmin) tabBtnAdmin.classList.toggle('active', mode === 'admin');
  if (studentBox) studentBox.style.display = mode === 'student' ? 'block' : 'none';
  if (adminBox) adminBox.style.display = mode === 'admin' ? 'block' : 'none';
  if (alertEl) alertEl.style.display = 'none';
}

function quickFillPortalStudent(roll) {
  const r = document.getElementById('portalStudentRoll');
  const p = document.getElementById('portalStudentPass');
  if (r) r.value = roll;
  if (p) p.value = roll;
}

function quickFillPortalAdmin() {
  const p = document.getElementById('portalAdminPass');
  if (p) p.value = 'MBA Notes';
}

function chooseAdminYear(year) {
  selectedYear = year;
  localStorage.setItem('mba_admin_year', year);
  updateYearSemUI();
  updateAdminYearUI();
  showScreen('screenHome');

  if (year === 'Year 1') {
    showToast('🎓 Switched to First Year (Year 1) Management');
  } else if (year === 'Year 2') {
    showToast('🎯 Switched to Second Year (Year 2) Management');
  } else {
    showToast('🌐 Switched to All Years (Combined) View');
  }

  switchTab('notes');
}

function switchToYearSelectScreen() {
  showScreen('screenYearSelect');
}

// Year & Semester Filter Pill Buttons
function setupYearSemNavigation() {
  updateYearSemUI();
}

function selectAcademicYear(year) {
  selectedYear = year;
  updateYearSemUI();
  updateAdminYearUI();
  loadTabData(currentActiveTab);
}

function selectAcademicSemester(sem) {
  selectedSemester = sem;
  updateYearSemUI();
  loadTabData(currentActiveTab);
}

function updateYearSemUI() {
  document.querySelectorAll('#globalYearPills .pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.year === selectedYear);
  });
  document.querySelectorAll('#globalSemPills .pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sem === selectedSemester);
  });
}

// Admin Year Selection logic ("Go to First Year or Second Year")
function selectAdminYear(year) {
  selectedYear = year;
  closeModal('adminYearSelectModal');
  updateYearSemUI();
  updateAdminYearUI();

  if (year === 'Year 1') {
    showToast('🎓 Switched to First Year (Year 1) Management');
  } else if (year === 'Year 2') {
    showToast('🎯 Switched to Second Year (Year 2) Management');
  } else {
    showToast('🌐 Switched to All Years (Combined) View');
  }

  if (currentActiveTab === 'admin') {
    loadAdminConsole();
  } else {
    loadTabData(currentActiveTab);
  }
}

function updateAdminYearUI() {
  const isAdm = window.API.isAdmin();
  const adminBar = document.getElementById('adminYearBar');
  const activeText = document.getElementById('adminActiveYearText');

  if (adminBar) {
    adminBar.style.display = isAdm ? 'flex' : 'none';
  }

  if (!isAdm) return;

  if (activeText) {
    if (selectedYear === 'Year 1') {
      activeText.textContent = '🎓 First Year (Batch 2025–2027)';
      activeText.style.color = '#a5b4fc';
    } else if (selectedYear === 'Year 2') {
      activeText.textContent = '🎯 Second Year (Final Year 2024–2026)';
      activeText.style.color = '#fde047';
    } else {
      activeText.textContent = '🌐 All Years (Complete Department)';
      activeText.style.color = '#ffffff';
    }
  }

  // Highlight buttons in top admin banner
  const btnY1 = document.getElementById('btnYear1Nav');
  const btnY2 = document.getElementById('btnYear2Nav');
  const btnAll = document.getElementById('btnYearAllNav');
  if (btnY1) {
    btnY1.style.outline = selectedYear === 'Year 1' ? '2px solid #fff' : 'none';
    btnY1.style.boxShadow = selectedYear === 'Year 1' ? '0 0 10px rgba(99,102,241,0.8)' : 'none';
  }
  if (btnY2) {
    btnY2.style.outline = selectedYear === 'Year 2' ? '2px solid #fff' : 'none';
    btnY2.style.boxShadow = selectedYear === 'Year 2' ? '0 0 10px rgba(245,158,11,0.8)' : 'none';
  }
  if (btnAll) {
    btnAll.style.outline = selectedYear === 'all' ? '2px solid #fff' : 'none';
  }

  // Highlight cards in Admin Console Section
  const cardY1 = document.getElementById('adminCardYear1');
  const cardY2 = document.getElementById('adminCardYear2');
  const cardAll = document.getElementById('adminCardYearAll');
  const badgeY1 = document.getElementById('badgeY1Status');
  const badgeY2 = document.getElementById('badgeY2Status');

  if (cardY1) {
    cardY1.style.background = selectedYear === 'Year 1' ? 'rgba(79, 70, 229, 0.35)' : 'rgba(255,255,255,0.08)';
    cardY1.style.borderColor = selectedYear === 'Year 1' ? '#818cf8' : 'rgba(255,255,255,0.2)';
  }
  if (cardY2) {
    cardY2.style.background = selectedYear === 'Year 2' ? 'rgba(217, 119, 6, 0.35)' : 'rgba(255,255,255,0.08)';
    cardY2.style.borderColor = selectedYear === 'Year 2' ? '#fbbf24' : 'rgba(255,255,255,0.2)';
  }
  if (cardAll) {
    cardAll.style.background = selectedYear === 'all' ? 'rgba(71, 85, 105, 0.45)' : 'rgba(255,255,255,0.08)';
    cardAll.style.borderColor = selectedYear === 'all' ? '#cbd5e1' : 'rgba(255,255,255,0.2)';
  }

  if (badgeY1) {
    badgeY1.textContent = selectedYear === 'Year 1' ? '✓ ACTIVE' : 'Year 1';
    badgeY1.style.background = selectedYear === 'Year 1' ? '#10b981' : '#4f46e5';
  }
  if (badgeY2) {
    badgeY2.textContent = selectedYear === 'Year 2' ? '✓ ACTIVE' : 'Year 2';
    badgeY2.style.background = selectedYear === 'Year 2' ? '#10b981' : '#d97706';
  }
}

// User state & Navigation UI
function updateUserUI() {
  const user = window.API.getCurrentUser();
  const authContainer = document.getElementById('navAuthContainer');
  const navAdminTab = document.getElementById('navAdminTab');
  const adminElements = document.querySelectorAll('.admin-only-action');

  updateAdminYearUI();

  if (user) {
    const isAdm = user.role === 'admin';
    navAdminTab.style.display = isAdm ? 'inline-flex' : 'none';
    adminElements.forEach(el => el.style.display = isAdm ? 'inline-flex' : 'none');

    const roleTagClass = isAdm ? 'role-admin' : 'role-student';
    const roleLabel = isAdm ? 'Administrator' : `Roll: ${user.rollNumber}`;
    const userDisplay = isAdm ? '🛡️ Admin' : `👨‍🎓 ${user.rollNumber}`;

    authContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span class="user-role-tag ${roleTagClass}">${roleLabel}</span>
        <span style="font-weight: 700; font-size: 0.88rem; color: #1e1b4b;">${userDisplay}</span>
        <button onclick="handleLogout()" class="btn btn-secondary btn-sm">🚪 Logout</button>
      </div>
    `;

    // Auto-select student's year/sem if student logs in for the first time
    if (!isAdm && user.year && selectedYear === 'all') {
      selectedYear = user.year;
      if (user.semester) selectedSemester = user.semester;
      updateYearSemUI();
    }
  } else {
    navAdminTab.style.display = 'none';
    adminElements.forEach(el => el.style.display = 'none');

    authContainer.innerHTML = `
      <button onclick="openLoginModal('student')" class="btn btn-outline btn-sm">👨‍🎓 Student Login</button>
      <button onclick="openLoginModal('admin')" class="btn btn-primary btn-sm">🛡️ Admin Login</button>
    `;
  }
}

function setupTabNavigation() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      switchTab(target);
    });
  });
}

function switchTab(tabName) {
  if (tabName === 'admin' && !window.API.isAdmin()) {
    showToast('Administrator privileges required. Please sign in.', true);
    openLoginModal('admin');
    return;
  }

  currentActiveTab = tabName;
  window.location.hash = tabName;

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });

  const sections = ['notes', 'assignments', 'timetable', 'announcements', 'admin'];
  sections.forEach(sec => {
    const el = document.getElementById(`section-${sec}`);
    if (el) el.style.display = sec === tabName ? 'block' : 'none';
  });

  loadTabData(tabName);
}

function loadTabData(tabName) {
  switch (tabName) {
    case 'notes':
      loadNotes();
      break;
    case 'assignments':
      loadAssignments();
      break;
    case 'timetable':
      loadTimetable(selectedTimetableDay);
      break;
    case 'announcements':
      loadAnnouncements();
      break;
    case 'admin':
      loadAdminConsole();
      break;
  }
}

// TAB 1: NOTES (Organized by Year and Semester)
async function loadNotes() {
  const container = document.getElementById('notesListContainer');
  const countEl = document.getElementById('notesResultCount');
  container.innerHTML = '<div style="grid-column: 1/-1; padding: 2rem; text-align: center; color: #64748b;">Loading MBA notes...</div>';

  try {
    const search = document.getElementById('noteSearchInput').value;
    const subject = document.getElementById('noteSubjectFilter').value;
    const sort = document.getElementById('noteSortFilter').value;

    const notes = await window.API.fetchNotes({
      search,
      subject,
      year: selectedYear,
      semester: selectedSemester,
      sort
    });

    const yearLabel = selectedYear !== 'all' ? selectedYear : 'All Years';
    const semLabel = selectedSemester !== 'all' ? selectedSemester : 'All Semesters';
    countEl.textContent = `Showing ${notes.length} note(s) for ${yearLabel} &bull; ${semLabel}`;

    if (notes.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; background: white; padding: 3rem; text-align: center; border-radius: var(--radius); border: 1px dashed var(--border);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📚</div>
          <h4 style="font-size: 1.1rem; color: #1e1b4b; font-weight: 700;">No notes found for current selection</h4>
          <p style="color: #64748b; font-size: 0.88rem; margin-top: 0.25rem;">Try choosing "All Years" or "All Semesters", or clear your search term.</p>
        </div>
      `;
      return;
    }

    const isAdmin = window.API.isAdmin();
    container.innerHTML = notes.map(note => `
      <div class="card note-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem;">
          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
            <span class="badge-year">${note.year || 'Year 1'}</span>
            <span class="badge-sem">${note.semester || 'Semester 2'}</span>
            <span class="card-tag">${escapeHtml(note.subject)}</span>
          </div>
          <span style="font-size: 0.75rem; color: #64748b; font-weight: 600;">${note.course_code || 'MBA'}</span>
        </div>

        <h4 class="card-title">${escapeHtml(note.title)}</h4>
        <p class="card-desc">${escapeHtml(note.description || 'Comprehensive lecture notes, case studies, formulas, and syllabus guidelines.')}</p>

        <div style="font-size: 0.78rem; color: #64748b; margin-bottom: 1rem; display: flex; gap: 1rem; flex-wrap: wrap;">
          <span>👤 ${escapeHtml(note.uploaded_by || 'Department Admin')}</span>
          <span>📥 ${note.download_count || 0} downloads</span>
        </div>

        <div class="card-actions">
          <button onclick="handleDownloadNote(${note.id}, '${escapeHtml(note.file_name || 'mba_notes.pdf')}')" class="btn btn-primary" style="flex: 1;">
            📥 Download Notes (PDF)
          </button>
          ${isAdmin ? `
            <button onclick="openEditNoteModal(${note.id})" class="btn btn-outline btn-sm">✏️ Edit</button>
            <button onclick="handleDeleteNote(${note.id})" class="btn btn-danger btn-sm">🗑️</button>
          ` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div style="grid-column: 1/-1; color: #dc2626; padding: 2rem; text-align: center;">Error: ${err.message}</div>`;
  }
}

async function handleDownloadNote(id, fileName) {
  try {
    window.API.downloadNote(id, fileName);
    showToast('Download started successfully!');
    setTimeout(() => {
      if (currentActiveTab === 'notes') loadNotes();
    }, 1500);
  } catch (err) {
    showToast('Download failed: ' + err.message, true);
  }
}

// TAB 2: ASSIGNMENTS (Organized by Year and Semester)
async function loadAssignments() {
  const container = document.getElementById('assignmentsListContainer');
  const countEl = document.getElementById('assignmentsCount');
  container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #64748b;">Loading assignments...</div>';

  try {
    const subject = document.getElementById('assignmentSubjectFilter').value;
    const status = document.getElementById('assignmentStatusFilter').value;

    const assignments = await window.API.fetchAssignments({
      subject,
      status,
      year: selectedYear,
      semester: selectedSemester
    });

    const yearLabel = selectedYear !== 'all' ? selectedYear : 'All Years';
    const semLabel = selectedSemester !== 'all' ? selectedSemester : 'All Semesters';
    countEl.textContent = `${assignments.length} assignment(s) found for ${yearLabel} &bull; ${semLabel}`;

    if (assignments.length === 0) {
      container.innerHTML = `
        <div style="background: white; padding: 3rem; text-align: center; border-radius: var(--radius); border: 1px dashed var(--border);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📝</div>
          <h4 style="font-size: 1.1rem; color: #1e1b4b; font-weight: 700;">No assignments listed for selected filters</h4>
          <p style="color: #64748b; font-size: 0.88rem; margin-top: 0.25rem;">Switch filters or select All Years / All Semesters.</p>
        </div>
      `;
      return;
    }

    const isAdmin = window.API.isAdmin();
    container.innerHTML = assignments.map(a => {
      const isUrgent = a.status === 'Urgent';
      const statusStyle = isUrgent
        ? 'background: #fee2e2; color: #dc2626; border: 1px solid #fecaca;'
        : 'background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;';

      return `
        <div class="card" style="margin-bottom: 1rem; border-left: 4px solid ${isUrgent ? '#dc2626' : '#4338ca'};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
            <div>
              <div style="display: flex; gap: 0.4rem; align-items: center; margin-bottom: 0.4rem; flex-wrap: wrap;">
                <span class="badge-year">${a.year || 'Year 1'}</span>
                <span class="badge-sem">${a.semester || 'Semester 2'}</span>
                <span class="card-tag">${escapeHtml(a.subject)}</span>
                <span style="font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 9999px; ${statusStyle}">
                  ${a.status || 'Open'}
                </span>
              </div>
              <h4 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">
                ${escapeHtml(a.title)}
              </h4>
              <p style="font-size: 0.85rem; color: #475569; margin-bottom: 0.6rem;">
                Faculty: <strong>${escapeHtml(a.faculty || 'Course Instructor')}</strong> &bull; Max Marks: <strong>${a.max_marks || 25}</strong>
              </p>
            </div>

            <div style="text-align: right; background: #f8fafc; padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 700;">Submission Deadline</div>
              <div style="font-size: 1.05rem; font-weight: 800; color: ${isUrgent ? '#dc2626' : '#1e1b4b'};">
                📅 ${a.due_date || 'TBA'}
              </div>
            </div>
          </div>

          <div style="background: #f8fafc; border-radius: 6px; padding: 0.85rem; margin: 0.75rem 0; font-size: 0.88rem; color: #334155; line-height: 1.5;">
            <strong>Brief:</strong> ${escapeHtml(a.description || 'Details specified in lecture session.')}
          </div>

          <div style="font-size: 0.82rem; color: #64748b; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <span>ℹ️ <strong>Instructions:</strong> ${escapeHtml(a.submission_info || 'Submit directly via college LMS or to faculty.')}</span>
            ${isAdmin ? `
              <div style="display: flex; gap: 0.5rem;">
                <button onclick="openEditAssignmentModal(${a.id})" class="btn btn-outline btn-sm">✏️ Edit</button>
                <button onclick="handleDeleteAssignment(${a.id})" class="btn btn-danger btn-sm">🗑️ Delete</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div style="color: #dc2626; padding: 2rem; text-align: center;">Error: ${err.message}</div>`;
  }
}

// TAB 3: TIMETABLE (Day + Year + Semester)
function selectTimetableDay(day) {
  selectedTimetableDay = day;
  document.querySelectorAll('.day-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.day === day);
  });
  loadTimetable(day);
}

async function loadTimetable(day) {
  const container = document.getElementById('timetableSlotsContainer');
  const infoEl = document.getElementById('timetableHeaderInfo');
  container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #64748b;">Loading schedule...</div>';

  try {
    const slots = await window.API.fetchTimetable(day, selectedYear, selectedSemester);
    const yearLabel = selectedYear !== 'all' ? selectedYear : 'All Years';
    const semLabel = selectedSemester !== 'all' ? selectedSemester : 'All Semesters';
    infoEl.textContent = `${slots.length} lecture session(s) scheduled for ${day} &bull; ${yearLabel} &bull; ${semLabel}`;

    if (slots.length === 0) {
      container.innerHTML = `
        <div style="background: white; padding: 3rem; text-align: center; border-radius: var(--radius); border: 1px dashed var(--border);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📅</div>
          <h4 style="font-size: 1.1rem; color: #1e1b4b; font-weight: 700;">No scheduled classes for ${day}</h4>
          <p style="color: #64748b; font-size: 0.88rem; margin-top: 0.25rem;">Switch academic year/semester above or check another day.</p>
        </div>
      `;
      return;
    }

    const isAdmin = window.API.isAdmin();
    container.innerHTML = slots.map(slot => `
      <div class="card" style="margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 1.25rem; flex: 1; min-width: 280px;">
          <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 0.6rem 0.9rem; text-align: center; min-width: 140px;">
            <div style="font-size: 0.72rem; color: #6366f1; text-transform: uppercase; font-weight: 800;">Time Slot</div>
            <div style="font-size: 0.9rem; font-weight: 800; color: #1e1b4b;">⏰ ${slot.time}</div>
          </div>

          <div>
            <div style="display: flex; gap: 0.4rem; align-items: center; margin-bottom: 0.25rem; flex-wrap: wrap;">
              <span class="badge-year">${slot.year || 'Year 1'}</span>
              <span class="badge-sem">${slot.semester || 'Semester 2'}</span>
              <span class="card-tag">${slot.course_code || 'MBA'}</span>
            </div>
            <h4 style="font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 0.2rem;">
              ${escapeHtml(slot.subject)}
            </h4>
            <p style="font-size: 0.82rem; color: #64748b;">
              Faculty: <strong>${escapeHtml(slot.faculty || 'Faculty In-Charge')}</strong> &bull; Hall: <strong style="color: #4338ca;">${escapeHtml(slot.room || 'Hall A-101')}</strong>
            </p>
          </div>
        </div>

        ${isAdmin ? `
          <div style="display: flex; gap: 0.5rem;">
            <button onclick="openEditTimetableModal(${slot.id})" class="btn btn-outline btn-sm">✏️ Edit</button>
            <button onclick="handleDeleteTimetableSlot(${slot.id})" class="btn btn-danger btn-sm">🗑️ Delete</button>
          </div>
        ` : ''}
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div style="color: #dc2626; padding: 2rem; text-align: center;">Error: ${err.message}</div>`;
  }
}

// TAB 4: CAMPUS NOTICE BOARD & COMMUNICATION
async function loadAnnouncements() {
  const container = document.getElementById('announcementsListContainer');
  container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #64748b;">Loading notices...</div>';

  try {
    const list = await window.API.fetchAnnouncements(selectedYear);

    if (list.length === 0) {
      container.innerHTML = `
        <div style="background: white; padding: 3rem; text-align: center; border-radius: var(--radius); border: 1px dashed var(--border);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📢</div>
          <h4 style="font-size: 1.1rem; color: #1e1b4b; font-weight: 700;">No notices published yet</h4>
          <p style="color: #64748b; font-size: 0.88rem;">Department alerts and exam notifications will appear here.</p>
        </div>
      `;
      return;
    }

    const isAdmin = window.API.isAdmin();
    container.innerHTML = list.map(item => {
      const isUrgent = item.priority === 'urgent';
      return `
        <div class="card" style="margin-bottom: 1rem; border-left: 4px solid ${isUrgent ? '#dc2626' : '#0d9488'};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
            <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
              <span class="card-tag" style="background: ${isUrgent ? '#fee2e2' : '#e0e7ff'}; color: ${isUrgent ? '#b91c1c' : '#3730a3'};">
                ${item.category || 'General'}
              </span>
              <span class="badge-year">${item.year || 'All Years'}</span>
              ${isUrgent ? '<span style="background: #dc2626; color: white; font-size: 0.7rem; font-weight: 800; padding: 2px 6px; border-radius: 4px;">URGENT</span>' : ''}
            </div>
            <span style="font-size: 0.8rem; color: #64748b; font-weight: 600;">📅 ${item.date || 'Today'}</span>
          </div>

          <h4 style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">
            ${escapeHtml(item.title)}
          </h4>

          <p style="font-size: 0.9rem; color: #334155; line-height: 1.6; margin-bottom: 0.75rem;">
            ${escapeHtml(item.content)}
          </p>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #64748b;">
            <span>Issued by: <strong>${escapeHtml(item.author || 'MBA Academic Office')}</strong></span>
            ${isAdmin ? `
              <div style="display: flex; gap: 0.4rem;">
                <button onclick="openEditAnnouncementModal(${item.id})" class="btn btn-outline btn-sm">✏️ Edit</button>
                <button onclick="handleDeleteAnnouncement(${item.id})" class="btn btn-danger btn-sm">🗑️ Delete</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div style="color: #dc2626; padding: 2rem; text-align: center;">Error: ${err.message}</div>`;
  }
}

// TAB 5: ADMIN CONSOLE & STUDENT EXTENSION (Synced with Firebase)
async function loadAdminConsole() {
  if (!window.API.isAdmin()) return;

  try {
    const stats = await window.API.fetchAdminStats();
    document.getElementById('statTotalNotes').textContent = stats.totalNotes || 0;
    document.getElementById('statTotalDownloads').textContent = stats.totalDownloads || 0;
    document.getElementById('statTotalStudents').textContent = stats.totalStudents || 0;
    document.getElementById('statBatchRange').textContent = stats.batchRange || '25MBA01 - 25MBA175';

    updateAdminDbCounts(stats);
    refreshCurrentAdminTable();
  } catch (err) {
    showToast('Failed to load admin stats: ' + err.message, true);
  }
}

// Live Database Tables Hub: Independent collections management
function switchDbTable(tableName) {
  currentActiveDbTable = tableName;
  const tables = ['students', 'notes', 'assignments', 'timetable', 'announcements'];

  tables.forEach(t => {
    const capitalized = t.charAt(0).toUpperCase() + t.slice(1);
    const btn = document.getElementById(`tabBtnDb${capitalized}`);
    const view = document.getElementById(`dbView${capitalized}`);
    if (btn) btn.classList.toggle('active', t === tableName);
    if (view) view.style.display = t === tableName ? 'block' : 'none';
  });

  refreshCurrentAdminTable();
}

function refreshCurrentAdminTable() {
  if (currentActiveDbTable === 'students') {
    loadStudentsTable();
  } else if (currentActiveDbTable === 'notes') {
    loadAdminNotesTable();
  } else if (currentActiveDbTable === 'assignments') {
    loadAdminAssignmentsTable();
  } else if (currentActiveDbTable === 'timetable') {
    loadAdminTimetableTable();
  } else if (currentActiveDbTable === 'announcements') {
    loadAdminAnnouncementsTable();
  }
  updateAdminDbCounts();
}

async function updateAdminDbCounts(cachedStats) {
  try {
    const stats = cachedStats || await window.API.fetchAdminStats();
    const elNotes = document.getElementById('countDbNotes');
    const elStudents = document.getElementById('countDbStudents');
    const elAssign = document.getElementById('countDbAssignments');
    const elTime = document.getElementById('countDbTimetable');
    const elAnn = document.getElementById('countDbAnnouncements');

    if (elNotes && stats.totalNotes !== undefined) elNotes.textContent = stats.totalNotes;
    if (elStudents && stats.totalStudents !== undefined) elStudents.textContent = stats.totalStudents;
    if (elAssign && stats.totalAssignments !== undefined) elAssign.textContent = stats.totalAssignments;
    if (elTime && stats.totalTimetableSlots !== undefined) elTime.textContent = stats.totalTimetableSlots;
    if (elAnn && stats.totalAnnouncements !== undefined) elAnn.textContent = stats.totalAnnouncements;
  } catch (e) {
    // Non-blocking count update
  }
}

async function loadAdminNotesTable() {
  const tbody = document.getElementById('dbNotesTableBody');
  const countEl = document.getElementById('dbNotesCount');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 1.5rem; color: #64748b;">Loading notes table from database...</td></tr>';

  try {
    const notes = await window.API.fetchNotes({ year: selectedYear, semester: selectedSemester });
    if (countEl) countEl.textContent = `Showing ${notes.length} note document(s) in collection (Year: ${selectedYear}, Sem: ${selectedSemester})`;

    if (notes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 1.5rem; color: #64748b;">No notes found in database for selected filter.</td></tr>';
      return;
    }

    tbody.innerHTML = notes.map(n => `
      <tr>
        <td><code style="font-size: 0.78rem;">#${n.id}</code></td>
        <td><strong>${escapeHtml(n.title)}</strong></td>
        <td>${escapeHtml(n.subject)} <span style="font-size: 0.75rem; color: #64748b;">(${escapeHtml(n.course_code || 'MBA')})</span></td>
        <td><span class="badge-year">${n.year || 'Year 1'}</span> <span class="badge-sem">${n.semester || 'Semester 2'}</span></td>
        <td><strong style="color: #0d9488;">${n.download_count || 0}</strong></td>
        <td><span style="font-size: 0.8rem; color: #475569;">📄 ${escapeHtml(n.file_name || 'note.pdf')}</span></td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button onclick="openEditNoteModal(${n.id})" class="btn btn-outline btn-sm">✏️</button>
            <button onclick="handleDeleteNote(${n.id})" class="btn btn-danger btn-sm">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: #dc2626; padding: 1.5rem; text-align: center;">Error: ${err.message}</td></tr>`;
  }
}

async function loadAdminAssignmentsTable() {
  const tbody = document.getElementById('dbAssignmentsTableBody');
  const countEl = document.getElementById('dbAssignmentsCount');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 1.5rem; color: #64748b;">Loading assignments table from database...</td></tr>';

  try {
    const assignments = await window.API.fetchAssignments({ year: selectedYear, semester: selectedSemester });
    if (countEl) countEl.textContent = `Showing ${assignments.length} assignment task(s) in collection`;

    if (assignments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 1.5rem; color: #64748b;">No assignments found in database.</td></tr>';
      return;
    }

    tbody.innerHTML = assignments.map(a => {
      const isUrgent = a.status === 'Urgent';
      return `
        <tr>
          <td><code style="font-size: 0.78rem;">#${a.id}</code></td>
          <td><strong>${escapeHtml(a.title)}</strong></td>
          <td>${escapeHtml(a.subject)}</td>
          <td><span class="badge-year">${a.year || 'Year 1'}</span> <span class="badge-sem">${a.semester || 'Semester 2'}</span></td>
          <td><strong style="color: ${isUrgent ? '#dc2626' : '#1e1b4b'};">${a.due_date || 'TBA'}</strong></td>
          <td>
            <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 9999px; ${isUrgent ? 'background: #fee2e2; color: #dc2626;' : 'background: #dcfce7; color: #15803d;'}">
              ${a.status || 'Open'}
            </span>
          </td>
          <td><strong>${a.max_marks || 25}</strong></td>
          <td>
            <div style="display: flex; gap: 0.4rem;">
              <button onclick="openEditAssignmentModal(${a.id})" class="btn btn-outline btn-sm">✏️</button>
              <button onclick="handleDeleteAssignment(${a.id})" class="btn btn-danger btn-sm">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="color: #dc2626; padding: 1.5rem; text-align: center;">Error: ${err.message}</td></tr>`;
  }
}

async function loadAdminTimetableTable() {
  const tbody = document.getElementById('dbTimetableTableBody');
  const countEl = document.getElementById('dbTimetableCount');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 1.5rem; color: #64748b;">Loading timetable table from database...</td></tr>';

  try {
    const slots = await window.API.fetchTimetable('all', selectedYear, selectedSemester);
    if (countEl) countEl.textContent = `Showing ${slots.length} schedule slot(s) in collection`;

    if (slots.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 1.5rem; color: #64748b;">No timetable slots found in database.</td></tr>';
      return;
    }

    tbody.innerHTML = slots.map(s => `
      <tr>
        <td><code style="font-size: 0.78rem;">#${s.id}</code></td>
        <td><strong style="color: #4338ca;">${s.day}</strong></td>
        <td>${s.start_time} - ${s.end_time}</td>
        <td><strong>${escapeHtml(s.subject)}</strong></td>
        <td><span class="badge-year">${s.year || 'Year 1'}</span> <span class="badge-sem">${s.semester || 'Semester 2'}</span></td>
        <td>📍 ${escapeHtml(s.room || 'Hall A')} (${escapeHtml(s.faculty || 'Faculty')})</td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button onclick="openEditTimetableModal(${s.id})" class="btn btn-outline btn-sm">✏️</button>
            <button onclick="handleDeleteTimetableSlot(${s.id})" class="btn btn-danger btn-sm">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: #dc2626; padding: 1.5rem; text-align: center;">Error: ${err.message}</td></tr>`;
  }
}

async function loadAdminAnnouncementsTable() {
  const tbody = document.getElementById('dbAnnouncementsTableBody');
  const countEl = document.getElementById('dbAnnouncementsCount');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 1.5rem; color: #64748b;">Loading announcements table from database...</td></tr>';

  try {
    const list = await window.API.fetchAnnouncements(selectedYear);
    if (countEl) countEl.textContent = `Showing ${list.length} notice(s) in collection`;

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 1.5rem; color: #64748b;">No announcements found in database.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(item => `
      <tr>
        <td><code style="font-size: 0.78rem;">#${item.id}</code></td>
        <td><strong>${escapeHtml(item.title)}</strong></td>
        <td><span class="card-tag">${escapeHtml(item.category || 'Academic')}</span></td>
        <td>
          <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; ${item.priority === 'urgent' ? 'background: #dc2626; color: white;' : 'background: #f1f5f9; color: #475569;'}">
            ${item.priority || 'normal'}
          </span>
        </td>
        <td><span class="badge-year">${item.year || 'All Years'}</span></td>
        <td>${item.date || 'Today'}</td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button onclick="openEditAnnouncementModal(${item.id})" class="btn btn-outline btn-sm">✏️</button>
            <button onclick="handleDeleteAnnouncement(${item.id})" class="btn btn-danger btn-sm">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: #dc2626; padding: 1.5rem; text-align: center;">Error: ${err.message}</td></tr>`;
  }
}

async function loadStudentsTable() {
  const tbody = document.getElementById('studentsTableBody');
  const countEl = document.getElementById('studentRegistryCount');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #64748b;">Loading students registry...</td></tr>';

  try {
    const search = document.getElementById('studentSearchInput').value;
    const res = await window.API.fetchStudents(search, 'all', selectedYear, selectedSemester);

    countEl.textContent = `Showing ${res.filteredCount} of ${res.total} total students`;

    if (res.students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #64748b;">No students found matching search.</td></tr>';
      return;
    }

    tbody.innerHTML = res.students.map(s => {
      const isActive = s.status !== 'inactive';
      return `
        <tr>
          <td><strong style="color: #4338ca; font-size: 0.95rem;">${s.roll_number}</strong></td>
          <td>${escapeHtml(s.name || 'Student')}</td>
          <td><span class="badge-year">${s.year || 'Year 1'}</span> <span class="badge-sem">${s.semester || 'Semester 2'}</span></td>
          <td><code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">${s.roll_number}</code></td>
          <td>
            <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 9999px; ${isActive ? 'background: #dcfce7; color: #15803d;' : 'background: #fee2e2; color: #b91c1c;'}">
              ${isActive ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 0.4rem;">
              <button onclick="handleToggleStudentStatus('${s.roll_number}')" class="btn btn-outline btn-sm">
                ${isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button onclick="handleDeleteStudent('${s.roll_number}')" class="btn btn-danger btn-sm">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color: #dc2626; text-align: center; padding: 2rem;">Error: ${err.message}</td></tr>`;
  }
}

// Student Batch Extensions
async function handleQuickExtend(count) {
  try {
    const res = await window.API.extendStudents(null, count, selectedYear !== 'all' ? selectedYear : 'Year 1', selectedSemester !== 'all' ? selectedSemester : 'Semester 2');
    showToast(res.message);
    loadAdminConsole();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function handleCustomExtend() {
  const val = document.getElementById('extendTargetInput').value.trim();
  if (!val) {
    showToast('Please enter target roll number (e.g. 200)', true);
    return;
  }
  try {
    const res = await window.API.extendStudents(val, null, selectedYear !== 'all' ? selectedYear : 'Year 1', selectedSemester !== 'all' ? selectedSemester : 'Semester 2');
    showToast(res.message);
    document.getElementById('extendTargetInput').value = '';
    loadAdminConsole();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function handleAddSingleStudent(e) {
  e.preventDefault();
  const roll = document.getElementById('singleRollInput').value.trim();
  const name = document.getElementById('singleNameInput').value.trim();
  const year = document.getElementById('singleYearInput').value;
  const sem = document.getElementById('singleSemInput').value;

  try {
    const res = await window.API.addCustomStudent(roll, name, year, sem);
    showToast(res.message);
    document.getElementById('singleRollInput').value = '';
    document.getElementById('singleNameInput').value = '';
    loadAdminConsole();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function handleToggleStudentStatus(roll) {
  try {
    const res = await window.API.toggleStudentStatus(roll);
    showToast(res.message);
    loadStudentsTable();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function handleDeleteStudent(roll) {
  if (!confirm(`Are you sure you want to remove roll number ${roll}?`)) return;
  try {
    const res = await window.API.deleteStudent(roll);
    showToast(res.message);
    loadAdminConsole();
  } catch (err) {
    showToast(err.message, true);
  }
}

// Search and Filter Listeners
function setupFilterEvents() {
  const noteSearch = document.getElementById('noteSearchInput');
  const noteSubject = document.getElementById('noteSubjectFilter');
  const noteSort = document.getElementById('noteSortFilter');

  if (noteSearch) noteSearch.addEventListener('input', debounce(loadNotes, 300));
  if (noteSubject) noteSubject.addEventListener('change', loadNotes);
  if (noteSort) noteSort.addEventListener('change', loadNotes);

  const assignSubject = document.getElementById('assignmentSubjectFilter');
  const assignStatus = document.getElementById('assignmentStatusFilter');
  if (assignSubject) assignSubject.addEventListener('change', loadAssignments);
  if (assignStatus) assignStatus.addEventListener('change', loadAssignments);

  const studentSearch = document.getElementById('studentSearchInput');
  if (studentSearch) studentSearch.addEventListener('input', debounce(loadStudentsTable, 300));
}

// Authentication Handlers
function setupAuthModal() {
  const studentForm = document.getElementById('studentLoginForm');
  const adminForm = document.getElementById('adminLoginForm');

  if (studentForm) {
    studentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const roll = document.getElementById('studentRollInput').value.trim();
      const pass = document.getElementById('studentPassInput').value.trim();
      try {
        const res = await window.API.loginStudent(roll, pass);
        closeModal('loginModal');
        updateUserUI();
        if (res.user && res.user.role === 'admin') {
          showToast('🛡️ Administrator verified! Choose your Academic Year.');
          openModal('adminYearSelectModal');
          return;
        }
        showToast(res.message || `Welcome ${res.user.name || res.user.rollNumber}!`);
        loadTabData(currentActiveTab);
      } catch (err) {
        showToast(err.message, true);
      }
    });
  }

  if (adminForm) {
    adminForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pass = document.getElementById('adminPassInput').value.trim();
      try {
        const res = await window.API.loginAdmin(pass);
        showToast('🛡️ Administrator verified! Choose your Academic Year.');
        closeModal('loginModal');
        updateUserUI();
        openModal('adminYearSelectModal');
      } catch (err) {
        showToast(err.message, true);
      }
    });
  }
}

function handleLogout() {
  window.API.logout();
}

function openLoginModal(mode = 'student') {
  switchAuthTab(mode);
  openModal('loginModal');
}

function switchAuthTab(mode) {
  document.querySelectorAll('.auth-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.authTab === mode);
  });
  document.getElementById('studentAuthSection').style.display = mode === 'student' ? 'block' : 'none';
  document.getElementById('adminAuthSection').style.display = mode === 'admin' ? 'block' : 'none';
}

function quickFillStudent(roll) {
  document.getElementById('studentRollInput').value = roll;
  document.getElementById('studentPassInput').value = roll;
}

function quickFillAdmin() {
  document.getElementById('adminPassInput').value = 'MBA Notes';
}

// Modal Form Setup for Admin CRUD Operations
function setupAdminForms() {
  // Notes Modal Form
  const noteForm = document.getElementById('noteModalForm');
  if (noteForm) {
    noteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('noteModalId').value;
      const title = document.getElementById('noteModalTitle').value;
      const subject = document.getElementById('noteModalSubject').value;
      const course_code = document.getElementById('noteModalCourseCode').value;
      const year = document.getElementById('noteModalYear').value;
      const semester = document.getElementById('noteModalSemester').value;
      const description = document.getElementById('noteModalDesc').value;
      const fileInput = document.getElementById('noteModalFile');

      try {
        if (id) {
          await window.API.updateNote(id, { title, subject, course_code, year, semester, description });
          showToast('MBA Note updated and synced to Firebase!');
        } else {
          const formData = new FormData();
          formData.append('title', title);
          formData.append('subject', subject);
          formData.append('course_code', course_code);
          formData.append('year', year);
          formData.append('semester', semester);
          formData.append('description', description);
          if (fileInput.files[0]) formData.append('file', fileInput.files[0]);

          await window.API.createNote(formData);
          showToast('MBA Note uploaded and synced to Firebase!');
        }
        closeModal('noteModal');
        loadNotes();
      } catch (err) {
        showToast(err.message, true);
      }
    });
  }

  // Assignment Modal Form
  const assignForm = document.getElementById('assignmentModalForm');
  if (assignForm) {
    assignForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('assignModalId').value;
      const payload = {
        title: document.getElementById('assignModalTitle').value,
        subject: document.getElementById('assignModalSubject').value,
        faculty: document.getElementById('assignModalFaculty').value,
        year: document.getElementById('assignModalYear').value,
        semester: document.getElementById('assignModalSemester').value,
        due_date: document.getElementById('assignModalDueDate').value,
        max_marks: document.getElementById('assignModalMarks').value,
        status: document.getElementById('assignModalStatus').value,
        description: document.getElementById('assignModalDesc').value,
        submission_info: document.getElementById('assignModalSubInfo').value
      };

      try {
        if (id) {
          await window.API.updateAssignment(id, payload);
          showToast('Assignment updated in Firebase!');
        } else {
          await window.API.createAssignment(payload);
          showToast('Assignment created in Firebase!');
        }
        closeModal('assignmentModal');
        loadAssignments();
      } catch (err) {
        showToast(err.message, true);
      }
    });
  }

  // Timetable Modal Form
  const timetableForm = document.getElementById('timetableModalForm');
  if (timetableForm) {
    timetableForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('slotModalId').value;
      const payload = {
        day: document.getElementById('slotModalDay').value,
        time: document.getElementById('slotModalTime').value,
        year: document.getElementById('slotModalYear').value,
        semester: document.getElementById('slotModalSemester').value,
        subject: document.getElementById('slotModalSubject').value,
        course_code: document.getElementById('slotModalCourseCode').value,
        faculty: document.getElementById('slotModalFaculty').value,
        room: document.getElementById('slotModalRoom').value
      };

      try {
        if (id) {
          await window.API.updateTimetableSlot(id, payload);
          showToast('Schedule slot updated in Firebase!');
        } else {
          await window.API.createTimetableSlot(payload);
          showToast('Schedule slot saved to Firebase!');
        }
        closeModal('timetableModal');
        loadTimetable(selectedTimetableDay);
      } catch (err) {
        showToast(err.message, true);
      }
    });
  }

  // Announcement Modal Form
  const noticeForm = document.getElementById('announcementModalForm');
  if (noticeForm) {
    noticeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('noticeModalId').value;
      const payload = {
        title: document.getElementById('noticeModalTitle').value,
        year: document.getElementById('noticeModalYear').value,
        category: document.getElementById('noticeModalCategory').value,
        priority: document.getElementById('noticeModalPriority').value,
        author: document.getElementById('noticeModalAuthor').value,
        content: document.getElementById('noticeModalContent').value
      };

      try {
        if (id) {
          await window.API.updateAnnouncement(id, payload);
          showToast('Notice updated in Firebase!');
        } else {
          await window.API.createAnnouncement(payload);
          showToast('Notice published to Firebase!');
        }
        closeModal('announcementModal');
        loadAnnouncements();
      } catch (err) {
        showToast(err.message, true);
      }
    });
  }
}

// Modal Opening Helpers
function openCreateNoteModal() {
  document.getElementById('noteModalHeading').textContent = 'Upload MBA Note';
  document.getElementById('noteModalForm').reset();
  document.getElementById('noteModalId').value = '';
  document.getElementById('noteModalYear').value = selectedYear !== 'all' ? selectedYear : 'Year 1';
  document.getElementById('noteModalSemester').value = selectedSemester !== 'all' ? selectedSemester : 'Semester 2';
  openModal('noteModal');
}

async function openEditNoteModal(id) {
  try {
    const note = await window.API.getNote(id);
    document.getElementById('noteModalHeading').textContent = 'Edit MBA Note';
    document.getElementById('noteModalId').value = note.id;
    document.getElementById('noteModalTitle').value = note.title;
    document.getElementById('noteModalSubject').value = note.subject;
    document.getElementById('noteModalCourseCode').value = note.course_code || '';
    document.getElementById('noteModalYear').value = note.year || 'Year 1';
    document.getElementById('noteModalSemester').value = note.semester || 'Semester 2';
    document.getElementById('noteModalDesc').value = note.description || '';
    openModal('noteModal');
  } catch (err) {
    showToast(err.message, true);
  }
}

async function handleDeleteNote(id) {
  if (!confirm('Are you sure you want to delete this study note?')) return;
  try {
    await window.API.deleteNote(id);
    showToast('Note deleted from Firebase!');
    loadNotes();
  } catch (err) {
    showToast(err.message, true);
  }
}

function openCreateAssignmentModal() {
  document.getElementById('assignModalHeading').textContent = 'Create Course Assignment';
  document.getElementById('assignmentModalForm').reset();
  document.getElementById('assignModalId').value = '';
  document.getElementById('assignModalYear').value = selectedYear !== 'all' ? selectedYear : 'Year 1';
  document.getElementById('assignModalSemester').value = selectedSemester !== 'all' ? selectedSemester : 'Semester 2';
  openModal('assignmentModal');
}

async function openEditAssignmentModal(id) {
  try {
    const list = await window.API.fetchAssignments();
    const item = list.find(a => String(a.id) === String(id));
    if (!item) return;

    document.getElementById('assignModalHeading').textContent = 'Edit Assignment';
    document.getElementById('assignModalId').value = item.id;
    document.getElementById('assignModalTitle').value = item.title;
    document.getElementById('assignModalSubject').value = item.subject;
    document.getElementById('assignModalFaculty').value = item.faculty || '';
    document.getElementById('assignModalYear').value = item.year || 'Year 1';
    document.getElementById('assignModalSemester').value = item.semester || 'Semester 2';
    document.getElementById('assignModalDueDate').value = item.due_date || '';
    document.getElementById('assignModalMarks').value = item.max_marks || 25;
    document.getElementById('assignModalStatus').value = item.status || 'Open';
    document.getElementById('assignModalDesc').value = item.description || '';
    document.getElementById('assignModalSubInfo').value = item.submission_info || '';
    openModal('assignmentModal');
  } catch (err) {
    showToast(err.message, true);
  }
}

async function handleDeleteAssignment(id) {
  if (!confirm('Are you sure you want to delete this assignment?')) return;
  try {
    await window.API.deleteAssignment(id);
    showToast('Assignment deleted from Firebase!');
    loadAssignments();
  } catch (err) {
    showToast(err.message, true);
  }
}

function openCreateTimetableModal() {
  document.getElementById('slotModalHeading').textContent = 'Add Class Schedule Slot';
  document.getElementById('timetableModalForm').reset();
  document.getElementById('slotModalId').value = '';
  document.getElementById('slotModalDay').value = selectedTimetableDay;
  document.getElementById('slotModalYear').value = selectedYear !== 'all' ? selectedYear : 'Year 1';
  document.getElementById('slotModalSemester').value = selectedSemester !== 'all' ? selectedSemester : 'Semester 2';
  openModal('timetableModal');
}

async function openEditTimetableModal(id) {
  try {
    const slots = await window.API.fetchTimetable('all');
    const slot = slots.find(s => String(s.id) === String(id));
    if (!slot) return;

    document.getElementById('slotModalHeading').textContent = 'Edit Class Slot';
    document.getElementById('slotModalId').value = slot.id;
    document.getElementById('slotModalDay').value = slot.day;
    document.getElementById('slotModalTime').value = slot.time;
    document.getElementById('slotModalYear').value = slot.year || 'Year 1';
    document.getElementById('slotModalSemester').value = slot.semester || 'Semester 2';
    document.getElementById('slotModalSubject').value = slot.subject;
    document.getElementById('slotModalCourseCode').value = slot.course_code || '';
    document.getElementById('slotModalFaculty').value = slot.faculty || '';
    document.getElementById('slotModalRoom').value = slot.room || '';
    openModal('timetableModal');
  } catch (err) {
    showToast(err.message, true);
  }
}

async function handleDeleteTimetableSlot(id) {
  if (!confirm('Are you sure you want to delete this schedule slot?')) return;
  try {
    await window.API.deleteTimetableSlot(id);
    showToast('Schedule slot removed from Firebase!');
    loadTimetable(selectedTimetableDay);
  } catch (err) {
    showToast(err.message, true);
  }
}

function openCreateAnnouncementModal() {
  document.getElementById('noticeModalHeading').textContent = 'Post Campus Notice';
  document.getElementById('announcementModalForm').reset();
  document.getElementById('noticeModalId').value = '';
  document.getElementById('noticeModalYear').value = selectedYear !== 'all' ? selectedYear : 'All Years';
  openModal('announcementModal');
}

async function openEditAnnouncementModal(id) {
  try {
    const list = await window.API.fetchAnnouncements();
    const item = list.find(a => String(a.id) === String(id));
    if (!item) return;

    document.getElementById('noticeModalHeading').textContent = 'Edit Notice';
    document.getElementById('noticeModalId').value = item.id;
    document.getElementById('noticeModalTitle').value = item.title;
    document.getElementById('noticeModalYear').value = item.year || 'All Years';
    document.getElementById('noticeModalCategory').value = item.category || 'Academic';
    document.getElementById('noticeModalPriority').value = item.priority || 'normal';
    document.getElementById('noticeModalAuthor').value = item.author || '';
    document.getElementById('noticeModalContent').value = item.content || '';
    openModal('announcementModal');
  } catch (err) {
    showToast(err.message, true);
  }
}

async function handleDeleteAnnouncement(id) {
  if (!confirm('Are you sure you want to delete this notice?')) return;
  try {
    await window.API.deleteAnnouncement(id);
    showToast('Notice deleted from Firebase!');
    loadAnnouncements();
  } catch (err) {
    showToast(err.message, true);
  }
}

// Utility Helpers
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

function showToast(message, isError = false) {
  const t = document.getElementById('toastNotification');
  if (!t) return;
  t.textContent = message;
  t.className = isError ? 'error active' : 'active';
  setTimeout(() => {
    t.className = '';
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function debounce(fn, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Global modal background click close
window.onclick = function (event) {
  if (event.target.classList.contains('modal-overlay')) {
    event.target.classList.remove('active');
  }
};

window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.showScreen = showScreen;
window.switchPortalAuthTab = switchPortalAuthTab;
window.quickFillPortalStudent = quickFillPortalStudent;
window.quickFillPortalAdmin = quickFillPortalAdmin;
window.chooseAdminYear = chooseAdminYear;
window.switchToYearSelectScreen = switchToYearSelectScreen;
window.switchDbTable = switchDbTable;
window.refreshCurrentAdminTable = refreshCurrentAdminTable;
window.loadAdminNotesTable = loadAdminNotesTable;
window.loadAdminAssignmentsTable = loadAdminAssignmentsTable;
window.loadAdminTimetableTable = loadAdminTimetableTable;
window.loadAdminAnnouncementsTable = loadAdminAnnouncementsTable;
window.selectAdminYear = selectAdminYear;
window.selectAcademicYear = selectAcademicYear;
window.selectAcademicSemester = selectAcademicSemester;
window.openLoginModal = openLoginModal;
window.switchAuthTab = switchAuthTab;
window.switchTab = switchTab;
window.quickFillStudent = quickFillStudent;
window.quickFillAdmin = quickFillAdmin;
window.handleLogout = handleLogout;
window.handleQuickExtend = handleQuickExtend;
window.handleCustomExtend = handleCustomExtend;
window.handleAddSingleStudent = handleAddSingleStudent;
window.handleToggleStudentStatus = handleToggleStudentStatus;
window.handleDeleteStudent = handleDeleteStudent;

// Note modal handlers & aliases
window.openCreateNoteModal = openCreateNoteModal;
window.openAddNoteModal = openCreateNoteModal;
window.openEditNoteModal = openEditNoteModal;
window.handleDeleteNote = handleDeleteNote;
window.handleDownloadNote = handleDownloadNote;

// Assignment modal handlers & aliases
window.openCreateAssignmentModal = openCreateAssignmentModal;
window.openAddAssignmentModal = openCreateAssignmentModal;
window.openEditAssignmentModal = openEditAssignmentModal;
window.handleDeleteAssignment = handleDeleteAssignment;

// Timetable modal handlers & aliases
window.openCreateTimetableModal = openCreateTimetableModal;
window.openAddSlotModal = openCreateTimetableModal;
window.openEditTimetableModal = openEditTimetableModal;
window.openEditSlotModal = openEditTimetableModal;
window.handleDeleteTimetableSlot = handleDeleteTimetableSlot;
window.handleDeleteSlot = handleDeleteTimetableSlot;
window.selectTimetableDay = selectTimetableDay;

// Announcement modal handlers & aliases
window.openCreateAnnouncementModal = openCreateAnnouncementModal;
window.openAddAnnouncementModal = openCreateAnnouncementModal;
window.openEditAnnouncementModal = openEditAnnouncementModal;
window.handleDeleteAnnouncement = handleDeleteAnnouncement;
