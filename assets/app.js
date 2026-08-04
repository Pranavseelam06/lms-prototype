'use strict';

const API_BASE_URL = 'https://lms-prototype-1.onrender.com';
const nativeFetch = window.fetch.bind(window);

const state = {
    user: null,
    role: null,
    currentCourse: null,
    studentCourses: [],
    teacherCourses: [],
    assignments: [],
    submissions: [],
    backendIsBooting: true,
    activeRequests: 0,
    requestTimer: null,
    longRequestTimer: null
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

class ApiError extends Error {
    constructor(message, status = 0) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    setMinimumDueDate();
    initializeBackend();
});

function bindEvents() {
    $$('.role-option').forEach((button) => {
        button.addEventListener('click', () => openLogin(button.dataset.role));
    });

    $('#backToRoles').addEventListener('click', backToRoles);
    $('#loginForm').addEventListener('submit', login);
    $('#backendRetry').addEventListener('click', initializeBackend);
    $('#refreshCourse').addEventListener('click', loadCourseData);
    $('#refreshTeacher').addEventListener('click', loadTeacherCourses);
    $('#courseForm').addEventListener('submit', createCourse);
    $('#assignmentForm').addEventListener('submit', createAssignment);
    $('#submissionForm').addEventListener('submit', submitAssignment);
    $('#joinForm').addEventListener('submit', joinCourse);
    $('#openJoinDialog').addEventListener('click', openJoinDialog);
    $('#closeJoinDialog').addEventListener('click', closeJoinDialog);
    $('#cancelJoinDialog').addEventListener('click', closeJoinDialog);
    $('#submissionContent').addEventListener('input', updateAnswerCount);

    $$('[data-action="logout"]').forEach((button) => button.addEventListener('click', logout));
    $$('[data-action="open-join"]').forEach((button) => button.addEventListener('click', openJoinDialog));
    $$('[data-sidebar-toggle]').forEach((button) => {
        button.addEventListener('click', () => toggleSidebar(button.dataset.sidebarToggle));
    });
    $$('[data-sidebar-close]').forEach((backdrop) => {
        backdrop.addEventListener('click', () => closeSidebar(backdrop.dataset.sidebarClose));
    });
    $$('.sidebar-link').forEach((link) => {
        link.addEventListener('click', () => closeSidebar('teacher'));
    });

    $('#joinDialog').addEventListener('click', (event) => {
        if (event.target === $('#joinDialog')) closeJoinDialog();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeSidebar('student');
            closeSidebar('teacher');
        }
    });
}

// Backend availability and API requests

