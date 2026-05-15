// State Management
const state = {
    user: null,
    currentView: 'login', // login, register, user, submit, admin
    tempRegData: {} // To store name/email between steps
};

// DOM Elements
const elements = {
    navbar: document.getElementById('navbar'),
    userGreeting: document.getElementById('user-greeting'),
    logoutBtn: document.getElementById('logout-btn'),
    
    views: {
        login: document.getElementById('view-login'),
        register: document.getElementById('view-register'),
        user: document.getElementById('view-user'),
        submit: document.getElementById('view-submit'),
        admin: document.getElementById('view-admin'),
    },

    // Forms
    formLogin: document.getElementById('form-login'),
    formRegisterInfo: document.getElementById('form-register-info'),
    formRegisterVerify: document.getElementById('form-register-verify'),
    formSubmitComplaint: document.getElementById('form-submit-complaint'),

    // Specific Elements
    btnGetAiQuestion: document.getElementById('btn-get-ai-question'),
    aiSection: document.getElementById('ai-section'),
    aiQuestionText: document.getElementById('ai-question-text'),
    userComplaintsList: document.getElementById('user-complaints-list'),
    adminComplaintsList: document.getElementById('admin-complaints-list'),
};

// Helper: Show Toast
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Helper: Show Error in Form
function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
    }
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
}

// Routing & View Management
function switchView(viewName) {
    clearErrors();
    Object.values(elements.views).forEach(view => {
        if (view) view.classList.remove('active');
    });

    if (elements.views[viewName]) {
        elements.views[viewName].classList.add('active');
        state.currentView = viewName;
    }

    // Navbar visibility
    if (viewName === 'login' || viewName === 'register') {
        elements.navbar.classList.add('hidden');
    } else {
        elements.navbar.classList.remove('hidden');
        if (state.user) {
            elements.userGreeting.textContent = `Welcome, ${state.user.name}`;
        }
    }

    // Load data based on view
    if (viewName === 'user') loadUserComplaints();
    if (viewName === 'admin') loadAdminComplaints();
}

// Navigation Listeners
document.getElementById('go-to-register').addEventListener('click', (e) => {
    e.preventDefault();
    switchView('register');
});

document.getElementById('go-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    switchView('login');
});

document.getElementById('btn-new-complaint').addEventListener('click', () => {
    // Reset submit form
    elements.formSubmitComplaint.reset();
    elements.aiSection.classList.add('hidden');
    elements.btnGetAiQuestion.classList.remove('hidden');
    switchView('submit');
});

document.getElementById('btn-back-to-complaints').addEventListener('click', () => {
    switchView('user');
});

elements.logoutBtn.addEventListener('click', async () => {
    try {
        await api.auth.logout();
        state.user = null;
        switchView('login');
        showToast('Logged out successfully');
    } catch (err) {
        showToast('Error logging out', 'error');
    }
});

// Initialization: Session Check
async function init() {
    try {
        const user = await api.auth.me();
        state.user = user;
        if (user.role === 'admin') {
            switchView('admin');
        } else {
            switchView('user');
        }
    } catch (error) {
        // Not logged in or invalid session
        state.user = null;
        switchView('login');
    }
}

// --- Auth Event Handlers ---

// Login
elements.formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = e.target.querySelector('button');
    btn.disabled = true;

    try {
        const user = await api.auth.login(email, password);
        state.user = user;
        showToast('Login successful');
        if (user.role === 'admin') {
            switchView('admin');
        } else {
            switchView('user');
        }
    } catch (error) {
        showError('login-error', error.message);
    } finally {
        btn.disabled = false;
    }
});

// Register - Step 1
elements.formRegisterInfo.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const btn = e.target.querySelector('button');
    
    state.tempRegData = { name, email };
    btn.disabled = true;

    try {
        await api.auth.sendOtp(name, email);
        showToast('OTP sent to your email');
        elements.formRegisterInfo.classList.add('hidden');
        elements.formRegisterVerify.classList.remove('hidden');
    } catch (error) {
        showError('register-error', error.message);
    } finally {
        btn.disabled = false;
    }
});

