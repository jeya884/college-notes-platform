// UI Helper Functions

// Open modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// Create note card HTML
function createNoteCard(note) {
    const uploadedBy = note.uploader_name || 'Unknown';
    const createdDate = new Date(note.created_at).toLocaleDateString();
    const rating = note.average_rating ? '⭐ ' + note.average_rating.toFixed(1) : '⭐ No ratings';
    const downloads = note.download_count || 0;

    return `
        <div class="note-card" data-id="${note.id}">
            <div class="note-header">
                <div>
                    <div class="note-title">${escapeHtml(note.title)}</div>
                    <span class="note-category">${getCategoryLabel(note.category)}</span>
                </div>
                <button class="favorite-btn" onclick="toggleFavorite('${note.id}')" title="Add to favorites">❤️</button>
            </div>
            <div class="note-body">
                <p>${escapeHtml(note.description || 'No description')}</p>
                <div class="note-meta">
                    <span>${rating}</span>
                    <span>📥 ${downloads} downloads</span>
                </div>
                <div class="note-meta">
                    <span>${createdDate}</span>
                    <span>${uploadedBy}</span>
                </div>
            </div>
            <div class="note-footer">
                <button onclick="handleDownload('${note.id}', '${escapeHtml(note.file_name || note.title)}')">📥 Download</button>
                <button onclick="openRatingModal('${note.id}')">⭐ Rate</button>
            </div>
        </div>
    `;
}

// Get category label
function getCategoryLabel(category) {
    const categoryMap = {
        'cs': 'Computer Science',
        'eng': 'Engineering',
        'business': 'Business',
        'science': 'Science',
        'arts': 'Arts',
        'other': 'Other'
    };
    return categoryMap[category] || category;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Display notes in grid
function displayNotes(notes, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (notes.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No notes found</p></div>';
        return;
    }

    container.innerHTML = notes.map(note => createNoteCard(note)).join('');
}

// Show loading spinner
function showSpinner(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div class="spinner"></div>';
    }
}

// Toggle favorite
async function toggleFavorite(noteId) {
    if (!currentUser) {
        alert('Please login to add favorites');
        openModal('userMenu');
        return;
    }

    try {
        await addToFavorites(noteId);
        showNotification('Added to favorites!', 'success');
    } catch (error) {
        showNotification('Error adding to favorites', 'error');
    }
}

// Handle download
async function handleDownload(noteId, title) {
    if (!currentUser) {
        alert('Please login to download notes');
        openModal('userMenu');
        return;
    }

    try {
        await downloadNote(noteId);
        showNotification('Downloaded successfully!', 'success');
    } catch (error) {
        showNotification('Error downloading file', 'error');
    }
}

// Open rating modal
function openRatingModal(noteId) {
    if (!currentUser) {
        alert('Please login to rate notes');
        openModal('userMenu');
        return;
    }

    const rating = prompt('Rate this note (1-5 stars):', '5');
    if (rating && rating >= 1 && rating <= 5) {
        handleRating(noteId, parseInt(rating));
    }
}

// Handle rating
async function handleRating(noteId, rating) {
    try {
        await rateNote(noteId, rating);
        showNotification(`Thank you! Rated ${rating} stars`, 'success');
        // Refresh notes to show updated rating
        loadFeaturedNotes();
    } catch (error) {
        showNotification('Error rating note', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `message show ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2000;
        min-width: 300px;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
});