async function initializeBackend() {
    state.backendIsBooting = true;
    const retryButton = $('#backendRetry');
    retryButton.disabled = true;
    showOnlyView(null);
    setBackendLoader('Preparing your workspace', 'Connecting to the learning service…', false);

    const maxAttempts = 6;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        if (attempt > 1) {
            setBackendLoader(
                'Starting the learning service',
                `The service is still waking up (attempt ${attempt} of ${maxAttempts})…`,
                false
            );
        }

        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/health`, { cache: 'no-store' }, 15000);
            if (response.ok) {
                state.backendIsBooting = false;
                retryButton.disabled = false;
                $('#backendLoader').classList.add('is-hidden');
                showOnlyView('landingView');
                return;
            }
        } catch (error) {
            console.info('Backend startup check failed:', error.message);
        }

        if (attempt < maxAttempts) await delay(1800);
    }

    state.backendIsBooting = false;
    retryButton.disabled = false;
    setBackendLoader(
        'The service is unavailable',
        'We could not reach the backend. Check your connection, then try again.',
        true
    );
}

function setBackendLoader(title, message, showRetry) {
    $('#backendTitle').textContent = title;
    $('#backendMessage').textContent = message;
    $('#backendSpinner').classList.toggle('is-hidden', showRetry);
    $('#backendRetry').classList.toggle('is-hidden', !showRetry);
    $('#backendLoader').classList.remove('is-hidden');
}

function fetchWithTimeout(url, options = {}, timeout = 15000) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeout);
    return nativeFetch(url, { ...options, signal: controller.signal })
        .finally(() => window.clearTimeout(timeoutId));
}

async function apiRequest(path, options = {}) {
    beginRequest();

    try {
        const response = await nativeFetch(`${API_BASE_URL}${path}`, options);
        const bodyText = await response.text();
        let data = null;

        if (bodyText) {
            try {
                data = JSON.parse(bodyText);
            } catch {
                data = bodyText;
            }
        }

        if (!response.ok) {
            const message = data && typeof data === 'object' && data.detail
                ? data.detail
                : `Request failed with status ${response.status}`;
            throw new ApiError(message, response.status);
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError('Unable to connect to the learning service. Please try again.');
    } finally {
        endRequest();
    }
}

function beginRequest() {
    state.activeRequests += 1;
    if (state.activeRequests !== 1 || state.backendIsBooting) return;

    state.requestTimer = window.setTimeout(() => {
        $('#requestTitle').textContent = 'Working on your request';
        $('#requestMessage').textContent = 'Waiting for the backend to respond…';
        $('#requestOverlay').classList.remove('is-hidden');

        state.longRequestTimer = window.setTimeout(() => {
            $('#requestTitle').textContent = 'Still working';
            $('#requestMessage').textContent = 'The service may be waking up or processing your request.';
        }, 6500);
    }, 850);
}

function endRequest() {
    state.activeRequests = Math.max(0, state.activeRequests - 1);
    if (state.activeRequests > 0) return;

    window.clearTimeout(state.requestTimer);
    window.clearTimeout(state.longRequestTimer);
    $('#requestOverlay').classList.add('is-hidden');
}

// Navigation and global UI

function showOnlyView(viewId) {
    ['landingView', 'loginView', 'studentView', 'teacherView'].forEach((id) => {
        $(`#${id}`).classList.toggle('is-hidden', id !== viewId);
    });

    if (viewId) document.body.dataset.view = viewId;
    else delete document.body.dataset.view;
}

function openLogin(role) {
    state.role = role;
    const isStudent = role === 'student';
    $('#loginEyebrow').textContent = `${isStudent ? 'Student' : 'Teacher'} workspace`;
    $('#loginSubtitle').textContent = isStudent
        ? 'Access your courses, assignments, and feedback.'
        : 'Manage your courses and publish assignments.';
    hideFormMessage($('#loginError'));
    showOnlyView('loginView');
    $('#userId').focus();
}

function backToRoles() {
    state.role = null;
    $('#loginForm').reset();
    hideFormMessage($('#loginError'));
    showOnlyView('landingView');
    $('.role-option').focus();
}

function logout() {
    state.user = null;
    state.role = null;
    state.currentCourse = null;
    state.studentCourses = [];
    state.teacherCourses = [];
    state.assignments = [];
    state.submissions = [];

    $('#loginForm').reset();
    $('#submissionForm').reset();
    $('#courseForm').reset();
    $('#assignmentForm').reset();
    updateAnswerCount();
    closeSidebar('student');
    closeSidebar('teacher');
    showOnlyView('landingView');
    showToast('Signed out', 'You have returned to the workspace selector.');
}

function toggleSidebar(role) {
    const shell = $(`#${role}View`);
    const isOpen = shell.classList.toggle('sidebar-open');
    const toggle = $(`[data-sidebar-toggle="${role}"]`);
    toggle.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) $(`#${role}Sidebar`).focus({ preventScroll: true });
}

