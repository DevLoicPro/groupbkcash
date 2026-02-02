const supabaseUrl = "https://dwipqqwuqfwcdgugugqw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aXBxcXd1cWZ3Y2RndWd1Z3F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzOTAxMTQsImV4cCI6MjA4Mzk2NjExNH0.bZ-wOSMNp8U5V6b9QSCUuzQUczYs7L-mwsjpwh_uSZk";

// Central Supabase Client
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Storage Keys
const SESSION_EXPIRY_KEY = 'sb_session_expiry';
const USER_ROLE_KEY = 'sb_user_role';

// Session Timeout (10 minutes)
const SESSION_TIMEOUT = 10 * 60 * 1000;

function updateSessionExpiry() {
    const expiry = Date.now() + SESSION_TIMEOUT;
    localStorage.setItem(SESSION_EXPIRY_KEY, expiry.toString());
}

function isSessionExpired() {
    const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
    if (!expiry) return true;
    return Date.now() > parseInt(expiry);
}

function clearAuthSession() {
    localStorage.removeItem(SESSION_EXPIRY_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem('sb_user_email');
    _supabase.auth.signOut();
}

// Global session check
const IS_PUBLIC_PAGE =
    window.location.pathname.includes('login.html') ||
    window.location.pathname.includes('register.html') ||
    window.location.pathname.includes('verify.html') ||
    window.location.pathname.endsWith('/') ||
    window.location.pathname.endsWith('index.html');

if (!IS_PUBLIC_PAGE) {
    if (isSessionExpired()) {
        clearAuthSession();
        // Redirection relative intelligente
        const depth = window.location.pathname.split('/').length - 1;
        const rootPath = window.location.pathname.includes('dashboard/') ? '../../' : './';
        window.location.href = rootPath + 'login.html';
    } else {
        updateSessionExpiry();
    }
}

// Update expiry on user activity
['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(event => {
    document.addEventListener(event, () => {
        if (!isSessionExpired()) {
            updateSessionExpiry();
        }
    });
});
