



/* Fixed and reconstructed app.js
   - Restores missing/truncated logic from the uploaded project
   - Keeps original IDs and integration points untouched
   - Adds: timed quizzes (auto-submit), 1-hour inactivity logout,
           daily streak, due quizzes, admin user view, instructor submissions
   - Persists to localStorage using lms_v3_* keys like original
*/


const API_BASE = "http://localhost:5000/api";

(() => {
  // JWT token management
  const KEY_TOKEN = 'lms_token';
  const KEY_CURRENT = 'lms_current';

  // 1 hour inactivity timeout
  const INACTIVITY_TIMEOUT_MS = 1 * 60 * 60 * 1000;

  function getToken() {
    return localStorage.getItem(KEY_TOKEN);
  }

  function setToken(token) {
    localStorage.setItem(KEY_TOKEN, token);
  }

  function removeToken() {
    localStorage.removeItem(KEY_TOKEN);
  }

  function loadCurrent() {
    try {
      const raw = localStorage.getItem(KEY_CURRENT);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveCurrent(user) {
    localStorage.setItem(KEY_CURRENT, JSON.stringify(user));
  }

  function removeCurrent() {
    localStorage.removeItem(KEY_CURRENT);
  }

  let current = loadCurrent();

  // Save and load utilities
  const KEY_STREAK = 'lms_streak';
  let streaks = {};
  
  function load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  
  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save:', key, e);
    }
  }
  
  // Load streaks on startup
  const loadedStreaks = load(KEY_STREAK);
  if (loadedStreaks) {
    streaks = loadedStreaks;
  }

  /* ---------- Validate token on page load ---------- */
  async function validateTokenOnLoad() {
    const token = getToken();
    if (!token) {
      // No token, clear user data
      current = null;
      removeCurrent();
      return false;
    }

    // Try to validate token by making a simple API call
    try {
      const response = await fetch(`${API_BASE}/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // If unauthorized, token is invalid
      if (response.status === 401 || response.status === 403) {
        current = null;
        removeToken();
        removeCurrent();
        return false;
      }
      
      // Token seems valid, keep current user
      return true;
    } catch (error) {
      // Network error or other issue - keep user if we have one
      // But if no current user, clear everything
      if (!current) {
        removeToken();
        removeCurrent();
        return false;
      }
      return true;
    }
  }

  /* ---------- DOM refs ---------- */
  // Wait for DOM to be ready
  const waitForDOM = () => {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  };

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

    editCourseForm: document.getElementById('editCourseForm'),
    editCourseTitle: document.getElementById('editCourseTitle'),
    editCourseDesc: document.getElementById('editCourseDesc'),
    editCourseStatus: document.getElementById('editCourseStatus'),
    editCourseStatusLabel: document.getElementById('editCourseStatusLabel'),
    saveEditCourseBtn: document.getElementById('saveEditCourseBtn'),
    cancelEditCourseBtn: document.getElementById('cancelEditCourseBtn'),
    editCourseMsg: document.getElementById('editCourseMsg'),
  };

  function escapeHTML(s = '') { return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }

  /* ---------- Header / pages ---------- */
  function updateHeader() {
    const header = document.querySelector('.site-header');
    if (current) {
      refs.roleBadge.innerHTML = `<i class="fa-solid fa-user"></i> ${escapeHTML(current.name)} (${current.role})`;
      refs.btnLogout.classList.remove('hidden');
      if (current.role === 'instructor' || current.role === 'admin') refs.navCreate.classList.remove('hidden'); else refs.navCreate.classList.add('hidden');
      // Show header when user is logged in
      if (header) header.style.display = 'flex';
    } else {
      refs.roleBadge.innerHTML = `<i class="fa-solid fa-user"></i> Guest`;
      refs.btnLogout.classList.add('hidden');
      refs.navCreate.classList.add('hidden');
      // Hide header when user is logged out (on login page)
      if (header && !refs.loginCard.classList.contains('hidden')) {
        header.style.display = 'none';
      } else if (header) {
        header.style.display = 'flex';
      }
    }
  }
  function hideAllPages() {
    refs.loginCard.classList.add('hidden'); refs.catalogPage.classList.add('hidden'); refs.courseDetailPage.classList.add('hidden'); refs.dashboardPage.classList.add('hidden'); refs.createPage.classList.add('hidden'); refs.adminPanel.classList.add('hidden'); refs.createCourseMsg.textContent = '';
    refs.createQuizMsg.textContent = '';
    refs.dashboardError.textContent = '';
    // Hide edit course form when switching pages
    if (refs.editCourseForm) {
      refs.editCourseForm.classList.add('hidden');
    }
    // Clear search input when hiding pages
    if (refs.searchCourse) {
      refs.searchCourse.value = '';
    }
  }
  function showLogin() { 
    hideAllPages(); 
    refs.loginCard.classList.remove('hidden');
    // Hide header on login page
    const header = document.querySelector('.site-header');
    if (header) header.style.display = 'none';
    // Clear login form fields to prevent auto-fill
    if (refs.loginEmail) {
      refs.loginEmail.value = '';
      refs.loginEmail.setAttribute('autocomplete', 'off');
    }
    if (refs.loginPassword) {
      refs.loginPassword.value = '';
      refs.loginPassword.setAttribute('autocomplete', 'new-password');
    }
    // Clear any error messages
    if (refs.loginError) {
      refs.loginError.textContent = '';
    }
  }

  /* ---------- Inactivity auto logout ---------- */
  let inactivityTimer = null;
  function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (!current) return;
    inactivityTimer = setTimeout(() => {
      current = null;
      removeToken();
      removeCurrent();
      updateHeader();
      showLogin();
      refs.loginError.textContent = 'You were logged out due to inactivity.';
      // Clear the message after 4 seconds
      setTimeout(() => {
        if (refs.loginError) {
          refs.loginError.textContent = '';
        }
      }, 4000);
    }, INACTIVITY_TIMEOUT_MS);
  }
  ['click', 'keydown', 'mousemove', 'touchstart'].forEach(ev => window.addEventListener(ev, resetInactivityTimer, { passive: true }));

  /* ---------- Boot ---------- */
  // Validate token on page load
  (async () => {
    const isValid = await validateTokenOnLoad();
    if (!isValid || !current) {
      // User is not logged in, show login page
      current = null;
      removeToken();
      removeCurrent();
      updateHeader();
      showLogin();
      // Clear login form fields on page load
      setTimeout(() => {
        if (refs.loginEmail) {
          refs.loginEmail.value = '';
          refs.loginEmail.setAttribute('autocomplete', 'off');
        }
        if (refs.loginPassword) {
          refs.loginPassword.value = '';
          refs.loginPassword.setAttribute('autocomplete', 'new-password');
        }
      }, 100);
    } else {
      // User is logged in, show appropriate page
      updateHeader();
      if (current.role === 'admin') {
        showAdminPanel();
      } else {
        showDashboard();
      }
    }
  })();

  /* ---------- Nav handlers ---------- */
  if (refs.navCatalog) refs.navCatalog.addEventListener('click', (e) => { e.preventDefault(); loadCourses(); });
  if (refs.navDashboard) refs.navDashboard.addEventListener('click', (e) => { e.preventDefault(); if (!current) { showLogin(); refs.loginError.textContent = 'Please login to view the dashboard.'; } else { if (current.role === 'admin') showAdminPanel(); else showDashboard(); } });
  if (refs.navCreate) refs.navCreate.addEventListener('click', (e) => { e.preventDefault(); if (!current || (current.role !== 'instructor' && current.role !== 'admin')) { refs.dashboardError.textContent = 'Create is for instructors/admins only.'; return; } hideAllPages(); refs.createPage.classList.remove('hidden'); });
  if (refs.btnLogout) refs.btnLogout.addEventListener('click', () => {
    current = null;
    removeToken();
    removeCurrent();
    updateHeader();
    showLogin();
    refs.loginError.textContent = 'You logged out.';
    // Clear the message after 3 seconds
    setTimeout(() => {
      if (refs.loginError) {
        refs.loginError.textContent = '';
      }
    }, 3000);
  });

  /* ---------- LOGIN ---------- */
  async function login(email, password) {
    try {
      console.log('Making login request to:', `${API_BASE}/auth/login`);
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Login response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ msg: 'Network error' }));
        throw new Error(errorData.msg || 'Login failed');
      }

      const data = await response.json();
      console.log('Login successful:', data);

      if (!data.token || !data.id || !data.role) {
        throw new Error('Invalid response from server');
      }

      // Store token and user data
      setToken(data.token);
      current = {
        id: data.id,
        name: data.name,
        email: email,
        role: data.role
      };
      saveCurrent(current);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      // Handle network errors specifically
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        return { success: false, error: 'Cannot connect to server. Please ensure the backend is running.' };
      }
      return { success: false, error: error.message };
    }
  }

  if (refs.loginForm) {
    refs.loginForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      refs.loginError.textContent = '';
      const email = refs.loginEmail.value.trim();
      const pass = refs.loginPassword.value;
      if (!email || !pass) { refs.loginError.textContent = 'Enter email and password.'; return; }

      const result = await login(email, pass);
      if (!result.success) {
        refs.loginError.textContent = result.error;
        return;
      }

      updateHeader();
      // clear inputs
      refs.loginEmail.value = ''; refs.loginPassword.value = '';
      if (current.role === 'admin') showAdminPanel(); else showDashboard();
      resetInactivityTimer();
    });
  } else {
    console.error('Login form not found in DOM');
  }

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
  // Store courses globally for search functionality
  let allCourses = [];
  let enrolledCourseIds = new Set(); // Track enrolled course IDs

  async function loadCourses() {
    hideAllPages();
    refs.catalogPage.classList.remove('hidden');
    
    // Clear search input when loading courses - use setTimeout to ensure DOM is ready
    setTimeout(() => {
      if (refs.searchCourse) {
        refs.searchCourse.value = '';
        refs.searchCourse.setAttribute('autocomplete', 'off');
      }
      // Reset filter to "all"
      if (refs.filterLevel) {
        refs.filterLevel.value = 'all';
      }
    }, 0);

    try {
      const response = await fetch(`${API_BASE}/courses`);
      if (!response.ok) {
        throw new Error('Failed to load courses');
      }
      const courses = await response.json();

      // Fetch enrollment status for students
      if (current && current.role === 'student') {
        try {
          const enrollmentResponse = await fetch(`${API_BASE}/student/summary`, {
            headers: {
              'Authorization': `Bearer ${getToken()}`
            }
          });
          
          if (enrollmentResponse.ok) {
            const enrollmentData = await enrollmentResponse.json();
            enrolledCourseIds = new Set(enrollmentData.enrolledCourses.map(c => c.id));
          }
        } catch (error) {
          console.error('Error fetching enrollment status:', error);
          enrolledCourseIds = new Set();
        }
      } else {
        enrolledCourseIds = new Set();
      }

      // Transform backend data to match frontend expectations
      allCourses = courses.map(course => {
        // Try to extract level from description or title, default to 'intermediate'
        let level = 'intermediate';
        const descLower = (course.description || '').toLowerCase();
        const titleLower = (course.title || '').toLowerCase();
        
        if (descLower.includes('beginner') || titleLower.includes('beginner')) {
          level = 'beginner';
        } else if (descLower.includes('advanced') || titleLower.includes('advanced')) {
          level = 'advanced';
        } else if (descLower.includes('intermediate') || titleLower.includes('intermediate')) {
          level = 'intermediate';
        }

        return {
          id: course.id,
          title: course.title,
          desc: course.description || '',
          instructor: course.Instructor?.name || 'Unknown Instructor',
          level: level,
          enrolled: enrolledCourseIds.has(course.id),
          materials: course.CourseMaterials?.map(m => m.title) || [],
          quizzes: course.Quizzes?.map(q => ({
            id: q.id,
            title: q.title,
            questions: q.Questions?.map(question => ({
              q: question.question,
              opts: question.options,
              a: question.correctAnswer
            })) || []
          })) || []
        };
      });

      // Apply current filters
      performSearch();
    } catch (error) {
      console.error('Error loading courses:', error);
      refs.loginError.textContent = 'Failed to load courses. Please try again.';
      showLogin();
    }
  }

  function performSearch() {
    const searchQuery = refs.searchCourse.value.trim().toLowerCase();
    const levelFilter = refs.filterLevel.value;

    let filtered = allCourses;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchQuery) || 
        c.desc.toLowerCase().includes(searchQuery) ||
        c.instructor.toLowerCase().includes(searchQuery)
      );
    }

    // Apply level filter
    if (levelFilter && levelFilter !== 'all') {
      filtered = filtered.filter(c => c.level === levelFilter);
    }

    renderCoursesGrid(filtered);
  }

  refs.searchCourse.addEventListener('input', performSearch);
  refs.filterLevel.addEventListener('change', performSearch);

  function renderCoursesGrid(list) {
    refs.coursesGrid.innerHTML = '';
    list.forEach(c => {
      const node = document.createElement('div'); node.className = 'course-card';
      const levelDisplay = c.level ? c.level.charAt(0).toUpperCase() + c.level.slice(1) : 'Intermediate';
      
      // Determine enroll button visibility
      let enrollButton = '';
      if (current && current.role === 'student') {
        if (c.enrolled) {
          enrollButton = '<button class="btn small" disabled style="opacity: 0.5;"><i class="fa-solid fa-check"></i> Enrolled</button>';
        } else {
          enrollButton = `<button class="btn small btn-enroll" data-id="${c.id}"><i class="fa-solid fa-plus"></i> Enroll</button>`;
        }
      } else if (!current || (current.role !== 'instructor' && current.role !== 'admin')) {
        // Show enroll button for non-logged in users or non-instructors
        enrollButton = `<button class="btn small btn-enroll" data-id="${c.id}"><i class="fa-solid fa-plus"></i> Enroll</button>`;
      }
      
      node.innerHTML = `<div>
                          <h4>${escapeHTML(c.title)}</h4>
                          <p class="small muted">${escapeHTML(c.instructor)} • ${levelDisplay}</p>
                          <p>${escapeHTML(c.desc)}</p>
                        </div>
                        <div class="course-actions">
                          <button class="btn small btn-view" data-id="${c.id}"><i class="fa-solid fa-eye"></i> View</button>
                          ${enrollButton}
                        </div>`;
      refs.coursesGrid.appendChild(node);
    });
    refs.coursesGrid.querySelectorAll('.btn-view').forEach(b => b.addEventListener('click', () => openCourseDetail(Number(b.dataset.id))));
    refs.coursesGrid.querySelectorAll('.btn-enroll').forEach(b => b.addEventListener('click', () => enrollFromGrid(Number(b.dataset.id))));
    
    // Hide enroll button for instructors' own courses
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

  /* ---------- MATERIAL VIEWER ---------- */
  function openMaterial(material) {
    console.log('Opening material:', material);
    const modal = document.getElementById('materialViewerModal');
    const titleEl = document.getElementById('materialViewerTitle');
    const contentEl = document.getElementById('materialViewerContent');
    // If course detail page is not visible, don't show modal globally — open in new tab instead
    if (refs.courseDetailPage && refs.courseDetailPage.classList.contains('hidden')) {
      console.warn('Course detail page not visible — opening material in new tab');
      window.open(material.url, '_blank');
      return;
    }
    
    if (!modal || !titleEl || !contentEl) {
      console.error('Material viewer elements not found', { modal, titleEl, contentEl });
      alert('Material viewer not available. Opening in new tab...');
      window.open(material.url, '_blank');
      return;
    }
    
    titleEl.textContent = material.title;
    contentEl.innerHTML = '';
    
    // Ensure modal and content are visible
    modal.style.display = 'block';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    contentEl.style.display = 'block';
    contentEl.style.visibility = 'visible';
    contentEl.style.opacity = '1';
    
    if (material.type === 'video') {
      // Extract YouTube video ID from URL
      let videoId = '';
      if (material.url.includes('youtube.com/embed/')) {
        videoId = material.url.split('youtube.com/embed/')[1].split('?')[0];
      } else if (material.url.includes('youtube.com/watch?v=')) {
        videoId = material.url.split('youtube.com/watch?v=')[1].split('&')[0];
      } else if (material.url.includes('youtu.be/')) {
        videoId = material.url.split('youtu.be/')[1].split('?')[0];
      }
      
      if (videoId) {
        contentEl.innerHTML = `
          <div style="width:100%;background:#0d0d0e;padding:0;">
            <!-- Video Player -->
            <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin-bottom:20px;border-radius:8px;overflow:hidden;">
              <iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" 
                src="https://www.youtube.com/embed/${videoId}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
              </iframe>
            </div>
            
            <!-- Action Buttons -->
            <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;position:relative;z-index:11000;">
              <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" class="btn" style="flex:1;min-width:180px;text-align:center;padding:12px;background:#ff0000;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;gap:8px;">
                <i class="fa-brands fa-youtube"></i> Open on YouTube
              </a>
              <button onclick="window.open('https://www.youtube.com/watch?v=${videoId}', '_blank')" class="btn secondary" style="flex:1;min-width:180px;padding:12px;background:#333;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;display:inline-flex;align-items:center;justify-content:center;gap:8px;">
                <i class="fa-solid fa-share-from-square"></i> Watch Full Video
              </button>
            </div>
            
            <!-- Info Message -->
            <div style="padding:16px;background:#1a1a1a;border-radius:8px;border-left:4px solid #ff0000;margin-top:12px;position:relative;z-index:10001;">
              <p style="color:#fff;font-size:14px;margin:0;line-height:1.6;">
                <i class="fa-solid fa-info-circle" style="color:#ff0000;margin-right:8px;"></i> 
                <strong>Note:</strong> You can watch the video directly in the modal or open it in full view on YouTube.
              </p>
            </div>
          </div>
        `;
      } else {
        contentEl.innerHTML = `
          <div style="text-align:center;padding:20px;">
            <p style="color:#fff;margin-bottom:12px;">Invalid video URL.</p>
            <a href="${material.url}" target="_blank" class="btn" style="padding:12px 24px;background:#ff0000;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;gap:8px;">
              <i class="fa-solid fa-external-link"></i> Open in New Tab
            </a>
          </div>
        `;
      }
    } else if (material.type === 'pdf') {
      const pdfUrl = material.url;
      const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
      
      // Create a simpler, more visible PDF viewer
      contentEl.innerHTML = `
        <div style="width:100%;background:#0d0d0e;padding:0;">
          <!-- PDF Display Area -->
          <div style="width:100%;height:500px;border:2px solid #333;border-radius:8px;overflow:hidden;background:#fff;margin-bottom:20px;position:relative;">
            <iframe 
              id="pdfViewerIframe"
              src="${pdfUrl}" 
              style="width:100%;height:100%;border:none;background:#fff;display:block;"
              type="application/pdf"
              allowfullscreen>
            </iframe>
            <div id="pdfLoadingMsg" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:#fff;background:rgba(0,0,0,0.8);padding:20px;border-radius:8px;z-index:100;">
              <i class="fa-solid fa-spinner fa-spin" style="font-size:32px;color:#ffd60a;margin-bottom:12px;display:block;"></i>
              <p style="color:#fff;margin:0;">Loading PDF...</p>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;position:relative;z-index:11000;">
            <a href="${pdfUrl}" target="_blank" class="btn" style="flex:1;min-width:180px;text-align:center;padding:12px;background:#ffd60a;color:#000;text-decoration:none;border-radius:6px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;gap:8px;">
              <i class="fa-solid fa-external-link"></i> Open PDF in New Tab
            </a>
            <button id="pdfDownloadBtn" class="btn secondary" style="flex:1;min-width:180px;padding:12px;background:#333;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;display:inline-flex;align-items:center;justify-content:center;gap:8px;">
              <i class="fa-solid fa-download"></i> Download PDF
            </button>
            <button id="pdfGoogleViewerBtn" class="btn secondary" style="flex:1;min-width:180px;padding:12px;background:#333;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;display:inline-flex;align-items:center;justify-content:center;gap:8px;">
              <i class="fa-solid fa-refresh"></i> Try Google Viewer
            </button>
          </div>
          
          <!-- Info Message -->
          <div style="padding:16px;background:#1a1a1a;border-radius:8px;border-left:4px solid #ffd60a;margin-top:12px;position:relative;z-index:10001;">
            <p style="color:#fff;font-size:14px;margin:0;line-height:1.6;">
              <i class="fa-solid fa-info-circle" style="color:#ffd60a;margin-right:8px;"></i> 
              <strong>Note:</strong> If the PDF doesn't display above, click "Open PDF in New Tab" to view it in your browser's PDF viewer. Some PDFs may not load in embedded viewers due to security restrictions.
            </p>
          </div>
        </div>
      `;
      
      // Attach event listeners to buttons after creating content
      setTimeout(() => {
        const downloadBtn = document.getElementById('pdfDownloadBtn');
        const googleViewerBtn = document.getElementById('pdfGoogleViewerBtn');
        
        if (downloadBtn) {
          downloadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.open('${pdfUrl}', '_blank');
          });
        }
        
        if (googleViewerBtn) {
          googleViewerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const iframe = document.getElementById('pdfViewerIframe');
            const loading = document.getElementById('pdfLoadingMsg');
            if (iframe) {
              if (loading) loading.style.display = 'block';
              iframe.src = '${googleViewerUrl}';
              setTimeout(function() {
                if (loading) loading.style.display = 'none';
              }, 2000);
            }
          });
        }
      }, 50);
      
      // Hide loading message after iframe loads or timeout
      setTimeout(() => {
        const iframe = document.getElementById('pdfViewerIframe');
        const loading = document.getElementById('pdfLoadingMsg');
        if (iframe && loading) {
          iframe.onload = function() {
            if (loading) loading.style.display = 'none';
          };
          // Hide loading after 3 seconds regardless
          setTimeout(() => {
            if (loading) loading.style.display = 'none';
          }, 3000);
        }
      }, 100);
    } else {
      contentEl.innerHTML = '<p>Unsupported material type.</p>';
    }
    
    // Show modal - ensure it's visible
    if (modal) {
      modal.style.display = 'block';
      modal.style.visibility = 'visible';
      modal.style.opacity = '1';
      modal.style.position = 'fixed';
      modal.style.top = '50%';
      modal.style.left = '50%';
      modal.style.transform = 'translate(-50%, -50%)';
      modal.style.zIndex = '10000';
      
      // Add backdrop styling
      if (typeof modal.showModal === 'function') {
        try {
          modal.showModal();
        } catch (e) {
          console.log('showModal not available, using fallback');
        }
      }
      
      // Ensure content is visible
      if (contentEl) {
        contentEl.style.display = 'block';
        contentEl.style.visibility = 'visible';
        contentEl.style.opacity = '1';
        contentEl.style.zIndex = '10001';
      }
      
      // Add backdrop overlay
      const backdrop = document.querySelector('dialog[open]::backdrop');
      if (!backdrop) {
        const style = document.createElement('style');
        style.textContent = `
          dialog[open]::backdrop {
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 9999;
          }
        `;
        if (!document.querySelector('style[data-modal-backdrop]')) {
          style.setAttribute('data-modal-backdrop', 'true');
        document.head.appendChild(style);
        }
      }
    }
  }

  /* ---------- COURSE DETAIL & QUIZZES ---------- */
  // Use var for hoisting to avoid temporal-dead-zone errors when functions are called early
  var activeCourseId = null;
  var courseTimerInterval = null;
  var activeQuizTimer = null;
  var currentCourseData = null;
  var courseTimeTracker = null; // Track time spent on course detail page
  var courseTimeStart = null;

  async function trackCourseTime(courseId, minutes) {
    if (!current || current.role !== 'student' || !courseId || !minutes) return;
    
    try {
      await fetch(`${API_BASE}/student/track-time`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ courseId, minutes })
      });
    } catch (error) {
      console.error('Error tracking course time:', error);
    }
  }

  async function openCourseDetail(id) {
    try {
      // Ensure we have an id; if not, try to use currently active course
      if (!id) {
        id = activeCourseId;
      }
      if (!id) {
        throw new Error('No course selected');
      }

      // Stop tracking time for previous course (guard against TDZ/reference errors)
      let prevActive = null;
      try { prevActive = activeCourseId; } catch (e) { prevActive = null; }
      if (prevActive && courseTimeStart && current && current.role === 'student') {
        const minutesSpent = Math.floor((Date.now() - courseTimeStart) / 60000); // Convert to minutes
        if (minutesSpent > 0) {
          await trackCourseTime(prevActive, minutesSpent);
        }
        if (courseTimeTracker) {
          clearInterval(courseTimeTracker);
          courseTimeTracker = null;
        }
      }

      const response = await fetch(`${API_BASE}/courses/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load course details');
      }
      const course = await response.json();

      // Transform backend data
      currentCourseData = {
        id: course.id,
        title: course.title,
        desc: course.description,
        instructor: course.Instructor?.name || 'Unknown Instructor',
        instructorId: course.Instructor?.id || course.instructorId,
        materials: course.CourseMaterials?.map(m => ({
          id: m.id,
          title: m.title,
          type: m.type,
          url: m.url
        })) || [],
        quizzes: course.Quizzes?.map(q => ({
          id: q.id,
          title: q.title,
          questions: q.Questions?.map(question => ({
            q: question.question,
            opts: question.options,
            a: question.correctAnswer
          })) || []
        })) || []
      };

      activeCourseId = id;
      
      // Start tracking time for enrolled students
      if (current && current.role === 'student') {
        courseTimeStart = Date.now();
        // Track time every 1 minute
        courseTimeTracker = setInterval(async () => {
          try {
            if (activeCourseId && courseTimeStart) {
              const minutesSpent = Math.floor((Date.now() - courseTimeStart) / 60000);
              if (minutesSpent >= 1) { // Track every 1 minute
                await trackCourseTime(activeCourseId, 1);
                courseTimeStart = Date.now(); // Reset timer
              }
            }
          } catch (e) {
            console.error('Error in course time tracker:', e);
          }
        }, 60 * 1000); // Check every 1 minute
      }
      
      hideAllPages();
      refs.courseDetailPage.classList.remove('hidden');
      refs.detailTitle.textContent = currentCourseData.title;
      refs.detailInstructor.textContent = `Instructor: ${currentCourseData.instructor}`;
      refs.detailMaterials.innerHTML = '';
      
      if (currentCourseData.materials && currentCourseData.materials.length > 0) {
        // Create a grid container for materials
        const materialsGrid = document.createElement('div');
        materialsGrid.style.display = 'grid';
        materialsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
        materialsGrid.style.gap = '16px';
        materialsGrid.style.marginTop = '12px';
        
        currentCourseData.materials.forEach(m => {
          const materialCard = document.createElement('div');
          materialCard.className = 'material-card';
          materialCard.style.cssText = `
            background: linear-gradient(135deg, #1a1a1a 0%, #0f0f10 100%);
            border: 1px solid #333;
            border-radius: 12px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          `;
          
          // Add hover effect
          materialCard.onmouseenter = function() {
            this.style.transform = 'translateY(-4px)';
            this.style.borderColor = '#ffd60a';
            this.style.boxShadow = '0 8px 24px rgba(255, 214, 10, 0.2)';
          };
          materialCard.onmouseleave = function() {
            this.style.transform = 'translateY(0)';
            this.style.borderColor = '#333';
            this.style.boxShadow = 'none';
          };
          
          const iconColor = m.type === 'video' ? '#ff6b6b' : '#ffd60a';
          const iconBg = m.type === 'video' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(255, 214, 10, 0.1)';
          const icon = m.type === 'video' 
            ? '<i class="fa-solid fa-video"></i>'
            : '<i class="fa-solid fa-file-pdf"></i>';
          
          const typeLabel = m.type === 'video' ? 'Video' : 'PDF';
          
          materialCard.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
              <div style="
                width:48px;
                height:48px;
                border-radius:10px;
                background:${iconBg};
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:20px;
                color:${iconColor};
              ">
                ${icon}
              </div>
              <div style="flex:1">
                <div style="
                  font-size:11px;
                  color:#888;
                  text-transform:uppercase;
                  letter-spacing:0.5px;
                  margin-bottom:4px;
                ">${typeLabel}</div>
                <div style="
                  font-weight:600;
                  color:#fff;
                  font-size:15px;
                  line-height:1.4;
                ">${escapeHTML(m.title)}</div>
              </div>
            </div>
            <div style="
              display:flex;
              align-items:center;
              gap:6px;
              color:#888;
              font-size:12px;
              margin-top:8px;
            ">
              <i class="fa-solid fa-arrow-right"></i>
              <span>Click to view</span>
            </div>
          `;
          
          materialCard.onclick = () => openMaterial(m);
          
          materialsGrid.appendChild(materialCard);
        });
        
        refs.detailMaterials.appendChild(materialsGrid);
      } else {
        refs.detailMaterials.innerHTML = '<p class="muted">No materials available for this course.</p>';
      }

      // QUIZZES
      refs.quizAreaDetail.classList.remove('hidden');

      refs.quizList.innerHTML = '';
      if (currentCourseData.quizzes && currentCourseData.quizzes.length) {
        // For students, fetch attempt information
        if (current && current.role === 'student') {
          try {
            const quizzesResponse = await fetch(`${API_BASE}/student/quizzes/${id}`, {
              headers: {
                'Authorization': `Bearer ${getToken()}`
              }
            });
            
            if (quizzesResponse.ok) {
              const quizzesWithAttempts = await quizzesResponse.json();
              // Create a map of quiz attempts
              const attemptMap = {};
              quizzesWithAttempts.forEach(q => {
                attemptMap[q.id] = q;
              });
              
              // Update currentCourseData with attempt info
              currentCourseData.quizzes = currentCourseData.quizzes.map(q => {
                const attemptInfo = attemptMap[q.id];
                if (attemptInfo) {
                  return {
                    ...q,
                    attempted: attemptInfo.attempted,
                    score: attemptInfo.score,
                    totalQuestions: attemptInfo.totalQuestions,
                    percentage: attemptInfo.percentage,
                    canRetake: attemptInfo.canRetake
                  };
                }
                return q;
              });
            }
          } catch (error) {
            console.error('Error fetching quiz attempts:', error);
          }
        }
        
        currentCourseData.quizzes.forEach((q, i) => {
          const div = document.createElement('div');
          div.className = 'card';
          div.style.marginTop = '8px';

          let actions = '';
          let scoreInfo = '';

          if (current && current.role === 'student') {
            if (q.attempted) {
              if (q.percentage >= 100) {
                scoreInfo = `<div class="small muted" style="color: #7cffb2; margin-top: 4px;">Score: ${q.score}/${q.totalQuestions} (${q.percentage}%) - Completed ✓</div>`;
                actions = `<button class="btn small" disabled style="opacity: 0.5;">Completed</button>`;
              } else {
                scoreInfo = `<div class="small muted" style="color: #ffd60a; margin-top: 4px;">Score: ${q.score}/${q.totalQuestions} (${q.percentage}%)</div>`;
                actions = `<button class="btn small take-quiz" data-id="${q.id}">Retake Quiz</button>`;
              }
            } else {
              actions = `<button class="btn small take-quiz" data-id="${q.id}">Take Quiz</button>`;
            }
          } else if (current && ((current.role === 'instructor' && current.id === course.Instructor?.id) || current.role === 'admin')) {
            actions = `
              <button class="btn small edit-quiz" data-quiz-id="${q.id}">Edit</button>
              <button class="btn small secondary delete-quiz" data-quiz-id="${q.id}">Delete</button>
            `;
          }

          div.innerHTML = `
    <strong>${escapeHTML(q.title)}</strong>
    <div class="small muted">(Quiz)</div>
    ${scoreInfo}
    <div style="margin-top:8px;display:flex;gap:8px">
      ${actions}
    </div>
  `;

          refs.quizList.appendChild(div);
          const takeQuizBtn = div.querySelector('.take-quiz');
          if (takeQuizBtn) {
            takeQuizBtn.addEventListener('click', () => startQuizCountdown(id, i));
          }
          
          const editQuizBtn = div.querySelector('.edit-quiz');
          if (editQuizBtn) {
            editQuizBtn.addEventListener('click', () => editQuiz(q.id));
          }
          
          const deleteQuizBtn = div.querySelector('.delete-quiz');
          if (deleteQuizBtn) {
            deleteQuizBtn.addEventListener('click', () => deleteQuiz(q.id));
          }
        });
      } else {
        refs.quizList.innerHTML = `<p class="small muted">No quizzes yet.</p>`;
      }

      // create quiz visible to admin or course instructor
      if (current && (current.role === 'admin' || (current.role === 'instructor' && current.id === currentCourseData.instructorId))) {
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
        // Check enrollment status
        checkEnrollmentStatus(id).then(isEnrolled => {
          if (isEnrolled) {
            refs.enrollBtnDetail.textContent = 'Enrolled — Go to Dashboard';
            refs.enrollBtnDetail.onclick = () => showDashboard();
          } else {
            refs.enrollBtnDetail.textContent = 'Enroll in Course';
            refs.enrollBtnDetail.onclick = () => enrollCourse(id);
          }
        }).catch(() => {
          refs.enrollBtnDetail.textContent = 'Enroll in Course';
          refs.enrollBtnDetail.onclick = () => enrollCourse(id);
        });
      } else if (current.role === 'instructor') {
        if (current.id === currentCourseData.instructorId) {
          refs.enrollBtnDetail.textContent = 'Edit Course';
          refs.enrollBtnDetail.onclick = () => editCourse(id);
        } else {
          refs.enrollBtnDetail.textContent = 'Not applicable';
          refs.enrollBtnDetail.onclick = () => { };
        }
      } else if (current.role === 'admin') {
        refs.enrollBtnDetail.textContent = 'Edit Course';
        refs.enrollBtnDetail.onclick = () => editCourse(id);
      }

      // start per-course presence timer if student
      if (courseTimerInterval) clearInterval(courseTimerInterval);
      if (current && current.role === 'student') {
        courseTimerInterval = setInterval(() => {
          // Note: Timer functionality removed as it's not part of backend API
          // This can be re-implemented if needed
        }, 1000);
      }
    } catch (error) {
      console.error('Error loading course detail:', error);
      alert('Failed to load course details: ' + error.message);
      loadCourses();
    }
  }
  refs.backToCatalogBtn.addEventListener('click', async () => { 
    // Stop tracking time when leaving course detail
    if (activeCourseId && courseTimeStart && current && current.role === 'student') {
      const minutesSpent = Math.floor((Date.now() - courseTimeStart) / 60000);
      if (minutesSpent > 0) {
        await trackCourseTime(activeCourseId, minutesSpent);
      }
      courseTimeStart = null;
    }
    if (courseTimerInterval) { clearInterval(courseTimerInterval); courseTimerInterval = null; }
    if (courseTimeTracker) { clearInterval(courseTimeTracker); courseTimeTracker = null; }
    loadCourses(); 
  });

  /* ---------- ENROLL ---------- */
  async function checkEnrollmentStatus(courseId) {
    try {
      const response = await fetch(`${API_BASE}/student/summary`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.enrolledCourses.some(c => c.id === courseId);
    } catch (error) {
      console.error('Error checking enrollment:', error);
      return false;
    }
  }

  async function enrollCourse(id) {
    if (!current || current.role !== 'student') {
      refs.dashboardError.textContent = 'Only students may enroll.';
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/student/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ courseId: id })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to enroll');
      }
      
      // Update enrollment status
      enrolledCourseIds.add(id);
      // Update course data
      const course = allCourses.find(c => c.id === id);
      if (course) {
        course.enrolled = true;
      }

      refs.dashboardError.textContent = 'Successfully enrolled in course!';
      // Refresh course detail to update button
      setTimeout(() => {
        openCourseDetail(id);
        // Also refresh course grid if on catalog page
        if (!refs.catalogPage.classList.contains('hidden')) {
          performSearch();
        }
      }, 1000);
    } catch (error) {
      refs.dashboardError.textContent = error.message;
    }
  }

  async function enrollFromGrid(id) {
    if (!current) {
      showLogin();
      refs.loginError.textContent = 'Please login to enroll.';
      return;
    }
    if (current.role !== 'student') {
      refs.dashboardError.textContent = 'Only students may enroll.';
      return;
    }
    
    // Check if already enrolled
    if (enrolledCourseIds.has(id)) {
      alert('You are already enrolled in this course.');
      return;
    }
    
    await enrollCourse(id);
    
    // Refresh the course grid to update button states
    performSearch();
  }

  /* ---------- CREATE QUIZ (admin/instructor) ---------- */
  refs.createQuizBtn.addEventListener('click', async () => {
    if (!current || (current.role !== 'instructor' && current.role !== 'admin')) {
      refs.createQuizMsg.textContent = 'Only instructors or admin can create quizzes';
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
          question: questionText,
          options: options,
          correctAnswer: correctIndex
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

    try {
      const editingQuizId = refs.createQuizBtn.dataset.editingQuizId;
      
      if (editingQuizId) {
        // Update existing quiz - use admin route for admin, instructor route for instructor
        const endpoint = current && current.role === 'admin' 
          ? `${API_BASE}/admin/quizzes/${editingQuizId}`
          : `${API_BASE}/instructor/quizzes/${editingQuizId}`;
        
        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            title,
            questions
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.msg || 'Failed to update quiz');
        }

        refs.createQuizMsg.textContent = 'Quiz updated successfully';
        refs.createQuizMsg.style.color = '#7cffb2';
        
        // Reset edit mode
        delete refs.createQuizBtn.dataset.editingQuizId;
        refs.createQuizBtn.textContent = 'Create Quiz';
      } else {
        // Create new quiz - use admin route for admin, instructor route for instructor
        const endpoint = current && current.role === 'admin' 
          ? `${API_BASE}/admin/quizzes`
          : `${API_BASE}/instructor/quizzes`;
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            courseId: activeCourseId,
            title,
            questions
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.msg || 'Failed to create quiz');
        }

        refs.createQuizMsg.textContent = 'Quiz created successfully';
        refs.createQuizMsg.style.color = '#7cffb2';
      }

      refs.quizTitle.value = '';
      refs.quizQuestions.value = '';
      setTimeout(() => {
        refs.createQuizMsg.textContent = '';
        refs.createQuizBlock.classList.add('hidden');
        if (activeCourseId) openCourseDetail(activeCourseId);
      }, 800);
    } catch (error) {
      refs.createQuizMsg.textContent = error.message;
      refs.createQuizMsg.style.color = '#ff6b6b';
    }
  });
  refs.cancelCreateQuizBtn.addEventListener('click', () => {
    refs.createQuizBlock.classList.add('hidden');
    refs.quizTitle.value = '';
    refs.quizQuestions.value = '';
    refs.createQuizMsg.textContent = '';
    // Reset edit mode
    delete refs.createQuizBtn.dataset.editingQuizId;
    refs.createQuizBtn.textContent = 'Create Quiz';
  });

  /* ---------- EDIT QUIZ ---------- */
  async function editQuiz(quizId) {
    if (!current || (current.role !== 'instructor' && current.role !== 'admin')) {
      alert('Only instructors or admin can edit quizzes');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/instructor/quizzes/${quizId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to load quiz');
      }

      const quizData = await response.json();

      // Show create quiz block in edit mode
      refs.createQuizBlock.classList.remove('hidden');
      refs.quizTitle.value = quizData.title;
      
      // Convert questions to text format
      let questionsText = '';
      quizData.questions.forEach((q, index) => {
        questionsText += `Q: ${q.question}\n`;
        q.options.forEach((opt, optIndex) => {
          const letter = String.fromCharCode(65 + optIndex); // A, B, C, D
          questionsText += `${letter}) ${opt}\n`;
        });
        // Find correct answer index
        const correctIndex = typeof q.correctAnswer === 'number' ? q.correctAnswer : q.options.findIndex(opt => opt === q.correctAnswer);
        const correctLetter = String.fromCharCode(65 + (correctIndex >= 0 ? correctIndex : 0));
        questionsText += `ANS: ${correctLetter}\n\n`;
      });
      
      refs.quizQuestions.value = questionsText.trim();
      refs.createQuizBtn.dataset.editingQuizId = quizId;
      refs.createQuizBtn.textContent = 'Update Quiz';
      refs.createQuizMsg.textContent = '';
      
      // Scroll to form
      refs.createQuizBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
      console.error('Error loading quiz for edit:', error);
      alert('Failed to load quiz: ' + error.message);
    }
  }

  /* ---------- DELETE QUIZ ---------- */
  async function deleteQuiz(quizId) {
    if (!current || (current.role !== 'instructor' && current.role !== 'admin')) {
      alert('Only instructors or admin can delete quizzes');
      return;
    }

    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      // Use admin route for admin, instructor route for instructor
      const endpoint = current.role === 'admin' 
        ? `${API_BASE}/admin/quizzes/${quizId}`
        : `${API_BASE}/instructor/quizzes/${quizId}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to delete quiz');
      }

      alert('Quiz deleted successfully');
      // Refresh course detail
      if (activeCourseId) openCourseDetail(activeCourseId);
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Failed to delete quiz: ' + error.message);
    }
  }

  /* ---------- TAKING TIMED QUIZ ---------- */
  async function startQuizCountdown(courseId, quizIndex) {
    // Only students can take quizzes
    if (!current || current.role !== 'student') {
      return;
    }

    // Validate inputs
    if (typeof courseId !== 'number' || typeof quizIndex !== 'number') {
      return;
    }

    // Get quiz data from currentCourseData
    if (!currentCourseData || !currentCourseData.quizzes || !currentCourseData.quizzes[quizIndex]) {
      return;
    }

    const quiz = currentCourseData.quizzes[quizIndex];

    // Get quiz questions from API
    try {
      const response = await fetch(`${API_BASE}/student/quiz/${quiz.id}/questions`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!response.ok) {
        let errorMsg = 'Cannot access this quiz';
        try {
          const error = await response.json();
          errorMsg = error.msg || errorMsg;
        } catch (e) {
          // If response is not JSON (e.g., HTML error page)
          errorMsg = `Server error (${response.status}). Please try again.`;
        }
        alert(errorMsg);
        return;
      }

      const quizData = await response.json();
      
      // Show retake message if applicable
      if (quizData.allowRetake && quizData.previousScore !== null) {
        const totalQ = quizData.questions.length;
        const retakeMsg = `Previous attempt: ${quizData.previousScore}/${totalQ} (${quizData.previousPercentage}%). You can retake this quiz to improve your score.`;
        if (confirm(retakeMsg + '\n\nClick OK to retake the quiz.')) {
          renderQuizInterface(quizData);
        }
        return;
      }
      
      renderQuizInterface(quizData);
    } catch (error) {
      console.error('Failed to load quiz:', error);
      alert('Failed to load quiz: ' + error.message);
    }
  }

  function renderQuizInterface(quizData) {
    refs.quizList.innerHTML = `<div class="card"><h4>${escapeHTML(quizData.quizTitle)}</h4><div id="quizTimer" class="small muted"></div><div id="quizQuestionsArea"></div></div>`;
    const qArea = document.getElementById('quizQuestionsArea');

    const questions = quizData.questions || [];

    questions.forEach((q) => {
      const dd = document.createElement('div');
      dd.style.marginBottom = '14px';
      dd.style.fontSize = '1rem';
      dd.innerHTML = `<div style="font-weight:600;margin-bottom:6px">${escapeHTML(q.question)}</div>`;

      const options = Array.isArray(q.options) ? q.options : [];
      options.forEach((opt, j) => {
        const lbl = document.createElement('label');
        lbl.style.display = 'block';
        lbl.style.marginBottom = '6px';
        lbl.style.cursor = 'pointer';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `q_${q.id}`;
        radio.value = j;
        radio.style.marginRight = '8px';

        const text = document.createElement('span');
        text.textContent = opt;

        lbl.appendChild(radio);
        lbl.appendChild(text);
        dd.appendChild(lbl);
      });
      qArea.appendChild(dd);
    });

    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn';
    submitBtn.textContent = 'Submit';
    submitBtn.addEventListener('click', () => finalizeQuizAttempt(quizData.quizId));
    qArea.appendChild(submitBtn);

    // timer
    let remaining = 300; // default 5 minutes
    const timerEl = document.getElementById('quizTimer');
    timerEl.textContent = `Time remaining: ${formatTime(remaining)}`;
    if (activeQuizTimer) clearInterval(activeQuizTimer);
    activeQuizTimer = setInterval(() => {
      remaining -= 1;
      timerEl.textContent = `Time remaining: ${formatTime(remaining)}`;
      if (remaining <= 0) {
        clearInterval(activeQuizTimer);
        activeQuizTimer = null;
        alert('Time is up — submitting quiz automatically.');
        finalizeQuizAttempt(quizData.quizId);
      }
    }, 1000);
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60); const s = sec % 60; return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  async function finalizeQuizAttempt(quizId) {
    // Collect answers - use question IDs as keys
    const answers = {};
    const questionElements = document.querySelectorAll('#quizQuestionsArea > div');

    questionElements.forEach((div) => {
      const radioInputs = div.querySelectorAll('input[type="radio"]');
      if (radioInputs.length > 0) {
        const questionId = radioInputs[0].name.replace('q_', '');
        const selected = div.querySelector(`input[name="q_${questionId}"]:checked`);
        if (selected) {
          answers[questionId] = selected.value; // Store answer index as string
        }
      }
    });

    try {
      const response = await fetch(`${API_BASE}/student/attempt-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ quizId, answers })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to submit quiz');
      }

      const score = data.score;
      const total = data.total;
      const percent = Math.round((score / total) * 100);

      alert(`You scored ${score}/${total} (${percent}%)`);
      renderDashboard();
      if (activeCourseId) openCourseDetail(activeCourseId);
    } catch (error) {
      alert('Failed to submit quiz: ' + error.message);
    }

    // Clear timer
    if (activeQuizTimer) {
      clearInterval(activeQuizTimer);
      activeQuizTimer = null;
    }
  }

  refs.createCourseBtn.addEventListener('click', async () => {
    if (!current || (current.role !== 'instructor' && current.role !== 'admin')) {
      refs.createCourseMsg.textContent = 'Only instructors or admin can create courses';
      refs.createCourseMsg.style.color = '#ff6b6b';
      return;
    }

    const title = refs.createTitle.value.trim();
    const desc = refs.createDesc.value.trim();

    if (!title || !desc) {
      refs.createCourseMsg.textContent = 'Provide title & description';
      refs.createCourseMsg.style.color = '#ff6b6b';
      return;
    }

    try {
      // Use admin endpoint if admin, instructor endpoint if instructor
      const endpoint = current.role === 'admin' 
        ? `${API_BASE}/admin/courses`
        : `${API_BASE}/instructor/courses`;
      
      const body = current.role === 'admin'
        ? { title, description: desc, instructorId: current.id } // Admin can assign instructor
        : { title, description: desc };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to create course');
      }

      refs.createCourseMsg.textContent = 'Course created successfully';
      refs.createCourseMsg.style.color = '#7cffb2';

      refs.createTitle.value = '';
      refs.createDesc.value = '';

      setTimeout(() => {
        refs.createCourseMsg.textContent = '';
        loadCourses();
      }, 1500);
    } catch (error) {
      refs.createCourseMsg.textContent = error.message;
      refs.createCourseMsg.style.color = '#ff6b6b';
    }
  });


  /* ---------- DASHBOARD ---------- */
  function showDashboard() { hideAllPages(); refs.dashboardPage.classList.remove('hidden'); renderDashboard(); resetInactivityTimer(); }
  async function renderDashboard() {
    refs.dashboardError.textContent = '';
    refs.dashLeft.innerHTML = '';
    refs.dashRight.innerHTML = '';
    refs.timeChartWrapper.classList.add('hidden');
    refs.marksWrapper.classList.add('hidden');

    if (!current) {
      refs.dashboardError.textContent = 'Please login.';
      return;
    }

    try {
      if (current.role === 'student') {
        await renderStudentDashboard();
      } else if (current.role === 'instructor') {
        await renderInstructorDashboard();
      } else if (current.role === 'admin') {
        await renderAdminDashboard();
      }
    } catch (error) {
      refs.dashboardError.textContent = 'Failed to load dashboard: ' + error.message;
    }
  }

  async function renderStudentDashboard() {
    const response = await fetch(`${API_BASE}/student/summary`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load student summary');
    }

    const data = await response.json();

    // Left side - enrolled courses
    const w1 = document.createElement('div');
    w1.className = 'dash-widget';
    w1.innerHTML = '<h3>My Enrolled Courses</h3>';

    if (data.enrolledCourses.length === 0) {
      w1.innerHTML += '<p class="muted">No enrollments yet.</p>';
    } else {
      data.enrolledCourses.forEach(enrollment => {
        const course = enrollment;
        const progress = enrollment.progress || 0;
        const row = document.createElement('div');
        row.style.marginTop = '10px';

        row.innerHTML = `
          <strong>${escapeHTML(course.title)}</strong>
          <div class="progress"><i style="width:${progress}%;"></i></div>
          <div style="margin-top:8px;display:flex;gap:8px">
            <button class="btn small" onclick="openCourseDetail(${course.id})">Open</button>
          </div>
        `;

        w1.appendChild(row);
      });
    }

    refs.dashLeft.appendChild(w1);

    // Right side - summary and pending quizzes
    const w2 = document.createElement('div');
    w2.className = 'dash-widget';
    w2.innerHTML = `
      <h3>Summary</h3>
      <p>Completed Courses: ${data.completedCourses}</p>
      <p>Pending Courses: ${data.pendingCourses}</p>
      <p>Average Quiz Score: ${data.averageScore}%</p>
    `;
    refs.dashRight.appendChild(w2);

    // Time Spent Chart
    if (data.enrolledCourses.length > 0) {
      const timeData = data.enrolledCourses.map(e => ({
        course: e.title,
        time: e.timeSpent || 0
      })).filter(d => d.time > 0);

      if (timeData.length > 0) {
        refs.timeChartWrapper.classList.remove('hidden');
        const ctx = refs.timeChartCanvas.getContext('2d');
        
        // Destroy existing chart if any
        if (window.timeChartInstance) {
          window.timeChartInstance.destroy();
        }

        // Wait a bit for canvas to be ready
        setTimeout(() => {
          window.timeChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: timeData.map(d => d.course.length > 20 ? d.course.substring(0, 20) + '...' : d.course),
              datasets: [{
                label: 'Time Spent (minutes)',
                data: timeData.map(d => d.time),
                backgroundColor: '#ffd60a',
                borderColor: '#ffd60a',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  labels: {
                    color: '#f3f3f3'
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: '#f3f3f3'
                  },
                  grid: {
                    color: '#333'
                  }
                },
                x: {
                  ticks: {
                    color: '#f3f3f3',
                    maxRotation: 45,
                    minRotation: 45
                  },
                  grid: {
                    color: '#333'
                  }
                }
              }
            }
          });
        }, 100);
      }
    }

    // Scores per Course Chart
    if (data.enrolledCourses.length > 0) {
      const scoreData = data.enrolledCourses
        .filter(e => e.attemptedQuizzes > 0)
        .map(e => ({
          course: e.title,
          score: e.averageScore || 0,
          attempted: e.attemptedQuizzes,
          total: e.totalQuizzes
        }));

      if (scoreData.length > 0) {
        refs.marksWrapper.classList.remove('hidden');
        
        // Update marks table
        refs.marksTableBody.innerHTML = '';
        scoreData.forEach(d => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${escapeHTML(d.course)}</td>
            <td>${d.attempted}/${d.total}</td>
            <td>${d.score}%</td>
          `;
          refs.marksTableBody.appendChild(row);
        });

        // Update marks chart
        const ctx2 = refs.marksChart.getContext('2d');
        
        // Destroy existing chart if any
        if (window.marksChartInstance) {
          window.marksChartInstance.destroy();
        }

        // Wait a bit for canvas to be ready
        setTimeout(() => {
          window.marksChartInstance = new Chart(ctx2, {
            type: 'line',
            data: {
              labels: scoreData.map(d => d.course.length > 20 ? d.course.substring(0, 20) + '...' : d.course),
              datasets: [{
                label: 'Average Score (%)',
                data: scoreData.map(d => d.score),
                borderColor: '#7cffb2',
                backgroundColor: 'rgba(124, 255, 178, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  labels: {
                    color: '#f3f3f3'
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    color: '#f3f3f3'
                  },
                  grid: {
                    color: '#333'
                  }
                },
                x: {
                  ticks: {
                    color: '#f3f3f3',
                    maxRotation: 45,
                    minRotation: 45
                  },
                  grid: {
                    color: '#333'
                  }
                }
              }
            }
          });
        }, 100);
      }
    }

    // Fetch and display pending quizzes
    try {
      const pendingQuizzes = [];
      for (const enrollment of data.enrolledCourses) {
        const quizzesResponse = await fetch(`${API_BASE}/student/quizzes/${enrollment.id}`, {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        });
        
        if (quizzesResponse.ok) {
          const quizzes = await quizzesResponse.json();
          for (const quiz of quizzes) {
            // Check if quiz is attempted
            if (!quiz.attempted || (quiz.attempted && quiz.canRetake)) {
              pendingQuizzes.push({
                courseId: enrollment.id,
                courseTitle: enrollment.title,
                quizId: quiz.id,
                quizTitle: quiz.title,
                attempted: quiz.attempted,
                previousScore: quiz.previousScore,
                previousPercentage: quiz.previousPercentage
              });
            }
          }
        }
      }

      if (pendingQuizzes.length > 0) {
        const w3 = document.createElement('div');
        w3.className = 'dash-widget';
        w3.style.marginTop = '16px';
        w3.innerHTML = '<h3>Pending Quizzes</h3>';
        
        pendingQuizzes.forEach(pq => {
          const row = document.createElement('div');
          row.style.marginTop = '10px';
          row.style.padding = '8px';
          row.style.border = '1px solid #333';
          row.style.borderRadius = '4px';
          
          let scoreInfo = '';
          if (pq.attempted && pq.previousScore !== null && pq.previousPercentage !== null) {
            scoreInfo = `<div class="small muted" style="color: #ffd60a; margin-top: 4px;">Previous Score: ${pq.previousScore} (${pq.previousPercentage}%)</div>`;
          }
          
          const buttonText = pq.attempted ? 'Retake Quiz' : 'Take Quiz';
          
          row.innerHTML = `
            <div>
              <strong>${escapeHTML(pq.quizTitle)}</strong>
              <div class="small muted">Course: ${escapeHTML(pq.courseTitle)}</div>
              ${scoreInfo}
              <button class="btn small" onclick="openCourseDetail(${pq.courseId})" style="margin-top:8px">${buttonText}</button>
            </div>
          `;
          w3.appendChild(row);
        });
        
        refs.dashRight.appendChild(w3);
      }
    } catch (error) {
      console.error('Error loading pending quizzes:', error);
    }
  }

  async function renderInstructorDashboard() {
    const response = await fetch(`${API_BASE}/instructor/analytics`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load instructor analytics');
    }

    const analytics = await response.json();

    // Left side - courses analytics
    const w1 = document.createElement('div');
    w1.className = 'dash-widget';
    w1.innerHTML = '<h3>My Courses Analytics</h3>';

    if (analytics.length === 0) {
      w1.innerHTML += '<p class="muted">No courses yet.</p>';
    } else {
      analytics.forEach(course => {
        const row = document.createElement('div');
        row.style.marginTop = '10px';

        row.innerHTML = `
          <strong>${escapeHTML(course.courseTitle)}</strong>
          <p>Students Enrolled: ${course.studentsEnrolled}</p>
          <p>Average Score: ${course.averageScore}%</p>
          <div style="margin-top:8px">
            <button class="btn small" onclick="openCourseDetail(${course.courseId})">Manage Course</button>
          </div>
        `;

        w1.appendChild(row);
      });
    }

    refs.dashLeft.appendChild(w1);

    // Right side - summary
    const totalStudents = analytics.reduce((sum, c) => sum + c.studentsEnrolled, 0);
    const avgScore = analytics.length > 0
      ? Math.round(analytics.reduce((sum, c) => sum + parseFloat(c.averageScore), 0) / analytics.length)
      : 0;

    const w2 = document.createElement('div');
    w2.className = 'dash-widget';
    w2.innerHTML = `
      <h3>Summary</h3>
      <p>Total Courses: ${analytics.length}</p>
      <p>Total Students: ${totalStudents}</p>
      <p>Overall Average Score: ${avgScore}%</p>
    `;
    refs.dashRight.appendChild(w2);
  }

  async function renderAdminDashboard() {
    const response = await fetch(`${API_BASE}/admin/analytics`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load admin analytics');
    }

    const data = await response.json();

    // Left side - system stats
    const w1 = document.createElement('div');
    w1.className = 'dash-widget';
    w1.innerHTML = `
      <h3>System Statistics</h3>
      <p>Total Users: ${data.totalUsers}</p>
      <p>Total Courses: ${data.totalCourses}</p>
      <p>Total Enrollments: ${data.totalEnrollments}</p>
      <p>Total Quiz Attempts: ${data.totalQuizAttempts}</p>
    `;

    refs.dashLeft.appendChild(w1);

    // Right side - performance
    const w2 = document.createElement('div');
    w2.className = 'dash-widget';
    w2.innerHTML = `
      <h3>Performance</h3>
      <p>Average Quiz Score: ${Math.round(data.averageQuizScore)}%</p>
      <div style="margin-top:12px">
        <button class="btn small" onclick="showAdminPanel()">Manage System</button>
      </div>
    `;
    refs.dashRight.appendChild(w2);
  }


  window.openCourseFromDash = function (id) { openCourseDetail(id); };
  window.markComplete = function (id) { 
    // Progress tracking can be implemented via API if needed
    console.log('Mark complete for course:', id);
    renderDashboard(); 
  };


  // Time chart and marks table functions removed - can be re-implemented using API data if needed
  function renderTimeChart(userTimes) {
    console.log('Time chart rendering not implemented');
  }

  function renderMarksTable() {
    console.log('Marks table rendering not implemented');
  }

  /* ---------- ADMIN ---------- */
  function showAdminPanel() { 
    if (!current || current.role !== 'admin') { 
      showLogin(); 
      refs.loginError.textContent = 'Admin access only.'; 
      return; 
    } 
    hideAllPages(); 
    refs.adminPanel.classList.remove('hidden');
    // Hide edit form when switching to admin panel
    if (refs.editCourseForm) {
      refs.editCourseForm.classList.add('hidden');
    }
    renderAdmin(); 
  }
  async function renderAdmin() {
    try {
      // Load admin analytics
      const analyticsResponse = await fetch(`${API_BASE}/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!analyticsResponse.ok) {
        throw new Error('Failed to load admin analytics');
      }

      const analytics = await analyticsResponse.json();

      refs.adminUserCount.textContent = analytics.totalUsers;
      refs.adminCourseCount.textContent = analytics.totalCourses;
      refs.adminEnrollCount.textContent = analytics.totalEnrollments;

      // Load quiz analytics
      const quizResponse = await fetch(`${API_BASE}/admin/quiz-analytics`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (quizResponse.ok) {
        const quizData = await quizResponse.json();
        refs.adminAnalytics.innerHTML = '<h4>Quiz Analytics</h4>';
        quizData.forEach(quiz => {
          refs.adminAnalytics.innerHTML += `<div class="small">${escapeHTML(quiz.title)} — ${quiz.totalAttempts} attempts, ${quiz.averageScore}% avg</div>`;
        });
      } else {
        refs.adminAnalytics.innerHTML = '<h4>Analytics</h4><p>Failed to load quiz analytics</p>';
      }
      // Load and display users
      const usersResponse = await fetch(`${API_BASE}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (usersResponse.ok) {
        const users = await usersResponse.json();
        const usersList = document.createElement('div');
        usersList.className = 'admin-list';
        
        users.forEach(user => {
          const row = document.createElement('div');
          row.className = 'admin-row';
          row.style.display = 'flex';
          row.style.justifyContent = 'space-between';
          row.style.alignItems = 'center';
          row.style.padding = '8px';
          row.style.marginBottom = '8px';
          row.style.border = '1px solid #333';
          row.style.borderRadius = '4px';
          
          row.innerHTML = `
            <div>
              <strong>${escapeHTML(user.name)}</strong>
              <div class="small muted">${escapeHTML(user.email)} • ${escapeHTML(user.role)}</div>
            </div>
            <div style="display:flex;gap:8px">
              ${user.id !== current.id ? `<button class="btn small secondary" onclick="deleteUser(${user.id})">Delete</button>` : '<span class="small muted">Current User</span>'}
            </div>
          `;
          
          usersList.appendChild(row);
        });
        
        // Create user form
        const addUserForm = document.createElement('div');
        addUserForm.className = 'card';
        addUserForm.style.marginBottom = '16px';
        addUserForm.innerHTML = `
          <h4>Add New User</h4>
          <div class="form">
            <label class="label">Name</label>
            <input id="newUserName" type="text" placeholder="Full Name" autocomplete="off" />
            <label class="label">Email</label>
            <input id="newUserEmail" type="email" placeholder="user@example.com" autocomplete="off" />
            <label class="label">Password</label>
            <input id="newUserPassword" type="password" placeholder="Password" autocomplete="new-password" />
            <label class="label">Role</label>
            <select id="newUserRole">
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
            <button class="btn small" onclick="addNewUser()" style="margin-top:8px">Add User</button>
            <p id="addUserMsg" class="success-msg" style="margin-top:8px"></p>
          </div>
        `;
        
        // Clear form fields after creating to prevent auto-fill
        setTimeout(() => {
          const nameInput = document.getElementById('newUserName');
          const emailInput = document.getElementById('newUserEmail');
          const passwordInput = document.getElementById('newUserPassword');
          if (nameInput) nameInput.value = '';
          if (emailInput) emailInput.value = '';
          if (passwordInput) passwordInput.value = '';
        }, 0);
        
        refs.adminUsers.innerHTML = '';
        refs.adminUsers.appendChild(addUserForm);
        refs.adminUsers.appendChild(document.createElement('h4')).textContent = 'All Users';
        refs.adminUsers.appendChild(usersList);
      } else {
        refs.adminUsers.innerHTML = '<p>Failed to load users</p>';
      }

      // Load and display courses
      const coursesResponse = await fetch(`${API_BASE}/admin/courses`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (coursesResponse.ok) {
        const courses = await coursesResponse.json();
        const coursesList = document.createElement('div');
        coursesList.className = 'admin-list';
        
        courses.forEach(course => {
          const row = document.createElement('div');
          row.className = 'admin-row';
          row.style.display = 'flex';
          row.style.justifyContent = 'space-between';
          row.style.alignItems = 'center';
          row.style.padding = '8px';
          row.style.marginBottom = '8px';
          row.style.border = '1px solid #333';
          row.style.borderRadius = '4px';
          
          row.innerHTML = `
            <div>
              <strong>${escapeHTML(course.title)}</strong>
              <div class="small muted">${escapeHTML(course.Instructor?.name || 'No Instructor')} • ${escapeHTML(course.status || 'draft')}</div>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn small" onclick="openCourseDetail(${course.id})">View</button>
              <button class="btn small" onclick="editCourse(${course.id})">Edit</button>
              <button class="btn small secondary" onclick="deleteCourse(${course.id})">Delete</button>
            </div>
          `;
          
          coursesList.appendChild(row);
        });
        
        refs.adminCourses.innerHTML = '<h4>Courses</h4>';
        refs.adminCourses.appendChild(coursesList);
      } else {
        refs.adminCourses.innerHTML = '<p>Failed to load courses</p>';
      }

    } catch (error) {
      refs.adminUserCount.textContent = 'Error';
      refs.adminCourseCount.textContent = 'Error';
      refs.adminEnrollCount.textContent = 'Error';
      refs.adminAnalytics.innerHTML = '<p>Failed to load analytics</p>';
      refs.adminUsers.innerHTML = '<p>Error loading users</p>';
      refs.adminCourses.innerHTML = '<p>Error loading courses</p>';
    }
  }

  /* ---------- Add user helper ---------- */
  async function addNewUser() {
    if (!current || current.role !== 'admin') {
      alert('Only admins can add users');
      return;
    }

    const name = document.getElementById('newUserName')?.value.trim();
    const email = document.getElementById('newUserEmail')?.value.trim();
    const password = document.getElementById('newUserPassword')?.value;
    const role = document.getElementById('newUserRole')?.value;
    const msgEl = document.getElementById('addUserMsg');

    if (!name || !email || !password || !role) {
      if (msgEl) {
        msgEl.textContent = 'All fields are required';
        msgEl.style.color = '#ff6b6b';
      }
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to create user');
      }

      if (msgEl) {
        msgEl.textContent = 'User created successfully!';
        msgEl.style.color = '#7cffb2';
      }

      // Clear form
      document.getElementById('newUserName').value = '';
      const emailInput = document.getElementById('newUserEmail');
      const passwordInput = document.getElementById('newUserPassword');
      const nameInput = document.getElementById('newUserName');
      const roleSelect = document.getElementById('newUserRole');
      if (emailInput) {
        emailInput.value = '';
        emailInput.setAttribute('autocomplete', 'off');
      }
      if (passwordInput) {
        passwordInput.value = '';
        passwordInput.setAttribute('autocomplete', 'new-password');
      }
      if (nameInput) {
        nameInput.value = '';
        nameInput.setAttribute('autocomplete', 'off');
      }
      if (roleSelect) roleSelect.value = 'student';

      // Refresh user list and analytics
      setTimeout(() => {
        renderAdmin();
        // Also refresh dashboard analytics if on dashboard
        if (!refs.dashboardPage.classList.contains('hidden')) {
          renderAdminDashboard();
        }
      }, 1000);
    } catch (error) {
      console.error('Error creating user:', error);
      if (msgEl) {
        msgEl.textContent = error.message;
        msgEl.style.color = '#ff6b6b';
      }
    }
  }

  /* ---------- Delete user helper ---------- */
  async function deleteUser(userId) {
    if (!current || current.role !== 'admin') {
      alert('Only admins can delete users');
      return;
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to delete user');
      }

      alert('User deleted successfully');
      renderAdmin(); // Refresh admin panel
      // Also refresh dashboard analytics if on dashboard
      if (!refs.dashboardPage.classList.contains('hidden')) {
        renderAdminDashboard();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + error.message);
    }
  }

  /* ---------- Delete course helper ---------- */
  async function deleteCourse(id) {
    if (!current || current.role !== 'admin') {
      alert('Only admins can delete courses');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/courses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to delete course');
      }

      alert('Course deleted successfully');
      // Refresh admin panel analytics - always refresh if admin panel was visible
      if (!refs.adminPanel.classList.contains('hidden')) {
        await renderAdmin(); // Wait for analytics to refresh
      }
      // Clear search input before loading courses
      if (refs.searchCourse) {
        refs.searchCourse.value = '';
      }
      loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course: ' + error.message);
    }
  }

  /* ---------- Edit course helper (Modal-based) ---------- */
  let editingCourseId = null;

  async function editCourse(id) {
    if (!current || (current.role !== 'admin' && current.role !== 'instructor')) {
      alert('Only admins or instructors can edit courses');
      return;
    }

    // Only allow editing from admin panel for now (or course detail for instructors)
    if (current.role === 'admin' && refs.adminPanel.classList.contains('hidden')) {
      // If not in admin panel, switch to admin panel first
      showAdminPanel();
    }

    try {
      const response = await fetch(`${API_BASE}/courses/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load course');
      }
      const course = await response.json();

      // Check if instructor owns the course
      if (current.role === 'instructor' && course.instructorId !== current.id) {
        alert('You can only edit your own courses');
        return;
      }

      // Store course ID for save function
      editingCourseId = id;

      // Populate form with current course data
      refs.editCourseTitle.value = course.title || '';
      refs.editCourseDesc.value = course.description || '';
      
      // Show/hide status field based on role
      if (current.role === 'admin') {
        refs.editCourseStatus.value = course.status || 'draft';
        refs.editCourseStatus.style.display = 'block';
        refs.editCourseStatusLabel.style.display = 'block';
      } else {
        refs.editCourseStatus.style.display = 'none';
        refs.editCourseStatusLabel.style.display = 'none';
      }

      // Clear previous messages
      refs.editCourseMsg.textContent = '';
      refs.editCourseMsg.style.color = '';

      // Show form inline in admin panel (only for admin)
      if (current.role === 'admin') {
        // Ensure we're in admin panel
        if (refs.adminPanel.classList.contains('hidden')) {
          showAdminPanel();
        }
        refs.editCourseForm.classList.remove('hidden');
        // Scroll to form
        setTimeout(() => {
          refs.editCourseForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      } else {
        // For instructors, they can edit from course detail page
        // This function is mainly for admin panel
        alert('Instructor course editing available from course detail page');
      }
    } catch (error) {
      console.error('Error loading course:', error);
      alert('Failed to load course: ' + error.message);
    }
  }

  // Save edited course
  async function saveEditCourse() {
    if (!editingCourseId) return;

    const title = refs.editCourseTitle.value.trim();
    const description = refs.editCourseDesc.value.trim();
    const status = refs.editCourseStatus.value;

    if (!title || !description) {
      refs.editCourseMsg.textContent = 'Title and description are required';
      refs.editCourseMsg.style.color = '#ff6b6b';
      return;
    }

    try {
      const endpoint = current.role === 'admin' 
        ? `${API_BASE}/admin/courses/${editingCourseId}`
        : `${API_BASE}/instructor/courses/${editingCourseId}`;
      
      const body = current.role === 'admin'
        ? { title, description, status }
        : { title, description };
      
      const updateResponse = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(body)
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        throw new Error(error.msg || 'Failed to update course');
      }

      refs.editCourseMsg.textContent = 'Course updated successfully';
      refs.editCourseMsg.style.color = '#7cffb2';

      // Close form after success
      setTimeout(async () => {
        const courseId = editingCourseId;
        refs.editCourseForm.classList.add('hidden');
        editingCourseId = null;
        
        // Refresh admin panel if visible
        if (!refs.adminPanel.classList.contains('hidden')) {
          await renderAdmin(); // Wait for analytics to refresh
        }
        // Refresh course detail if viewing this course
        if (activeCourseId === courseId) {
          openCourseDetail(courseId);
        }
        // Clear search input before loading courses
        if (refs.searchCourse) {
          refs.searchCourse.value = '';
        }
        loadCourses();
      }, 1000);
    } catch (error) {
      console.error('Error updating course:', error);
      refs.editCourseMsg.textContent = 'Failed to update course: ' + error.message;
      refs.editCourseMsg.style.color = '#ff6b6b';
    }
  }

  // Close edit course form
  function closeEditCourseForm() {
    refs.editCourseForm.classList.add('hidden');
    editingCourseId = null;
    refs.editCourseTitle.value = '';
    refs.editCourseDesc.value = '';
    refs.editCourseMsg.textContent = '';
  }

  // Event listeners for edit course form
  refs.saveEditCourseBtn.addEventListener('click', saveEditCourse);
  refs.cancelEditCourseBtn.addEventListener('click', closeEditCourseForm);

  /* ---------- Helper: open create page ---------- */
  window.openCreatePage = function () { hideAllPages(); refs.createPage.classList.remove('hidden'); };

  /* ---------- small helpers ---------- */
  // Legacy save functions removed - all data now comes from API

  /* ---------- expose ---------- */
  window.loadCourses = loadCourses;
  window.openCourseDetail = openCourseDetail;
  window.showLogin = showLogin;
  window.deleteUser = deleteUser;
  window.deleteCourse = deleteCourse;
  window.editCourse = editCourse;
  window.addNewUser = addNewUser;
  window.editQuiz = editQuiz;
  window.deleteQuiz = deleteQuiz;
  window.showAdminPanel = showAdminPanel;
  window.showDashboard = showDashboard;
  window.openMaterial = openMaterial;

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
  
  // Initialize search input - clear any auto-filled values and disable autocomplete
  if (refs.searchCourse) {
    refs.searchCourse.value = '';
    refs.searchCourse.setAttribute('autocomplete', 'off');
    refs.searchCourse.setAttribute('type', 'text');
    // Ensure input is editable
    refs.searchCourse.removeAttribute('readonly');
    refs.searchCourse.removeAttribute('disabled');
  }

  /* ---------- Modal Close Button Handler (initialized at the end) ---------- */
  // Use a named initializer function to attach modal handlers once DOM is ready
  function initModalHandler() {
    const modal = document.getElementById('materialViewerModal');
    const closeBtn = document.getElementById('materialCloseBtn');

    if (!modal || !closeBtn) {
      // If elements not present yet, retry shortly
      setTimeout(initModalHandler, 100);
      return;
    }

    // Function to close the modal
    function closeModal() {
      try { if (typeof modal.close === 'function') modal.close(); } catch (e) {}
      modal.style.display = 'none';
    }

    // Close button click handler
    closeBtn.addEventListener('click', function(e) {
      e && e.preventDefault();
      e && e.stopPropagation();
      closeModal();
    });

    // Escape key handler
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeModal();
    });

    // Click outside modal to close
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeModal();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModalHandler);
  } else {
    initModalHandler();
  }

})();