function closeSidebar(role) {
    const shell = $(`#${role}View`);
    if (!shell) return;
    shell.classList.remove('sidebar-open');
    const toggle = $(`[data-sidebar-toggle="${role}"]`);
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

function setButtonBusy(button, isBusy, busyLabel = 'Working…') {
    if (isBusy) {
        button.dataset.label = button.textContent.trim();
        button.disabled = true;
        button.replaceChildren(createElement('span', { className: 'button__spinner', ariaHidden: 'true' }), document.createTextNode(busyLabel));
    } else {
        button.disabled = false;
        button.textContent = button.dataset.label || 'Submit';
    }
}

function showToast(title, message, type = 'default') {
    const toast = createElement('div', { className: `toast toast--${type}`, role: type === 'error' ? 'alert' : 'status' });
    const indicator = createElement('span', { className: 'toast__indicator', ariaHidden: 'true' });
    const content = createElement('div');
    content.append(createElement('strong', { text: title }), createElement('span', { text: message }));
    const close = createElement('button', { className: 'icon-button', ariaLabel: 'Dismiss notification', type: 'button' });
    close.innerHTML = '<svg aria-hidden="true" viewBox="0 0 20 20"><path d="m6 6 8 8M14 6l-8 8"/></svg>';
    close.addEventListener('click', () => toast.remove());
    toast.append(indicator, content, close);
    $('#toastRegion').append(toast);
    window.setTimeout(() => toast.remove(), 5200);
}

function showFormMessage(element, message) {
    element.textContent = message;
    element.classList.remove('is-hidden');
}

function hideFormMessage(element) {
    element.textContent = '';
    element.classList.add('is-hidden');
}

// Authentication

async function login(event) {
    event.preventDefault();
    hideFormMessage($('#loginError'));

    const id = $('#userId').value.trim();
    const name = $('#userName').value.trim();
    const password = $('#userPassword').value;
    const numericId = Number.parseInt(id, 10);

    if (!id || !name || !password) {
        showFormMessage($('#loginError'), 'Complete all fields to sign in.');
        focusFirstEmptyField($('#loginForm'));
        return;
    }

    if (!Number.isInteger(numericId) || numericId <= 0) {
        showFormMessage($('#loginError'), 'User ID must be a positive number.');
        $('#userId').focus();
        return;
    }

    const button = $('#loginButton');
    setButtonBusy(button, true, 'Signing in…');

    try {
        const query = new URLSearchParams({ user_id: String(numericId), name, password, role: state.role });
        state.user = await apiRequest(`/users/login?${query}`, { method: 'POST' });

        if (state.role === 'teacher') {
            enterTeacherWorkspace();
        } else {
            enterStudentWorkspace();
        }
    } catch (error) {
        showFormMessage($('#loginError'), error.message);
    } finally {
        setButtonBusy(button, false);
    }
}

function enterStudentWorkspace() {
    setUserIdentity('student', state.user.name);
    $('#studentWelcome').classList.remove('is-hidden');
    $('#studentCourseWorkspace').classList.add('is-hidden');
    showOnlyView('studentView');
    loadStudentCourses();
}

function enterTeacherWorkspace() {
    setUserIdentity('teacher', state.user.name);
    $('#teacherOwner').textContent = state.user.name;
    showOnlyView('teacherView');
    loadTeacherCourses();
}

function setUserIdentity(role, name) {
    $(`#${role}Name`).textContent = name;
    $(`#${role}Avatar`).textContent = getInitials(name);
}

// Teacher workflows

async function loadTeacherCourses() {
    renderSkeleton($('#teacherCourseList'), 3);

    try {
        const courses = await apiRequest(`/courses/teacher/${state.user.id}`);
        state.teacherCourses = Array.isArray(courses) ? courses : [];
        renderTeacherCourses();
    } catch (error) {
        renderError($('#teacherCourseList'), 'Courses could not be loaded', error.message, loadTeacherCourses);
    }
}

function renderTeacherCourses() {
    const courses = state.teacherCourses;
    $('#teacherCourseCount').textContent = String(courses.length);
    renderTeacherCourseSelect();

    if (courses.length === 0) {
        renderEmpty(
            $('#teacherCourseList'),
            'No courses yet',
            'Create your first course using the form above.'
        );
        return;
    }

    renderTable($('#teacherCourseList'), [
        { label: 'Course ID', key: 'id', className: 'cell-id' },
        { label: 'Course name', key: 'name', className: 'cell-primary', wide: true },
        { label: 'Teacher ID', key: 'teacher_id', className: 'cell-id' }
    ], courses);
}

function renderTeacherCourseSelect() {
    const select = $('#teacherCourseSelect');
    select.replaceChildren();

    if (state.teacherCourses.length === 0) {
        select.append(createElement('option', { text: 'Create a course first', value: '' }));
        select.disabled = true;
        $('#createAssignmentButton').disabled = true;
        return;
    }

    select.disabled = false;
    $('#createAssignmentButton').disabled = false;
    state.teacherCourses.forEach((course) => {
        select.append(createElement('option', { text: course.name, value: String(course.id) }));
    });
}

async function createCourse(event) {
    event.preventDefault();
    const name = $('#courseName').value.trim();
    if (!name) {
        $('#courseName').focus();
        return;
    }

    const button = $('#createCourseButton');
    setButtonBusy(button, true, 'Creating…');

    try {
        const result = await apiRequest('/courses/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, teacher_id: state.user.id })
        });
        $('#courseForm').reset();
        showToast('Course created', `${result.course.name} is ready. Course ID: ${result.course.id}`, 'success');
        await loadTeacherCourses();
    } catch (error) {
        showToast('Course not created', error.message, 'error');
    } finally {
        setButtonBusy(button, false);
    }
}

