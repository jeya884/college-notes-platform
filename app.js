// Main Application Logic

// Load featured notes
async function loadFeaturedNotes() {
    showSpinner('featuredNotes');
    const notes = await fetchNotes({ sort: 'rating' });
    const featured = notes.slice(0, 6);
    displayNotes(featured, 'featuredNotes');
}

// Load all notes
async function loadAllNotes() {
    showSpinner('notesList');
    const notes = await fetchNotes();
    displayNotes(notes, 'notesList');
}

// Search and filter
async function handleSearch() {
    const searchTerm = document.getElementById('searchInput')?.value || '';
    const category = document.getElementById('categoryFilter')?.value || '';

    showSpinner('notesList');
    const notes = await fetchNotes({ search: searchTerm, category });
    displayNotes(notes, 'notesList');
}

// Setup event listeners for main page
function setupMainPageListeners() {
    const downloadBtn = document.getElementById('downloadBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const searchBtn = document.getElementById('searchBtn');
    const userBtn = document.getElementById('userBtn');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');
    const applyFilter = document.getElementById('applyFilter');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            document.getElementById('notesList').scrollIntoView({ behavior: 'smooth' });
        });
    }

    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            if (currentUser) {
                window.location.href = 'admin-panel.html';
            } else {
                alert('Please login to upload notes');
                openModal('userMenu');
            }
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => openModal('searchModal'));
    }

    if (userBtn) {
        userBtn.addEventListener('click', () => openModal('userMenu'));
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }

    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            window.location.href = 'signup.html';
        });
    }

    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    }

    if (applyFilter) {
        applyFilter.addEventListener('click', handleSearch);
    }

    // Search on input change
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', handleSearch);
    }

    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleSearch);
    }

    // Search modal
    const searchModalInput = document.getElementById('searchModalInput');
    if (searchModalInput) {
        searchModalInput.addEventListener('keyup', async (e) => {
            const term = e.target.value;
            if (term.length > 2) {
                const notes = await fetchNotes({ search: term });
                const results = document.getElementById('searchResults');
                results.innerHTML = notes.slice(0, 10).map(note => createNoteCard(note)).join('');
            }
        });
    }
}

// Initialize main page
async function initMainPage() {
    await checkAuth();
    loadFeaturedNotes();
    loadAllNotes();
    setupMainPageListeners();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('notesList')) {
        initMainPage();
    }
});

// Handle browser back/forward
window.addEventListener('popstate', () => {
    loadAllNotes();
});
