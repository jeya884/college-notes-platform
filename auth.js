// Authentication Functions - Using Local Backend API
let currentUser = null;

// Check if user is logged in
async function checkAuth() {
    await checkAuthStatus();
    updateUIBasedOnAuth();
    return currentUser;
}

// Update UI based on authentication status
function updateUIBasedOnAuth() {
    const authButtons = document.getElementById('authButtons');
    const userActions = document.getElementById('userActions');

    if (currentUser) {
        if (authButtons) authButtons.style.display = 'none';
        if (userActions) {
            userActions.style.display = 'block';
            document.getElementById('userEmail').textContent = currentUser.email;
            document.getElementById('userRole').textContent = `Role: ${currentUser.role}`;
        }
    } else {
        if (authButtons) authButtons.style.display = 'block';
        if (userActions) userActions.style.display = 'none';
    }
}

// Logout function
async function logout() {
    try {
        window.logout();
        currentUser = null;
        window.location.href = 'index.html';
    } catch (error) {
        alert('Logout failed: ' + error.message);
    }
}

// Helper function to show message
function showMessage(elementId, text, type = 'success') {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
        element.className = `message show ${type}`;
        setTimeout(() => {
            element.classList.remove('show');
        }, 5000);
    }
}

// Check auth on page load
document.addEventListener('DOMContentLoaded', checkAuth);

// Logout button handler
if (document.getElementById('logoutBtn')) {
    document.getElementById('logoutBtn').addEventListener('click', logout);
}