async function createAssignment(event) {
    event.preventDefault();
    const courseId = Number.parseInt($('#teacherCourseSelect').value, 10);
    const title = $('#assignmentTitle').value.trim();
    const task = $('#assignmentTask').value.trim();
    const dueDate = $('#dueDate').value;

    if (!courseId) {
        showToast('Course required', 'Create or select a course before publishing an assignment.', 'error');
        return;
    }

    if (!title || !task || !dueDate) {
        focusFirstEmptyField($('#assignmentForm'));
        return;
    }

    const button = $('#createAssignmentButton');
    setButtonBusy(button, true, 'Publishing…');

    try {
        const result = await apiRequest(`/courses/${courseId}/assignments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, task, due_date: dueDate, course_id: courseId })
        });
        $('#assignmentTitle').value = '';
        $('#assignmentTask').value = '';
        $('#dueDate').value = '';
        setMinimumDueDate();
        showToast('Assignment published', `${result.title} is now available to students.`, 'success');
    } catch (error) {
        showToast('Assignment not published', error.message, 'error');
    } finally {
        setButtonBusy(button, false);
    }
}

// Student workflows

async function loadStudentCourses() {
    $('#studentCourseNav').replaceChildren(createElement('p', { className: 'course-nav__empty', text: 'Loading courses…' }));

    try {
        const courses = await apiRequest(`/courses/student/${state.user.id}/courses`);
        state.studentCourses = Array.isArray(courses) ? courses : [];
        renderStudentCourseNav();
    } catch (error) {
        $('#studentCourseNav').replaceChildren(createElement('p', { className: 'course-nav__empty', text: 'Courses could not be loaded.' }));
        showToast('Courses unavailable', error.message, 'error');
    }
}

function renderStudentCourseNav() {
    const nav = $('#studentCourseNav');
    nav.replaceChildren();
    $('#studentCourseCount').textContent = String(state.studentCourses.length);

    if (state.studentCourses.length === 0) {
        nav.append(createElement('p', { className: 'course-nav__empty', text: 'No courses joined yet.' }));
        return;
    }

    state.studentCourses.forEach((course) => {
        const button = createElement('button', {
            className: `course-nav__item${state.currentCourse && state.currentCourse.id === course.id ? ' is-active' : ''}`,
            type: 'button'
        });
        button.append(createElement('span', { className: 'course-nav__dot', ariaHidden: 'true' }), createElement('span', { text: course.name }));
        button.addEventListener('click', () => selectCourse(course));
        nav.append(button);
    });
}

function selectCourse(course) {
    state.currentCourse = course;
    $('#studentWelcome').classList.add('is-hidden');
    $('#studentCourseWorkspace').classList.remove('is-hidden');
    $('#currentCourseName').textContent = course.name;
    $('#currentCourseId').textContent = `ID ${course.id}`;
    renderStudentCourseNav();
    closeSidebar('student');
    loadCourseData();
}

async function loadCourseData() {
    if (!state.currentCourse || !state.user) return;

    renderSkeleton($('#assignmentContent'), 3);
    renderSkeleton($('#submissionHistory'), 3);
    $('#pendingCount').textContent = '—';
    $('#submissionCount').textContent = '—';
    $('#averageScore').textContent = '—';
    disableSubmissionForm(true);

    const assignmentRequest = apiRequest(`/courses/${state.currentCourse.id}/assignments/pending/${state.user.id}`);
    const submissionRequest = apiRequest(`/assignments/user/${state.user.id}/submissions`);
    const [assignmentsResult, submissionsResult] = await Promise.allSettled([assignmentRequest, submissionRequest]);

    if (assignmentsResult.status === 'fulfilled') {
        const allAssignments = Array.isArray(assignmentsResult.value) ? assignmentsResult.value : [];
        state.assignments = allAssignments.filter((assignment) => assignment.student_id === null || assignment.student_id === state.user.id);
        renderAssignments();
    } else {
        state.assignments = [];
        $('#pendingCount').textContent = '—';
        renderAssignmentSelect();
        renderError($('#assignmentContent'), 'Assignments could not be loaded', assignmentsResult.reason.message, loadCourseData);
    }

    if (submissionsResult.status === 'fulfilled') {
        state.submissions = Array.isArray(submissionsResult.value) ? submissionsResult.value : [];
        renderSubmissions();
    } else {
        state.submissions = [];
        $('#submissionCount').textContent = '—';
        $('#averageScore').textContent = '—';
        renderError($('#submissionHistory'), 'Submissions could not be loaded', submissionsResult.reason.message, loadCourseData);
    }
}

function renderAssignments() {
    $('#pendingCount').textContent = String(state.assignments.length);
    renderAssignmentSelect();

    if (state.assignments.length === 0) {
        renderEmpty($('#assignmentContent'), 'You are all caught up', 'There are no pending assignments for this course.');
        return;
    }

    renderTable($('#assignmentContent'), [
        { label: 'ID', key: 'id', className: 'cell-id' },
        { label: 'Assignment', key: 'title', className: 'cell-primary' },
        { label: 'Instructions', key: 'task', wide: true, truncate: true },
        { label: 'Due date', className: 'cell-date', render: (assignment) => formatDate(assignment.due_date) },
        {
            label: 'Type',
            render: (assignment) => createBadge(assignment.title.includes('(Follow Up)') ? 'Follow-up' : 'Course', assignment.title.includes('(Follow Up)') ? 'warning' : 'neutral')
        }
    ], state.assignments);
}

function renderAssignmentSelect() {
    const select = $('#assignmentSelect');
    select.replaceChildren();

    if (state.assignments.length === 0) {
        select.append(createElement('option', { text: 'No pending assignments', value: '' }));
        disableSubmissionForm(true);
        return;
    }

    state.assignments.forEach((assignment) => {
        select.append(createElement('option', { text: assignment.title, value: String(assignment.id) }));
    });
    disableSubmissionForm(false);
}

function renderSubmissions() {
    const submissions = state.submissions;
    $('#submissionCount').textContent = String(submissions.length);
    const scored = submissions.filter((submission) => Number.isFinite(Number(submission.score)));
    const average = scored.length
        ? Math.round(scored.reduce((sum, submission) => sum + Number(submission.score), 0) / scored.length)
        : null;
    $('#averageScore').textContent = average === null ? '—' : `${average}%`;

    if (submissions.length === 0) {
        renderEmpty($('#submissionHistory'), 'No submissions yet', 'Submitted work and AI feedback will appear here.');
        return;
    }

    renderTable($('#submissionHistory'), [
        { label: 'Assignment', key: 'assignment_id', className: 'cell-id' },
        { label: 'Answer', key: 'content', wide: true, truncate: true },
        {
            label: 'Score',
            className: 'cell-score',
            render: (submission) => {
                if (submission.score === null || submission.score === undefined) return 'Pending';
                return createBadge(`${submission.score}%`, Number(submission.score) >= 80 ? 'success' : 'warning');
            }
        },
        { label: 'Feedback', render: (submission) => submission.ai_feedback || 'No feedback provided', wide: true }
    ], submissions);
}

async function submitAssignment(event) {
    event.preventDefault();
    const assignmentId = Number.parseInt($('#assignmentSelect').value, 10);
    const content = $('#submissionContent').value.trim();

    if (!assignmentId) {
        showToast('Assignment required', 'Select an assignment before submitting.', 'error');
        return;
    }

    if (!content) {
        $('#submissionContent').focus();
        return;
    }

    const button = $('#submitButton');
    setButtonBusy(button, true, 'Grading…');

    try {
        const result = await apiRequest(`/assignments/${assignmentId}/submissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, assignment_id: assignmentId, student_id: state.user.id })
        });
        $('#submissionContent').value = '';
        updateAnswerCount();
        const passed = Number(result.score) >= 80;
        showToast(
            passed ? 'Submission graded' : 'Follow-up assigned',
            passed
                ? `You received ${result.score}/100.`
                : `You received ${result.score}/100. A follow-up assignment was created.`,
            passed ? 'success' : 'default'
        );
        await loadCourseData();
    } catch (error) {
        showToast('Submission failed', error.message, 'error');
    } finally {
        setButtonBusy(button, false);
        button.disabled = state.assignments.length === 0;
    }
}

