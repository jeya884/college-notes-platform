// Dashboard Functions

// Setup dashboard
async function setupDashboard() {
    await checkAuth();
    if (!currentUser) {
        alert('Please login to access dashboard');
        window.location.href = 'login.html';
        return;
    }

    setupDashboardTabs();
    loadProfile();
    loadUserDownloads();
    loadUserUploads();
    loadUserFavorites();
}

// Setup tab navigation
function setupDashboardTabs() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const tabs = document.querySelectorAll('.dashboard-tab');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active from all
            sidebarLinks.forEach(l => l.classList.remove('active'));
            tabs.forEach(t => t.classList.remove('active'));

            // Add active to clicked
            link.classList.add('active');
            const tabId = link.getAttribute('data-tab');
            const tab = document.getElementById(tabId);
            if (tab) tab.classList.add('active');

            // Load tab content
            if (tabId === 'downloads') loadUserDownloads();
            if (tabId === 'uploads') loadUserUploads();
            if (tabId === 'favorites') loadUserFavorites();
            if (tabId === 'settings') setupSettings();
        });
    });
}

// Load profile
async function loadProfile() {
    try {
        if (currentUser) {
            document.getElementById('profileName').textContent = currentUser.name || 'N/A';
            document.getElementById('profileEmail').textContent = currentUser.email;
            document.getElementById('profileRole').textContent = currentUser.role;
            document.getElementById('profileDate').textContent = new Date(currentUser.created_at).toLocaleDateString();
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load user downloads
async function loadUserDownloads() {
    showSpinner('downloadsList');
    const notes = await getUserDownloads();
    displayNotes(notes, 'downloadsList');
}

// Load user uploads
async function loadUserUploads() {
    showSpinner('uploadsList');
    const notes = await getUserUploads();
    displayNotes(notes, 'uploadsList');
}

// Load user favorites
async function loadUserFavorites() {
    showSpinner('favoritesList');
    const notes = await getUserFavorites();
    displayNotes(notes, 'favoritesList');
}

// Setup settings
function setupSettings() {
    const form = document.getElementById('settingsForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Settings functionality can be extended here
        showNotification('Settings saved successfully!', 'success');
    });
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('profile')) {
        setupDashboard();
    }
});
