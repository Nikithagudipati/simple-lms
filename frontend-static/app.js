



/* Fixed and reconstructed app.js
   - Restores missing/truncated logic from the uploaded project
   - Keeps original IDs and integration points untouched
   - Adds: timed quizzes (auto-submit), 1-hour inactivity logout,
           daily streak, due quizzes, admin user view, instructor submissions
   - Persists to localStorage using lms_v3_* keys like original
*/


const API_BASE = "http://localhost:5000/api";


(() => {
  const KEY_USERS = 'lms_v3_users';
  const KEY_COURSES = 'lms_v3_courses';
  const KEY_CURRENT = 'lms_v3_current';
  const KEY_TIMERS = 'lms_v3_timers';
  const KEY_MARKS = 'lms_v3_marks';
  const KEY_STREAK = 'lms_v3_streak';

  // 1 hour inactivity timeout
  const INACTIVITY_TIMEOUT_MS = 1 * 60 * 60 * 1000;

  const defaultUsers = [
    { username: 'admin', email: 'admin@lms.test', password: '123', role: 'admin', name: 'Admin User', enrollments: [] },
    { username: 'instructor', email: 'instructor@lms.test', password: '123', role: 'instructor', name: 'Instructor One', enrollments: [] },
    { username: 'student', email: 'student@lms.test', password: '123', role: 'student', name: 'Student One', enrollments: [] }
  ];

  const defaultCourses = [
    {
      id: 1, title: 'Web Development Basics', desc: 'HTML/CSS/JS fundamentals', level: 'beginner', instructor: 'Instructor One', materials: ['Intro.pdf'], quizzes: [
        { id: 1001, title: 'Intro Quiz', questions: [{ q: 'HTML stands for?', opts: ['HyperText Markup Language', 'Hi'], a: 0 }], duration: 120, submissions: {} }
      ]
    },
    { id: 2, title: 'Data Structures', desc: 'Arrays, Trees, Graphs', level: 'advanced', instructor: 'Instructor One', materials: ['DS.pdf'], quizzes: [] },
  ];

  function load(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
  }
  function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

  let users = load(KEY_USERS, defaultUsers.slice());
  let courses = load(KEY_COURSES, defaultCourses.slice());
  let current = load(KEY_CURRENT, null);
  let timers = load(KEY_TIMERS, {});
  let marks = load(KEY_MARKS, {});
  let streaks = load(KEY_STREAK, {});

  /* ---------- DOM refs ---------- */
  const refs = {
    navCatalog: document.getElementById('navCatalog'),
    navDashboard: document.getElementById('navDashboard'),
    navCreate: document.getElementById('navCreate'),
    roleBadge: document.getElementById('roleBadge'),
    btnLogout: document.getElementById('btnLogout'),

    loginCard: document.getElementById('loginCard'),
    loginForm: document.getElementById('loginForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    loginError: document.getElementById('loginError'),

    catalogPage: document.getElementById('catalogPage'),
    coursesGrid: document.getElementById('coursesGrid'),
    searchCourse: document.getElementById('searchCourse'),
    filterLevel: document.getElementById('filterLevel'),

    courseDetailPage: document.getElementById('courseDetailPage'),
    detailTitle: document.getElementById('detailTitle'),
    detailInstructor: document.getElementById('detailInstructor'),
    detailMaterials: document.getElementById('detailMaterials'),
    enrollBtnDetail: document.getElementById('enrollBtnDetail'),
    backToCatalogBtn: document.getElementById('backToCatalogBtn'),
    quizAreaDetail: document.getElementById('quizAreaDetail'),
    quizList: document.getElementById('quizList'),
    createQuizBlock: document.getElementById('createQuizBlock'),
    quizTitle: document.getElementById('quizTitle'),
    quizQuestions: document.getElementById('quizQuestions'),
    createQuizBtn: document.getElementById('createQuizBtn'),
    cancelCreateQuizBtn: document.getElementById('cancelCreateQuizBtn'),
    createQuizMsg: document.getElementById('createQuizMsg'),

    dashboardPage: document.getElementById('dashboardPage'),
    dashLeft: document.getElementById('dashLeft'),
    dashRight: document.getElementById('dashRight'),
    timeChartWrapper: document.getElementById('timeChartWrapper'),
    timeChartCanvas: document.getElementById('timeChart'),
    marksWrapper: document.getElementById('marksWrapper'),
    marksTableBody: document.querySelector('#marksTable tbody'),
    marksChart: document.getElementById('marksChart'),
    dashboardError: document.getElementById('dashboardError'),

    createPage: document.getElementById('createPage'),
    createTitle: document.getElementById('createTitle'),
    createDesc: document.getElementById('createDesc'),
    createLevel: document.getElementById('createLevel'),
    createMaterials: document.getElementById('createMaterials'),
    createCourseBtn: document.getElementById('createCourseBtn'),
    createCourseMsg: document.getElementById('createCourseMsg'),

    adminPanel: document.getElementById('adminPanel'),
    adminUserCount: document.getElementById('adminUserCount'),
    adminCourseCount: document.getElementById('adminCourseCount'),
    adminEnrollCount: document.getElementById('adminEnrollCount'),
    adminAnalytics: document.getElementById('adminAnalytics'),
    adminUsers: document.getElementById('adminUsers'),
    adminCourses: document.getElementById('adminCourses'),
  };

  function escapeHTML(s = '') { return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }

  /* ---------- Header / pages ---------- */
  function updateHeader() {
    if (current) {
      refs.roleBadge.innerHTML = `<i class="fa-solid fa-user"></i> ${escapeHTML(current.name)} (${current.role})`;
      refs.btnLogout.classList.remove('hidden');
      if (current.role === 'instructor' || current.role === 'admin') refs.navCreate.classList.remove('hidden'); else refs.navCreate.classList.add('hidden');
    } else {
      refs.roleBadge.innerHTML = `<i class="fa-solid fa-user"></i> Guest`;
      refs.btnLogout.classList.add('hidden');
      refs.navCreate.classList.add('hidden');
    }
  }
  function hideAllPages() {
    refs.loginCard.classList.add('hidden'); refs.catalogPage.classList.add('hidden'); refs.courseDetailPage.classList.add('hidden'); refs.dashboardPage.classList.add('hidden'); refs.createPage.classList.add('hidden'); refs.adminPanel.classList.add('hidden'); refs.createCourseMsg.textContent = '';
    refs.createQuizMsg.textContent = '';
    refs.dashboardError.textContent = '';
  }
  function showLogin() { hideAllPages(); refs.loginCard.classList.remove('hidden'); }

  /* ---------- Inactivity auto logout ---------- */
  let inactivityTimer = null;
  function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (!current) return;
    inactivityTimer = setTimeout(() => {
      current = null; save(KEY_CURRENT, current); updateHeader(); showLogin();
      refs.loginError.textContent = 'You were logged out due to inactivity.';
    }, INACTIVITY_TIMEOUT_MS);
  }
  ['click', 'keydown', 'mousemove', 'touchstart'].forEach(ev => window.addEventListener(ev, resetInactivityTimer, { passive: true }));

  /* ---------- Boot ---------- */
  updateHeader();
  showLogin();

  /* ---------- Nav handlers ---------- */
  refs.navCatalog.addEventListener('click', (e) => { e.preventDefault(); loadCourses(); });
  refs.navDashboard.addEventListener('click', (e) => { e.preventDefault(); if (!current) { showLogin(); refs.loginError.textContent = 'Please login to view the dashboard.'; } else { if (current.role === 'admin') showAdminPanel(); else showDashboard(); } });
  refs.navCreate.addEventListener('click', (e) => { e.preventDefault(); if (!current || (current.role !== 'instructor' && current.role !== 'admin')) { refs.dashboardError.textContent = 'Create is for instructors/admins only.'; return; } hideAllPages(); refs.createPage.classList.remove('hidden'); });
  refs.btnLogout.addEventListener('click', () => { current = null; save(KEY_CURRENT, current); updateHeader(); showLogin(); refs.loginError.textContent = 'You logged out.'; });

  /* ---------- LOGIN ---------- */
  refs.loginForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    refs.loginError.textContent = '';
    const email = refs.loginEmail.value.trim();
    const pass = refs.loginPassword.value;
    if (!email || !pass) { refs.loginError.textContent = 'Enter email and password.'; return; }
    const user = users.find(u => (u.email === email || u.username === email) && u.password === pass);
    if (!user) { refs.loginError.textContent = 'Invalid email or password.'; return; }
    current = user; save(KEY_CURRENT, current); updateHeader();
    // track daily streak
    trackDailyStreak(current.email);
    // clear inputs
    refs.loginEmail.value = ''; refs.loginPassword.value = '';
    if (current.role === 'admin') showAdminPanel(); else showDashboard();
    resetInactivityTimer();
  });

  function trackDailyStreak(email) {
    const today = new Date().toISOString().slice(0, 10);
    streaks[email] = streaks[email] || { last: null, count: 0 };
    if (streaks[email].last !== today) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      if (streaks[email].last === yesterday) streaks[email].count += 1; else streaks[email].count = 1;
      streaks[email].last = today;
      save(KEY_STREAK, streaks);
    }
  }

  /* ---------- COURSES: search & render ---------- */
  function loadCourses() { hideAllPages(); refs.catalogPage.classList.remove('hidden'); renderCoursesGrid(courses); }
  refs.searchCourse.addEventListener('input', () => { const q = refs.searchCourse.value.trim().toLowerCase(); const level = refs.filterLevel.value; const filtered = courses.filter(c => (c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)) && (level === 'all' ? true : c.level === level)); renderCoursesGrid(filtered); });
  refs.filterLevel.addEventListener('change', () => refs.searchCourse.dispatchEvent(new Event('input')));

  function renderCoursesGrid(list) {
    refs.coursesGrid.innerHTML = '';
    list.forEach(c => {
      const node = document.createElement('div'); node.className = 'course-card';
      node.innerHTML = `<div>
                          <h4>${escapeHTML(c.title)}</h4>
                          <p class="small muted">${escapeHTML(c.instructor)} • ${escapeHTML(c.level)}</p>
                          <p>${escapeHTML(c.desc)}</p>
                        </div>
                        <div class="course-actions">
                          <button class="btn small btn-view" data-id="${c.id}"><i class="fa-solid fa-eye"></i> View</button>
                          <button class="btn small btn-enroll" data-id="${c.id}"><i class="fa-solid fa-plus"></i> Enroll</button>
                        </div>`;
      refs.coursesGrid.appendChild(node);
    });
    refs.coursesGrid.querySelectorAll('.btn-view').forEach(b => b.addEventListener('click', () => openCourseDetail(Number(b.dataset.id))));
    refs.coursesGrid.querySelectorAll('.btn-enroll').forEach(b => b.addEventListener('click', () => enrollFromGrid(Number(b.dataset.id))));
    if (current && current.role === 'instructor') {
      refs.coursesGrid.querySelectorAll('.course-card').forEach(card => {
        const instr = card.querySelector('.small.muted')?.textContent || '';
        if (instr.includes(current.name)) {
          const btn = card.querySelector('.btn-enroll');
          if (btn) btn.style.visibility = 'hidden';
        }
      });
    }
  }

  /* ---------- COURSE DETAIL & QUIZZES ---------- */
  let activeCourseId = null, courseTimerInterval = null, activeQuizTimer = null;
  function openCourseDetail(id) {
    const c = courses.find(x => x.id === id); if (!c) return;
    activeCourseId = id; hideAllPages(); refs.courseDetailPage.classList.remove('hidden');
    refs.detailTitle.textContent = c.title;
    refs.detailInstructor.textContent = `Instructor: ${c.instructor} • Level: ${c.level}`;
    refs.detailMaterials.innerHTML = ''; (c.materials || []).forEach(m => { const li = document.createElement('li'); li.textContent = m; refs.detailMaterials.appendChild(li); });

    // QUIZZES
    refs.quizAreaDetail.classList.remove('hidden');

    refs.quizList.innerHTML = '';
    if (c.quizzes && c.quizzes.length) {
      c.quizzes.forEach((q, i) => {
        const div = document.createElement('div'); div.className = 'card'; div.style.marginTop = '8px';
        const submissionsCount = q.submissions ? Object.keys(q.submissions).length : 0;

        if (current && current.role === 'student') {
          const key = `${id}-${q.id}`;
          const attempted =
            marks[current.email] && marks[current.email][key] !== undefined;

          if (!attempted) {
            actions += `<button class="btn small take-quiz" data-i="${i}">Take Quiz</button>`;
          } else {
            actions += `<span class="small muted">Already attempted</span>`;
          }
        }



        div.innerHTML = `
  <strong>${escapeHTML(q.title)}</strong>
  <div class="small muted">(${submissionsCount} submissions)</div>
  <div style="margin-top:8px;display:flex;gap:8px">
    ${actions}
  </div>
`;

        refs.quizList.appendChild(div);
        div.querySelector('.take-quiz').addEventListener('click', () => startQuizCountdown(id, i));


      });
    } else {
      refs.quizList.innerHTML = `<p class="small muted">No quizzes yet.</p>`;
    }

    // create quiz visible to admin or course instructor
    if (current && (current.role === 'admin' || (current.role === 'instructor' && current.name === c.instructor))) {
      refs.createQuizBlock.classList.remove('hidden');
      refs.createQuizBtn.classList.remove('hidden');
    } else {
      refs.createQuizBlock.classList.add('hidden');
      refs.createQuizBtn.classList.add('hidden');
    }

    // enroll button behavior
    if (!current) {
      refs.enrollBtnDetail.textContent = 'Login to Enroll';
      refs.enrollBtnDetail.onclick = () => { showLogin(); refs.loginError.textContent = 'Login to enroll.'; };
    } else if (current.role === 'student') {
      const userEnrolls = getUserEnrolls(current.email);
      if (userEnrolls.includes(id)) { refs.enrollBtnDetail.textContent = 'Enrolled — Go to Dashboard'; refs.enrollBtnDetail.onclick = () => showDashboard(); }
      else { refs.enrollBtnDetail.textContent = 'Enroll in Course'; refs.enrollBtnDetail.onclick = () => enrollCourse(id); }
    } else if (current.role === 'instructor') {
      if (current.name === c.instructor) { refs.enrollBtnDetail.textContent = 'You are instructor'; refs.enrollBtnDetail.onclick = () => { }; }
      else { refs.enrollBtnDetail.textContent = 'Not applicable'; refs.enrollBtnDetail.onclick = () => { }; }
    } else if (current.role === 'admin') {
      refs.enrollBtnDetail.textContent = 'Admin: Delete Course'; refs.enrollBtnDetail.onclick = () => { if (confirm('Delete this course?')) { deleteCourse(id); } };
    }

    // start per-course presence timer if student
    if (courseTimerInterval) clearInterval(courseTimerInterval);
    if (current && current.role === 'student') {
      courseTimerInterval = setInterval(() => {
        if (!timers[current.email]) timers[current.email] = {};
        if (!timers[current.email][id]) timers[current.email][id] = 0;
        timers[current.email][id] += 1;
        save(KEY_TIMERS, timers);
      }, 1000);
    }
  }
  refs.backToCatalogBtn.addEventListener('click', () => { if (courseTimerInterval) { clearInterval(courseTimerInterval); courseTimerInterval = null; } loadCourses(); });

  /* ---------- ENROLL ---------- */
  function getUserEnrolls(email) { const u = users.find(x => x.email === email); return u && u.enrollments ? u.enrollments : []; }
  function enrollFromGrid(id) { if (!current) { showLogin(); refs.loginError.textContent = 'Please login to enroll.'; return; } if (current.role !== 'student') { refs.dashboardError.textContent = 'Only students may enroll.'; return; } enrollCourse(id); }
  function enrollCourse(id) {
    if (!current || current.role !== 'student') { refs.dashboardError.textContent = 'Only students may enroll.'; return; }
    if (!current.enrollments) current.enrollments = [];
    if (current.enrollments.includes(id)) { refs.dashboardError.textContent = 'Already enrolled.'; return; }
    current.enrollments.push(id);
    const idx = users.findIndex(u => u.email === current.email);
    if (idx >= 0) { users[idx] = current; save(KEY_USERS, users); save(KEY_CURRENT, current); }
    refs.dashboardError.textContent = '';
    showDashboard();
  }

  /* ---------- CREATE QUIZ (admin/instructor) ---------- */
  refs.createQuizBtn.addEventListener('click', () => {
    if (!current || (current.role !== 'instructor' && current.role !== 'admin')) {
      refs.createQuizMsg.textContent = 'Only instructors or admin can create quizzes';
      refs.createQuizMsg.style.color = '#ff6b6b';
      return;
    }

    const c = courses.find(x => x.id === activeCourseId); if (!c) {
      refs.createQuizMsg.textContent = 'Open a course before creating a quiz';
      refs.createQuizMsg.style.color = '#ff6b6b';
      return;
    }

    const title = refs.quizTitle.value.trim();


    /* ---------- Robust quiz parser ---------- */
    const raw = refs.quizQuestions.value.trim();

    if (!raw) {
      refs.createQuizMsg.textContent = 'Please enter quiz questions';
      refs.createQuizMsg.style.color = '#ff6b6b';
      return;
    }

    const blocks = raw.split(/\n\s*\n/);
    const questions = [];

    blocks.forEach(block => {
      const lines = block
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

      let questionText = '';
      const options = [];
      let correctIndex = -1;

      lines.forEach(line => {
        if (line.toUpperCase().startsWith('Q:')) {
          questionText = line.slice(2).trim();
        }
        else if (/^[A-Da-d]\)/.test(line)) {
          options.push(line.slice(2).trim());
        }
        else if (line.toUpperCase().startsWith('ANS:')) {
          const ch = line.slice(4).trim().toUpperCase();
          correctIndex = ch.charCodeAt(0) - 65;
        }
      });

      if (
        questionText &&
        options.length >= 2 &&
        correctIndex >= 0 &&
        correctIndex < options.length
      ) {
        questions.push({
          q: questionText,
          opts: options,
          a: correctIndex
        });
      }
    });

    if (!title) {
      refs.createQuizMsg.textContent = 'Quiz title is required';
      refs.createQuizMsg.style.color = '#ff6b6b';
      return;
    }

    if (questions.length === 0) {
      refs.createQuizMsg.textContent =
        'No valid questions found. Use format:\nQ: ... A) ... B) ... ANS: A';
      refs.createQuizMsg.style.color = '#ff6b6b';
      return;
    }



    c.quizzes = c.quizzes || [];
    const quizId = Date.now();
    // questions format: [{ q:'..', opts:['..'], a:0, durationSec:120 }, ...]
    c.quizzes.push({ id: quizId, title, questions, duration: null, submissions: {} });
    save(KEY_COURSES, courses);
    refs.createQuizMsg.textContent = 'Quiz created';
    refs.createQuizMsg.style.color = '#7cffb2';
    refs.quizTitle.value = ''; refs.quizQuestions.value = '';
    setTimeout(() => { refs.createQuizMsg.textContent = ''; openCourseDetail(activeCourseId); }, 800);
  });
  refs.cancelCreateQuizBtn.addEventListener('click', () => { refs.createQuizBlock.classList.add('hidden'); });

  /* ---------- TAKING TIMED QUIZ ---------- */
  function startQuizCountdown(courseId, quizIndex) {

    // ❌ Prevent reattempts — SAFE PLACE (TOP OF FUNCTION)

    // Only students can take quizzes
    if (!current || current.role !== 'student') {
      return;
    }

    // Validate inputs
    if (typeof courseId !== 'number' || typeof quizIndex !== 'number') {
      return;
    }

    // Find course safely
    let course = null;
    for (let i = 0; i < courses.length; i++) {
      if (courses[i].id === courseId) {
        course = courses[i];
        break;
      }
    }

    if (!course || !Array.isArray(course.quizzes)) {
      return;
    }

    // Find quiz safely
    const quiz = course.quizzes[quizIndex];
    if (!quiz || !quiz.id) {
      return;
    }

    // Check if already attempted
    const attemptKey = `${courseId}-${quiz.id}`;

    if (
      marks &&
      marks[current.email] &&
      marks[current.email][attemptKey] !== undefined
    ) {
      alert('You have already attempted this quiz.');
      return;
    }
    refs.quizList.innerHTML = `<div class="card"><h4>${escapeHTML(quiz.title)}</h4><div id="quizTimer" class="small muted"></div><div id="quizQuestionsArea"></div></div>`;
    const qArea = document.getElementById('quizQuestionsArea');
    quiz.questions.forEach((q, i) => {


      const dd = document.createElement('div');
      dd.style.marginBottom = '14px';
      dd.style.fontSize = '1rem';
      dd.innerHTML = `<div style="font-weight:600;margin-bottom:6px">${escapeHTML(q.q)}</div>`;

      q.opts.forEach((opt, j) => {
        const lbl = document.createElement('label');
        lbl.style.display = 'grid';
        lbl.style.gridTemplateColumns = '18px 1fr';
        lbl.style.columnGap = '10px';
        lbl.style.alignItems = 'start';
        lbl.style.marginBottom = '8px';
        lbl.style.cursor = 'pointer';
        lbl.style.lineHeight = '1.4';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `q_${i}`;
        radio.value = j;
        radio.style.margin = '0';
        radio.style.marginTop = '3px';   // 🔑 key alignment fix

        const text = document.createElement('span');
        text.textContent = opt;
        text.style.fontSize = '0.95rem';

        lbl.appendChild(radio);
        lbl.appendChild(text);
        dd.appendChild(lbl);



        lbl.style.display = 'block';
        lbl.style.marginBottom = '6px';
        lbl.style.cursor = 'pointer';

      });
      qArea.appendChild(dd);
    });
    const submitBtn = document.createElement('button'); submitBtn.className = 'btn'; submitBtn.textContent = 'Submit';
    submitBtn.addEventListener('click', () => finalizeQuizAttempt(courseId, quiz.id));
    qArea.appendChild(submitBtn);

    // timer
    let remaining = quiz.duration || 300; // default 5 minutes
    const timerEl = document.getElementById('quizTimer');
    timerEl.textContent = `Time remaining: ${formatTime(remaining)}`;
    if (activeQuizTimer) clearInterval(activeQuizTimer);
    activeQuizTimer = setInterval(() => {
      remaining -= 1;
      timerEl.textContent = `Time remaining: ${formatTime(remaining)}`;
      if (remaining <= 0) {
        clearInterval(activeQuizTimer); activeQuizTimer = null;
        alert('Time is up — submitting quiz automatically.');
        finalizeQuizAttempt(courseId, quiz.id);
      }
    }, 1000);
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60); const s = sec % 60; return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function finalizeQuizAttempt(courseId, quizId) {
    const course = courses.find(x => x.id === courseId); if (!course) return;
    const quiz = course.quizzes.find(q => q.id === quizId); if (!quiz) return;
    // score
    let score = 0; quiz.questions.forEach((q, i) => {
      const sel = document.querySelector(`input[name="q_${i}"]:checked`);
      if (sel && Number(sel.value) === q.a) score++;
    });
    const percent = Math.round((score / quiz.questions.length) * 100);
    // record marks keyed by user email -> "courseId-quizId"
    marks[current.email] = marks[current.email] || {};
    marks[current.email][`${courseId}-${quizId}`] = percent;
    // record submission inside quiz for instructor view
    quiz.submissions = quiz.submissions || {};
    quiz.submissions[current.email] = { score: percent, attemptedAt: new Date().toISOString() };
    save(KEY_MARKS, marks); save(KEY_COURSES, courses);
    alert(`You scored ${percent}%`);
    renderDashboard();
    openCourseDetail(courseId);
  }

  refs.createCourseBtn.addEventListener('click', () => {
    if (!current || (current.role !== 'instructor' && current.role !== 'admin')) {
      refs.createCourseMsg.textContent = 'Only instructors or admin can create courses';
      refs.createCourseMsg.style.color = '#ff6b6b';
      return;
    }

    const title = refs.createTitle.value.trim();
    const desc = refs.createDesc.value.trim();
    const level = refs.createLevel.value;
    const mats = refs.createMaterials.value.split(',').map(s => s.trim()).filter(Boolean);

    if (!title || !desc) {
      refs.createCourseMsg.textContent = 'Provide title & description';
      refs.createCourseMsg.style.color = '#ff6b6b';
      return;
    }

    const editingId = refs.createCourseBtn.dataset.editing;

    if (editingId) {
      const idx = courses.findIndex(c => c.id === Number(editingId));
      if (idx !== -1) {
        courses[idx] = { ...courses[idx], title, desc, level, materials: mats };
      }
      delete refs.createCourseBtn.dataset.editing;
      refs.createCourseBtn.textContent = 'Create Course';
    } else {
      const newId = Math.max(0, ...courses.map(c => c.id)) + 1;
      courses.push({
        id: newId,
        title,
        desc,
        level,
        instructor: current.name,
        materials: mats,
        quizzes: []
      });
    }

    save(KEY_COURSES, courses);
    setTimeout(() => {
      refs.createCourseMsg.textContent = '';
    }, 1500);

    refs.createCourseMsg.textContent = 'Course saved successfully';
    refs.createCourseMsg.style.color = '#7cffb2';

    refs.createTitle.value = '';
    refs.createDesc.value = '';
    refs.createMaterials.value = '';

    setTimeout(loadCourses, 600);
  });


  /* ---------- DASHBOARD ---------- */
  function showDashboard() { hideAllPages(); refs.dashboardPage.classList.remove('hidden'); renderDashboard(); resetInactivityTimer(); }
  function renderDashboard() {
    refs.dashboardError.textContent = ''; refs.dashLeft.innerHTML = ''; refs.dashRight.innerHTML = ''; refs.timeChartWrapper.classList.add('hidden'); refs.marksWrapper.classList.add('hidden');

    if (!current) { refs.dashboardError.textContent = 'Please login.'; return; }

    if (current.role === 'student') {
      const w1 = document.createElement('div'); w1.className = 'dash-widget'; w1.innerHTML = '<h3>My Enrolled Courses</h3>';
      const enrolled = current.enrollments || [];
      if (enrolled.length === 0) { w1.innerHTML += '<p class="muted">No enrollments yet.</p>'; } else {
        enrolled.forEach(cid => {
          const c = courses.find(x => x.id === cid);
          if (!c) return;
          const prog = (current.progress && current.progress[cid]) ? current.progress[cid] : 0;
          const row = document.createElement('div'); row.style.marginTop = '10px';

          row.innerHTML = `
  <strong>${escapeHTML(c.title)}</strong>
  <div class="progress"><i style="width:${prog}%;"></i></div>
  <div style="margin-top:8px;display:flex;gap:8px">
    <button class="btn small" onclick="openCourseFromDash(${c.id})">Open</button>
    <button class="btn small secondary" onclick="markComplete(${c.id})">Mark Complete</button>
  </div>
  ${(c.quizzes && c.quizzes.length)
              ? `<div class="small muted" style="margin-top:6px">
        <div class="small muted" style="margin-top:6px">
  Quizzes:
  ${c.quizzes.map(q =>
                `<span style="cursor:pointer;text-decoration:underline"
      onclick="openQuizFromDash(${c.id}, ${q.id})">
      ${q.title}
    </span>`
              ).join(', ')}
</div>

       </div>`
              : ''}
`;

          w1.appendChild(row);
        });
      }
      // daily streak
      const st = streaks[current.email] ? streaks[current.email].count : 0;
      w1.innerHTML += `<div style="margin-top:12px"><strong>Daily streak: ${st} days</strong></div>`;
      refs.dashLeft.appendChild(w1);

      // right side summary
      const w2 = document.createElement('div'); w2.className = 'dash-widget'; w2.innerHTML = '<h3>Summary</h3><p class="muted">Quiz marks and time spent are shown below.</p>';
      refs.dashRight.appendChild(w2);

      const userTimes = timers[current.email] || {};
      if (Object.keys(userTimes).length) {
        refs.timeChartWrapper.classList.remove('hidden'); renderTimeChart(userTimes);
      } else refs.timeChartWrapper.classList.add('hidden');

      const userMarks = marks[current.email] || {};
      const anyMarks = Object.keys(userMarks).length > 0;
      if (anyMarks) { refs.marksWrapper.classList.remove('hidden'); renderMarksTable(); } else refs.marksWrapper.classList.add('hidden');

      // due quizzes
      const dueDiv = document.createElement('div'); dueDiv.className = 'card'; dueDiv.innerHTML = '<h3>Due Quizzes</h3>';
      const dueList = document.createElement('div');
      courses.filter(c => (current.enrollments || []).includes(c.id)).forEach(c => {
        (c.quizzes || []).forEach(q => {
          const key = `${c.id}-${q.id}`;
          if (!(marks[current.email] && marks[current.email][key])) {

            const el = document.createElement('div');
            el.className = 'small muted';
            el.style.cursor = 'pointer';
            el.style.textDecoration = 'underline';

            el.textContent = `${c.title} — ${q.title}`;

            el.onclick = () => {
              // openCourseDetail(c.id);
              openCourseDetail(c.id);

              setTimeout(() => {
                const quizCards = document.querySelectorAll('.take-quiz');
                if (quizCards.length) {
                  quizCards[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 300);
            };

            dueList.appendChild(el);

          }
        });
      });
      dueDiv.appendChild(dueList);
      refs.dashRight.appendChild(dueDiv);

    } else if (current.role === 'instructor') {

      const left = document.createElement('div');
      left.className = 'dash-widget';
      left.innerHTML = '<h3>My Teaching Courses</h3>';

      const myCourses = courses.filter(c => c.instructor === current.name);

      if (myCourses.length === 0) {
        left.innerHTML += '<p class="muted">You have not created any courses yet.</p>';
      }

      myCourses.forEach(course => {
        const courseBlock = document.createElement('div');
        courseBlock.style.marginTop = '12px';

        courseBlock.innerHTML = `
      <strong>${course.title}</strong>
      <p class="small muted">${course.desc}</p>
    `;

        const actionRow = document.createElement('div');
        actionRow.style.display = 'flex';
        actionRow.style.gap = '8px';
        actionRow.style.marginTop = '6px';

        const delBtn = document.createElement('button');
        delBtn.className = 'btn small secondary';
        delBtn.textContent = 'Delete';
        delBtn.onclick = () => {
          if (confirm('Delete this course?')) {
            courses = courses.filter(c => c.id !== course.id);
            localStorage.setItem('lms_v3_courses', JSON.stringify(courses));
            renderDashboard();
          }
        };

        actionRow.appendChild(delBtn);
        courseBlock.appendChild(actionRow);

        (course.quizzes || []).forEach(quiz => {
          const submissions = quiz.submissions || {};
          const count = Object.keys(submissions).length;

          const quizInfo = document.createElement('div');
          quizInfo.className = 'small muted';
          quizInfo.style.marginTop = '6px';
          quizInfo.textContent = `Quiz: ${quiz.title} — Submissions: ${count}`;
          courseBlock.appendChild(quizInfo);

          Object.entries(submissions).forEach(([email, data]) => {
            const r = document.createElement('div');
            r.className = 'small';
            r.style.marginLeft = '12px';
            r.textContent = `• ${email}: ${data.score}%`;
            courseBlock.appendChild(r);
          });
        });

        left.appendChild(courseBlock);
      });

      refs.dashLeft.appendChild(left);

      const right = document.createElement('div');
      right.className = 'dash-widget';
      right.innerHTML = `
    <h3>Instructor Actions</h3>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="btn" onclick="openCreatePage()">Create Course</button>
      <button class="btn" onclick="loadCourses()">View Catalog</button>
    </div>
  `;

      refs.dashRight.appendChild(right);
    }
  }

  window.openCourseFromDash = function (id) { openCourseDetail(id); };
  window.markComplete = function (id) { if (!current) return; if (!current.progress) current.progress = {}; current.progress[id] = 100; const idx = users.findIndex(u => u.email === current.email); if (idx >= 0) { users[idx] = current; save(KEY_USERS, users); save(KEY_CURRENT, current); } renderDashboard(); };


  function renderTimeChart(userTimes) {
    const labels = []; const data = [];
    Object.keys(userTimes).forEach(k => {
      const cid = Number(k);
      const c = courses.find(x => x.id === cid);

      if (!c) return; // 🔥 ignore deleted courses

      labels.push(c.title);
      data.push(Math.round((userTimes[k] || 0) / 60));
    });

    // Object.keys(userTimes).forEach(k=>{ const cid=Number(k); const c=courses.find(x=>x.id===cid); labels.push(c?c.title:`Course ${cid}`); data.push(Math.round((userTimes[k]||0)/60));});
    const ctx = refs.timeChartCanvas.getContext('2d');
    if (window._timeChart) window._timeChart.destroy();
    window._timeChart = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Minutes', data, backgroundColor: '#ffd60a' }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
  }

  function renderMarksTable() {
    refs.marksTableBody.innerHTML = '';
    const userMarks = marks[current.email] || {};
    Object.keys(userMarks).forEach(qid => {
      let info = { course: '-', quiz: 'Q', score: userMarks[qid] };
      for (const c of courses) {
        if (c.quizzes) {
          const q = c.quizzes.find(x => `${c.id}-${x.id}` === qid || String(x.id) === String(qid));
          if (q) { info.course = c.title; info.quiz = q.title; break; }
        }
      }
      refs.marksTableBody.insertAdjacentHTML('beforeend', `<tr><td>${escapeHTML(info.course)}</td><td>${escapeHTML(info.quiz)}</td><td>${info.score}%</td></tr>`);
    });
    const labels = []; const data = [];
    Object.keys(userMarks).forEach(qid => {
      let courseTitle = '-'; let qtitle = 'Q';
      for (const c of courses) { const q = c.quizzes?.find(x => `${c.id}-${x.id}` === qid || String(x.id) === String(qid)); if (q) { courseTitle = c.title; qtitle = q.title; break; } }
      labels.push(`${courseTitle} - ${qtitle}`); data.push(userMarks[qid]);
    });
    const ctx = refs.marksChart.getContext('2d'); if (window._marksChart) window._marksChart.destroy();
    window._marksChart = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Score%', data, backgroundColor: '#ffd60a' }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } } });
  }

  /* ---------- ADMIN ---------- */
  function showAdminPanel() { if (!current || current.role !== 'admin') { showLogin(); refs.loginError.textContent = 'Admin access only.'; return; } hideAllPages(); refs.adminPanel.classList.remove('hidden'); renderAdmin(); }
  function renderAdmin() {
    refs.adminUserCount.textContent = users.length;
    refs.adminCourseCount.textContent = courses.length;
    let totalEnroll = 0; users.forEach(u => { if (u.enrollments) totalEnroll += u.enrollments.length; }); refs.adminEnrollCount.textContent = totalEnroll;
    const avgPerCourse = courses.map(c => {
      let sum = 0, count = 0;
      for (const uname in marks) {
        for (const qid in marks[uname]) {
          const [cid] = qid.split('-');
          if (Number(cid) === c.id) { sum += marks[uname][qid]; count++; }
        }
      }
      const avg = count ? Math.round(sum / count) : 0; return { title: c.title, avg, count };
    });
    refs.adminAnalytics.innerHTML = '<h4>Average scores per course</h4>';
    avgPerCourse.forEach(a => refs.adminAnalytics.innerHTML += `<div class="small">${escapeHTML(a.title)} — ${a.avg}% (${a.count} attempts)</div>`);
    const leaderboard = users.filter(u => u.role === 'student').map(st => {
      const stMarks = marks[st.email] || {}; const vals = Object.values(stMarks); const avg = vals.length ? Math.round(vals.reduce((s, n) => s + n, 0) / vals.length) : 0; return { name: st.name, avg, email: st.email };
    }).sort((a, b) => b.avg - a.avg);
    refs.adminAnalytics.innerHTML += '<h4 style="margin-top:8px">Leaderboard</h4>';
    leaderboard.forEach((l, i) => refs.adminAnalytics.innerHTML += `<div class="small">${i + 1}. ${escapeHTML(l.name)} — ${l.avg}% (<a href="#" data-user="${l.email}" class="admin-view-user">view</a>)</div>`);
    refs.adminUsers.innerHTML = ''; const ul = document.createElement('div'); ul.className = 'admin-list';
    users.forEach(u => { const r = document.createElement('div'); r.className = 'admin-row'; r.innerHTML = `<div><strong>${escapeHTML(u.name)}</strong> <span class="small muted">(${u.role})</span></div><div style="display:flex;gap:8px"><button class="btn small" data-imp="${escapeHTML(u.email)}">Impersonate</button><button class="btn small secondary" data-del="${escapeHTML(u.email)}">Delete</button></div>`; ul.appendChild(r); });
    refs.adminUsers.appendChild(ul);
    ul.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => { const e = b.dataset.del; if (!confirm('Delete user?')) return; users = users.filter(x => x.email !== e); save(KEY_USERS, users); renderAdmin(); }));
    ul.querySelectorAll('[data-imp]').forEach(b => b.addEventListener('click', () => {
      const e = b.dataset.imp; const u = users.find(x => x.email === e); if (u) {
        current = u; save(KEY_CURRENT, current);
        refs.createCourseMsg.textContent = '';
        refs.createQuizMsg.textContent = '';
        refs.dashboardError.textContent = ''; updateHeader(); if (current.role === 'admin') showAdminPanel(); else showDashboard();
      }
    }));
    refs.adminCourses.innerHTML = ''; const ulc = document.createElement('div'); ulc.className = 'admin-list';
    courses.forEach(c => { const r = document.createElement('div'); r.className = 'admin-row'; r.innerHTML = `<div><strong>${escapeHTML(c.title)}</strong><div class="small muted">${escapeHTML(c.instructor)}</div></div><div style="display:flex;gap:8px"><button class="btn small" data-edit="${c.id}">Edit</button><button class="btn small secondary" data-delc="${c.id}">Delete</button></div>`; ulc.appendChild(r); });
    refs.adminCourses.appendChild(ulc);
    ulc.querySelectorAll('[data-delc]').forEach(b => b.addEventListener('click', () => { const id = Number(b.dataset.delc); if (!confirm('Delete course?')) return; courses = courses.filter(x => x.id !== id); save(KEY_COURSES, courses); renderAdmin(); }));
    ulc.querySelectorAll('[data-edit]').forEach(b => {
      b.addEventListener('click', () => {
        const courseId = Number(b.dataset.edit);
        const course = courses.find(c => c.id === courseId);
        if (!course) return;

        // Open create page in edit mode
        hideAllPages();
        refs.createPage.classList.remove('hidden');

        // Prefill fields
        refs.createTitle.value = course.title;
        refs.createDesc.value = course.desc;
        refs.createLevel.value = course.level;
        refs.createMaterials.value = (course.materials || []).join(', ');

        // Store editing course id
        refs.createCourseBtn.dataset.editing = courseId;
        refs.createCourseBtn.textContent = 'Update Course';
      });
    });

    // attach view user handlers
    refs.adminAnalytics.querySelectorAll('.admin-view-user').forEach(a => a.addEventListener('click', (ev) => {
      ev.preventDefault();
      const email = a.dataset.user;
      const u = users.find(x => x.email === email); if (!u) return;
      // alert('User data:\\n' + JSON.stringify(u, null, 2) + '\\nMarks:\\n' + JSON.stringify(marks[email]||{}, null, 2) );
      const dialog = document.getElementById('adminUserDialog');
      const content = document.getElementById('adminUserDialogContent');

      content.textContent =
        'User Details:\n' +
        JSON.stringify(u, null, 2) +
        '\n\nMarks:\n' +
        JSON.stringify(marks[email] || {}, null, 2);

      dialog.showModal();
      dialog.style.margin = 'auto';


    }));
  }

  /* ---------- Delete course helper ---------- */
  function deleteCourse(id) { courses = courses.filter(x => x.id !== id); save(KEY_COURSES, courses); loadCourses(); }

  /* ---------- Helper: open create page ---------- */
  window.openCreatePage = function () { hideAllPages(); refs.createPage.classList.remove('hidden'); };

  /* ---------- small helpers ---------- */
  function saveUsers() { save(KEY_USERS, users); }
  function saveCourses() { save(KEY_COURSES, courses); }
  function saveTimers() { save(KEY_TIMERS, timers); }
  function saveMarks() { save(KEY_MARKS, marks); }

  /* ---------- expose ---------- */
  window.loadCourses = loadCourses;
  window.openCourseDetail = openCourseDetail;
  window.showLogin = showLogin;
  window.showAdminPanel = showAdminPanel;
  window.showDashboard = showDashboard;

  window.openQuizFromDash = function (courseId, quizId) {
    openCourseDetail(courseId);

    setTimeout(() => {
      const quizArea = document.getElementById('quizAreaDetail');
      if (quizArea) quizArea.classList.remove('hidden');

      const quizCards = document.querySelectorAll('[data-quiz-id]');
      quizCards.forEach(card => {
        if (Number(card.dataset.quizId) === quizId) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }, 300);
  };


  /* ---------- initial header ---------- */
  updateHeader();


})();