function disableSubmissionForm(disabled) {
    $('#assignmentSelect').disabled = disabled;
    $('#submissionContent').disabled = disabled;
    $('#submitButton').disabled = disabled;
}

function updateAnswerCount() {
    const count = $('#submissionContent').value.length;
    $('#answerCount').textContent = `${count.toLocaleString()} ${count === 1 ? 'character' : 'characters'}`;
}

// Course enrollment dialog

function openJoinDialog() {
    hideFormMessage($('#joinError'));
    if (!$('#joinDialog').open) $('#joinDialog').showModal();
    window.setTimeout(() => $('#joinCourseId').focus(), 0);
}

function closeJoinDialog() {
    if ($('#joinDialog').open) $('#joinDialog').close();
    $('#joinForm').reset();
    hideFormMessage($('#joinError'));
}

async function joinCourse(event) {
    event.preventDefault();
    hideFormMessage($('#joinError'));
    const courseId = Number.parseInt($('#joinCourseId').value, 10);
    const courseName = $('#joinCourseName').value.trim();

    if (!Number.isInteger(courseId) || courseId <= 0) {
        showFormMessage($('#joinError'), 'Enter a valid positive course ID.');
        $('#joinCourseId').focus();
        return;
    }

    if (!courseName) {
        showFormMessage($('#joinError'), 'Enter the exact course name.');
        $('#joinCourseName').focus();
        return;
    }

    const button = $('#joinCourseButton');
    setButtonBusy(button, true, 'Joining…');

    try {
        const query = new URLSearchParams({ course_name: courseName, course_id: String(courseId) });
        await apiRequest(`/courses/enroll/${state.user.id}?${query}`, { method: 'POST' });
        closeJoinDialog();
        showToast('Course joined', `${courseName} was added to your workspace.`, 'success');
        await loadStudentCourses();
    } catch (error) {
        showFormMessage($('#joinError'), error.message);
    } finally {
        setButtonBusy(button, false);
    }
}

