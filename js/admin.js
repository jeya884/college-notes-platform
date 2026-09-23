// Admin Panel Functions

// Setup admin panel
async function setupAdminPanel() {
    // Check if user is logged in and is admin
    await checkAuth();
    if (!currentUser) {
        alert('Please login first');
        window.location.href = 'login.html';
        return;
    }

    if (currentUser.role !== 'admin') {
        alert('Access denied. Admin only.');
        window.location.href = 'index.html';
        return;
    }

    setupAdminTabs();
    loadDashboard();
    setupUploadForm();
    setupManageNotes();
    setupManageUsers();
    setupReports();
}

// Setup tab navigation
function setupAdminTabs() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const tabs = document.querySelectorAll('.admin-tab');

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
            if (tabId === 'dashboard') loadDashboard();
            if (tabId === 'manage') loadManageNotes();
            if (tabId === 'users') loadManageUsers();
            if (tabId === 'reports') loadReports();
        });
    });
}

// Load dashboard
async function loadDashboard() {
    try {
        const stats = await getStatistics();
        const totalNotesEl = document.getElementById('totalNotes');
        const totalUsersEl = document.getElementById('totalUsers');
        const totalDownloadsEl = document.getElementById('totalDownloads');
        const activeUsersEl = document.getElementById('activeUsers');

        if (totalNotesEl) totalNotesEl.textContent = stats.totalNotes || 0;
        if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers || 0;
        if (totalDownloadsEl) totalDownloadsEl.textContent = stats.totalDownloads || 0;
        if (activeUsersEl) activeUsersEl.textContent = stats.activeUsers || 0;
    } catch (error) {
        console.error('Error loading statistics:', error);
        showNotification('Error loading dashboard statistics', 'error');
    }
}

// Setup upload form
function setupUploadForm() {
    const form = document.getElementById('uploadForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('notesTitle').value;
        const description = document.getElementById('notesDescription').value;
        const category = document.getElementById('notesCategory').value;
        const courseCode = document.getElementById('courseCode').value;
        const fileInput = document.getElementById('notesFile');
        const file = fileInput ? fileInput.files[0] : null;

        if (!file) {
            showMessage('uploadMessage', 'Please select a file', 'error');
            return;
        }

        const maxFileSize = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.maxFileSize) ? APP_CONFIG.maxFileSize : 50 * 1024 * 1024;
        if (file.size > maxFileSize) {
            showMessage('uploadMessage', 'File too large. Max 50MB', 'error');
            return;
        }

        try {
            showMessage('uploadMessage', 'Uploading...', 'success');
            
            await uploadNote({ title, description, category, courseCode }, file);
            
            showMessage('uploadMessage', 'Notes uploaded successfully!', 'success');
            form.reset();
            setTimeout(() => {
                loadDashboard();
                loadManageNotes();
            }, 1000);
        } catch (error) {
            showMessage('uploadMessage', error.message, 'error');
        }
    });
}

// Setup manage notes
function setupManageNotes() {
    const search = document.getElementById('manageSearch');
    if (search) {
        search.addEventListener('keyup', () => {
            clearTimeout(window.manageSearchTimer);
            window.manageSearchTimer = setTimeout(loadManageNotes, 300);
        });
    }
    loadManageNotes();
}

// Load manage notes
async function loadManageNotes() {
    const container = document.getElementById('notesList');
    if (!container) return;

    try {
        showSpinner('notesList');
        const search = document.getElementById('manageSearch')?.value || '';
        let notes = await fetchNotes({ search });

        if (notes.length === 0) {
            container.innerHTML = '<p style="padding: 20px; text-align: center; color: #6b7280;">No notes found</p>';
            return;
        }

        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead>
                    <tr style="background: #f3f4f6;">
                        <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Title</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Category</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Downloads</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Rating</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${notes.map(note => `
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>${escapeHtml(note.title)}</strong><br><small style="color: #6b7280;">${escapeHtml(note.course_code || 'General')}</small></td>
                            <td style="padding: 12px; border: 1px solid #e5e7eb;">${getCategoryLabel(note.category)}</td>
                            <td style="padding: 12px; border: 1px solid #e5e7eb;">${note.download_count || 0}</td>
                            <td style="padding: 12px; border: 1px solid #e5e7eb;">⭐ ${(note.average_rating || 0).toFixed(1)}</td>
                            <td style="padding: 12px; border: 1px solid #e5e7eb;">
                                <button onclick="deleteAdminNote('${note.id}')" class="btn btn-small" style="background: #ef4444; color: white; padding: 6px 12px; border: none; cursor: pointer; border-radius: 4px;">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading notes:', error);
        showNotification('Error loading notes', 'error');
    }
}

// Delete note
async function deleteAdminNote(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
        try {
            await deleteNote(noteId);
            showNotification('Note deleted successfully', 'success');
            loadManageNotes();
            loadDashboard();
        } catch (error) {
            showNotification('Error deleting note: ' + error.message, 'error');
        }
    }
}

// Setup manage users
function setupManageUsers() {
    const search = document.getElementById('userSearch');
    if (search) {
        search.addEventListener('keyup', () => {
            clearTimeout(window.userSearchTimer);
            window.userSearchTimer = setTimeout(loadManageUsers, 300);
        });
    }
    loadManageUsers();
}

// Load manage users
async function loadManageUsers() {
    const container = document.getElementById('usersList');
    if (!container) return;

    try {
        const search = document.getElementById('userSearch')?.value || '';
        let users = await getAllUsers();

        if (search) {
            users = users.filter(u => 
                (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
                (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
            );
        }

        if (users.length === 0) {
            container.innerHTML = '<p style="padding: 20px; text-align: center; color: #6b7280;">No users found</p>';
            return;
        }

        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead>
                    <tr style="background: #f3f4f6;">
                        <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Name</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Email</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Role</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Joined</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 12px; border: 1px solid #e5e7eb;">${escapeHtml(user.name || 'N/A')}</td>
                            <td style="padding: 12px; border: 1px solid #e5e7eb;">${escapeHtml(user.email)}</td>
                            <td style="padding: 12px; border: 1px solid #e5e7eb;"><span style="text-transform: capitalize; padding: 2px 8px; border-radius: 4px; background: #e0e7ff; color: #4338ca; font-size: 0.85rem;">${user.role}</span></td>
                            <td style="padding: 12px; border: 1px solid #e5e7eb;">${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recent'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error loading users', 'error');
    }
}

// Setup reports
function setupReports() {
    loadReports();
}

// Load reports
async function loadReports() {
    try {
        const topDownloads = await fetchNotes({ sort: 'downloads' });
        const downloads = document.getElementById('topDownloads');
        if (downloads) {
            downloads.innerHTML = topDownloads.slice(0, 5).map(note => 
                `<li><strong>${escapeHtml(note.title)}</strong> - ${note.download_count || 0} downloads</li>`
            ).join('') || '<li>No data available</li>';
        }

        const topRated = await fetchNotes({ sort: 'rating' });
        const ratings = document.getElementById('topRated');
        if (ratings) {
            ratings.innerHTML = topRated.slice(0, 5).map(note => 
                `<li><strong>${escapeHtml(note.title)}</strong> - ⭐ ${(note.average_rating || 0).toFixed(1)}</li>`
            ).join('') || '<li>No data available</li>';
        }
    } catch (error) {
        console.error('Error loading reports:', error);
        showNotification('Error loading reports', 'error');
    }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dashboard')) {
        setupAdminPanel();
    }
});
