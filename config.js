// Supabase Configuration
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Get from Supabase Dashboard
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Get from Supabase Dashboard

// Initialize Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// App Configuration
const APP_CONFIG = {
    appName: 'College Notes Platform',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedFileTypes: ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg'],
    categories: [
        { value: 'cs', label: 'Computer Science' },
        { value: 'eng', label: 'Engineering' },
        { value: 'business', label: 'Business' },
        { value: 'science', label: 'Science' },
        { value: 'arts', label: 'Arts' },
        { value: 'other', label: 'Other' }
    ],
    itemsPerPage: 12
};

console.log('Config loaded successfully');