// Reusable rendering helpers

function renderTable(container, columns, rows) {
    const wrapper = createElement('div', { className: 'table-scroll' });
    const table = createElement('table', { className: 'data-table' });
    const thead = createElement('thead');
    const headerRow = createElement('tr');
    columns.forEach((column) => headerRow.append(createElement('th', { text: column.label, scope: 'col' })));
    thead.append(headerRow);

    const tbody = createElement('tbody');
    rows.forEach((row) => {
        const tr = createElement('tr');
        columns.forEach((column) => {
            const td = createElement('td', {
                className: column.className || '',
                dataLabel: column.label,
                dataWide: column.wide ? 'true' : 'false'
            });
            const value = column.render ? column.render(row) : row[column.key];
            if (value instanceof Node) {
                td.append(value);
            } else if (column.truncate) {
                td.append(createElement('span', {
                    className: 'truncate-3',
                    text: value === null || value === undefined || value === '' ? '—' : String(value)
                }));
            } else {
                td.textContent = value === null || value === undefined || value === '' ? '—' : String(value);
            }
            tr.append(td);
        });
        tbody.append(tr);
    });

    table.append(thead, tbody);
    wrapper.append(table);
    container.replaceChildren(wrapper);
}

function renderSkeleton(container, rows = 3) {
    const wrap = createElement('div', { className: 'skeleton-wrap', ariaLabel: 'Loading content' });
    for (let index = 0; index < rows; index += 1) {
        const row = createElement('div', { className: 'skeleton-row' });
        for (let column = 0; column < 4; column += 1) row.append(createElement('span', { className: 'skeleton-line' }));
        wrap.append(row);
    }
    container.replaceChildren(wrap);
}

