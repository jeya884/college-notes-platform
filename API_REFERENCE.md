# API Reference - College Notes Platform

## Authentication Functions (`js/auth.js`)

### `checkAuth()`
Check if user is currently logged in.
```javascript
const user = await checkAuth();
// Returns: User object or null
```

### `logout()`
Log out current user.
```javascript
logout();
// Clears session and redirects to home
```

### `updateUIBasedOnAuth()`
Update UI based on authentication status.
```javascript
updateUIBasedOnAuth();
// Shows/hides login/logout buttons
```

---

## Database Functions (`js/db.js`)

### `fetchNotes(filters)`
Fetch notes with optional filters.
```javascript
const notes = await fetchNotes({
  category: 'cs',           // Optional: filter by category
  search: 'python',         // Optional: search by title/description
  sort: 'rating'           // Optional: 'rating', 'downloads', or default
});
```

### `uploadNote(noteData, file)`
Upload a new note.
```javascript
const note = await uploadNote(
  {
    title: 'Python Basics',
    description: 'Introduction to Python programming',
    category: 'cs',
    courseCode: 'CS101'
  },
  file // File object from input
);
```

### `downloadNote(noteId)`
Download a note and increment counter.
```javascript
const url = await downloadNote(noteId);
// Returns signed URL to download file
```

### `rateNote(noteId, rating)`
Rate a note (1-5 stars).
```javascript
const rating = await rateNote(noteId, 5);
// rating object returned
```

### `addToFavorites(noteId)`
Add note to user's favorites.
```javascript
const favorite = await addToFavorites(noteId);
```

### `getUserFavorites()`
Get all user's favorite notes.
```javascript
const favorites = await getUserFavorites();
// Returns: Array of note objects
```

### `getUserDownloads()`
Get user's download history.
```javascript
const downloads = await getUserDownloads();
// Returns: Array of downloaded notes
```

### `getUserUploads()`
Get user's uploaded notes.
```javascript
const uploads = await getUserUploads();
// Returns: Array of notes uploaded by user
```

### `getUser(userId)`
Get user profile information.
```javascript
const user = await getUser(userId);
// Returns: User object with role, name, email
```

### `getAllUsers()`
Get all users (admin only).
```javascript
const users = await getAllUsers();
```

### `deleteNote(noteId)`
Delete a note.
```javascript
await deleteNote(noteId);
```

### `getStatistics()`
Get platform statistics.
```javascript
const stats = await getStatistics();
// Returns: { totalNotes, totalUsers, totalDownloads }
```

---

## UI Functions (`js/ui.js`)

### `openModal(modalId)`
Open a modal dialog.
```javascript
openModal('userMenu');
```

### `closeModal(modalId)`
Close a modal dialog.
```javascript
closeModal('userMenu');
```

### `createNoteCard(note)`
Generate HTML for a note card.
```javascript
const html = createNoteCard(noteObject);
```

### `displayNotes(notes, containerId)`
Display notes in a grid.
```javascript
displayNotes(notesArray, 'notesList');
```

### `showSpinner(containerId)`
Show loading spinner.
```javascript
showSpinner('notesList');
```

### `handleDownload(noteId, title)`
Handle file download.
```javascript
await handleDownload(noteId, 'Notes Title');
```

### `showNotification(message, type)`
Show notification toast.
```javascript
showNotification('Success!', 'success');
// Types: 'success', 'error', 'info'
```

### `formatFileSize(bytes)`
Format bytes to readable size.
```javascript
formatFileSize(1048576); // Returns: "1 MB"
```

---

## App Functions (`js/app.js`)

### `loadFeaturedNotes()`
Load top-rated notes.
```javascript
await loadFeaturedNotes();
```

### `loadAllNotes()`
Load all available notes.
```javascript
await loadAllNotes();
```

### `handleSearch()`
Search and filter notes.
```javascript
await handleSearch();
```

### `initMainPage()`
Initialize home page.
```javascript
await initMainPage();
```

---

## Admin Functions (`js/admin.js`)

### `setupAdminPanel()`
Initialize admin panel.
```javascript
await setupAdminPanel();
```

### `loadDashboard()`
Load admin dashboard statistics.
```javascript
await loadDashboard();
```

### `loadManageNotes()`
Load notes management interface.
```javascript
await loadManageNotes();
```

### `loadManageUsers()`
Load users management interface.
```javascript
await loadManageUsers();
```

### `loadReports()`
Load analytics reports.
```javascript
await loadReports();
```

### `deleteAdminNote(noteId)`
Delete a note (admin).
```javascript
await deleteAdminNote(noteId);
```

---

## Dashboard Functions (`js/dashboard.js`)

### `setupDashboard()`
Initialize user dashboard.
```javascript
await setupDashboard();
```

### `loadProfile()`
Load user profile information.
```javascript
await loadProfile();
```

### `loadUserDownloads()`
Display user's downloads.
```javascript
await loadUserDownloads();
```

### `loadUserUploads()`
Display user's uploads.
```javascript
await loadUserUploads();
```

### `loadUserFavorites()`
Display user's favorites.
```javascript
await loadUserFavorites();
```

---

## Helper Functions

### `escapeHtml(text)`
Prevent XSS attacks.
```javascript
escapeHtml('<script>alert("xss")</script>');
// Returns: Safe HTML string
```

### `getCategoryLabel(category)`
Get friendly category name.
```javascript
getCategoryLabel('cs'); // Returns: "Computer Science"
```

### `showMessage(elementId, text, type)`
Show message in element.
```javascript
showMessage('loginMessage', 'Login successful!', 'success');
```

---

## Configuration (`js/config.js`)

### Supabase Settings
```javascript
const SUPABASE_URL = 'YOUR_URL';
const SUPABASE_ANON_KEY = 'YOUR_KEY';
```

### App Settings
```javascript
APP_CONFIG = {
  appName: 'College Notes Platform',
  maxFileSize: 50 * 1024 * 1024,    // 50MB
  allowedFileTypes: ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg'],
  categories: [...],                 // Supported categories
  itemsPerPage: 12                   // Notes per page
}
```

---

## Global Variables

### `currentUser`
Currently logged-in user object.
```javascript
if (currentUser) {
  console.log(currentUser.email);
}
```

### `supabase`
Supabase client instance.
```javascript
const { data, error } = await supabase
  .from('notes')
  .select('*');
```

---

## Error Handling

All database functions throw errors on failure:
```javascript
try {
  await uploadNote(data, file);
} catch (error) {
  console.error('Upload failed:', error.message);
}
```

---

## Common Patterns

### Upload and Refresh
```javascript
await uploadNote(data, file);
await loadAllNotes(); // Refresh list
```

### Search with Debounce
```javascript
let searchTimeout;
searchInput.addEventListener('keyup', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(handleSearch, 300);
});
```

### Handle Async Loading
```javascript
showSpinner('container');
try {
  const data = await fetchNotes();
  displayNotes(data, 'container');
} catch (error) {
  showNotification(error.message, 'error');
}
```

---

## Rate Limits

- Database queries: 1000 per second
- File uploads: 50MB max per file
- API calls: Standard Supabase limits
- Storage: 1GB per free project

---

## More Information

- Full Supabase docs: https://supabase.com/docs
- JavaScript client: https://supabase.com/docs/reference/javascript
- Contact: support@supabase.com