// Register - Step 2
elements.formRegisterVerify.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    const otp = document.getElementById('reg-otp').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const btn = e.target.querySelector('button');

    if (password !== confirmPassword) {
        showError('verify-error', 'Passwords do not match');
        return;
    }

    btn.disabled = true;

    try {
        await api.auth.register(state.tempRegData.email, otp, password);
        showToast('Registration successful! Please login.');
        // Reset register forms
        elements.formRegisterInfo.reset();
        elements.formRegisterVerify.reset();
        elements.formRegisterVerify.classList.add('hidden');
        elements.formRegisterInfo.classList.remove('hidden');
        switchView('login');
    } catch (error) {
        showError('verify-error', error.message);
    } finally {
        btn.disabled = false;
    }
});

// --- Complaint Event Handlers ---

// Get AI Question
elements.btnGetAiQuestion.addEventListener('click', async () => {
    clearErrors();
    const complaintText = document.getElementById('complaint-text').value;
    if (!complaintText) {
        showError('submit-error', 'Please enter your complaint first.');
        return;
    }

    const btn = elements.btnGetAiQuestion;
    btn.disabled = true;
    btn.textContent = 'Analyzing...';

    try {
        const { aiQuestion } = await api.ai.getQuestion(complaintText);
        elements.aiQuestionText.textContent = aiQuestion;
        
        elements.btnGetAiQuestion.classList.add('hidden');
        elements.aiSection.classList.remove('hidden');
    } catch (error) {
        showError('submit-error', error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Analyze with AI';
    }
});

// Submit Full Complaint
elements.formSubmitComplaint.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    
    const complaintText = document.getElementById('complaint-text').value;
    const aiQuestion = elements.aiQuestionText.textContent;
    const userAnswer = document.getElementById('user-answer').value;
    const btn = e.target.querySelector('button[type="submit"]');

    btn.disabled = true;

    try {
        await api.complaints.submit(complaintText, aiQuestion, userAnswer);
        showToast('Complaint submitted successfully');
        switchView('user');
    } catch (error) {
        showError('submit-error', error.message);
    } finally {
        btn.disabled = false;
    }
});

// --- Load Data Functions ---

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

async function loadUserComplaints() {
    elements.userComplaintsList.innerHTML = '<div class="loader"></div>';
    try {
        const complaints = await api.complaints.my();
        if (complaints.length === 0) {
            elements.userComplaintsList.innerHTML = '<p class="text-secondary">You have not submitted any complaints yet.</p>';
            return;
        }

        elements.userComplaintsList.innerHTML = complaints.map(c => `
            <div class="complaint-card">
                <div class="complaint-date">${formatDate(c.createdAt)}</div>
                <div class="complaint-text">${c.complaintText}</div>
                ${c.aiQuestion ? `
                <div class="ai-qa-box">
                    <div class="ai-question">AI: ${c.aiQuestion}</div>
                    <div class="user-reply">You: ${c.userAnswer}</div>
                </div>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        elements.userComplaintsList.innerHTML = '<p class="error-message" style="display:block">Failed to load complaints.</p>';
    }
}

async function loadAdminComplaints() {
    elements.adminComplaintsList.innerHTML = '<div class="loader"></div>';
    try {
        const complaints = await api.complaints.all();
        if (complaints.length === 0) {
            elements.adminComplaintsList.innerHTML = '<p class="text-secondary">No complaints registered yet.</p>';
            return;
        }

        elements.adminComplaintsList.innerHTML = complaints.map(c => `
            <div class="admin-complaint-row">
                <div class="admin-complaint-header">
                    <div>
                        <span class="user-info">${c.user.name}</span>
                        <span class="user-email">(${c.user.email})</span>
                    </div>
                    <div class="complaint-date">${formatDate(c.createdAt)}</div>
                </div>
                <div class="complaint-text">${c.complaintText}</div>
                ${c.aiQuestion ? `
                <div class="ai-qa-box">
                    <div class="ai-question">AI: ${c.aiQuestion}</div>
                    <div class="user-reply">Reply: ${c.userAnswer}</div>
                </div>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        elements.adminComplaintsList.innerHTML = '<p class="error-message" style="display:block">Failed to load complaints.</p>';
    }
}

// Start App
document.addEventListener('DOMContentLoaded', init);