function renderEmpty(container, title, message) {
    const stateElement = createElement('div', { className: 'empty-state' });
    const content = createElement('div', { className: 'empty-state__content' });
    content.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z"/></svg>';
    content.append(createElement('strong', { text: title }), createElement('p', { text: message }));
    stateElement.append(content);
    container.replaceChildren(stateElement);
}

function renderError(container, title, message, retry) {
    const stateElement = createElement('div', { className: 'error-state' });
    const content = createElement('div', { className: 'error-state__content' });
    content.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 8v5M12 17h.01"/><path d="M10.3 3.7 2.8 17a2 2 0 0 0 1.75 3h14.9a2 2 0 0 0 1.75-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/></svg>';
    content.append(createElement('strong', { text: title }), createElement('p', { text: message }));
    const retryButton = createElement('button', { className: 'button button--secondary', text: 'Try again', type: 'button' });
    retryButton.addEventListener('click', retry);
    content.append(retryButton);
    stateElement.append(content);
    container.replaceChildren(stateElement);
}

function createBadge(text, type = 'neutral') {
    return createElement('span', { className: `badge badge--${type}`, text });
}

function createElement(tag, attributes = {}) {
    const element = document.createElement(tag);
    const attributeMap = {
        className: 'class',
        ariaHidden: 'aria-hidden',
        ariaLabel: 'aria-label',
        dataLabel: 'data-label',
        dataWide: 'data-wide'
    };

    Object.entries(attributes).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === 'text') element.textContent = value;
        else if (key === 'value') element.value = value;
        else if (key === 'type') element.type = value;
        else element.setAttribute(attributeMap[key] || key, value);
    });
    return element;
}

function focusFirstEmptyField(form) {
    const field = [...form.elements].find((element) => element.matches('input, select, textarea') && !String(element.value).trim());
    if (field) field.focus();
}

function getInitials(name) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function setMinimumDueDate() {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    $('#dueDate').min = localDate;
}

function delay(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
