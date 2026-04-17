// Database Functions for Notes

// Fetch all notes with filters
async function fetchNotes(filters = {}) {
    try {
        let query = supabase
            .from('notes')
            .select('*');

        if (filters.category) {
            query = query.eq('category', filters.category);
        }

        if (filters.search) {
            query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        if (filters.sort === 'rating') {
            query = query.order('average_rating', { ascending: false });
        } else if (filters.sort === 'downloads') {
            query = query.order('download_count', { ascending: false });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching notes:', error);
        return [];
    }
}

// Upload a note
async function uploadNote(noteData, file) {
    try {
        if (!currentUser) throw new Error('User not authenticated');

        // Upload file to storage
        const fileName = `${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('notes')
            .upload(`${currentUser.id}/${fileName}`, file);

        if (uploadError) throw uploadError;

        // Create note record in database
        const { data, error } = await supabase
            .from('notes')
            .insert([{
                title: noteData.title,
                description: noteData.description,
                category: noteData.category,
                course_code: noteData.courseCode,
                uploader_id: currentUser.id,
                file_path: uploadData.path,
                file_size: file.size
            }])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error uploading note:', error);
        throw error;
    }
}

// Download a note
async function downloadNote(noteId) {
    try {
        const { data, error } = await supabase
            .from('notes')
            .select('file_path')
            .eq('id', noteId)
            .single();

        if (error) throw error;

        // Get signed URL
        const { data: urlData, error: urlError } = await supabase.storage
            .from('notes')
            .createSignedUrl(data.file_path, 3600);

        if (urlError) throw urlError;

        // Update download count
        await supabase.rpc('increment_download_count', { note_id: noteId });

        // Record download
        if (currentUser) {
            await supabase
                .from('downloads')
                .insert([{
                    user_id: currentUser.id,
                    note_id: noteId
                }]);
        }

        return urlData.signedUrl;
    } catch (error) {
        console.error('Error downloading note:', error);
        throw error;
    }
}

// Rate a note
async function rateNote(noteId, rating) {
    try {
        if (!currentUser) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('ratings')
            .insert([{
                note_id: noteId,
                user_id: currentUser.id,
                rating: rating
            }])
            .select();

        if (error) throw error;

        // Update average rating
        await updateNoteAverageRating(noteId);

        return data[0];
    } catch (error) {
        console.error('Error rating note:', error);
        throw error;
    }
}

// Update note average rating
async function updateNoteAverageRating(noteId) {
    try {
        const { data, error } = await supabase
            .from('ratings')
            .select('rating')
            .eq('note_id', noteId);

        if (error) throw error;

        if (data.length > 0) {
            const average = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
            
            await supabase
                .from('notes')
                .update({ average_rating: average })
                .eq('id', noteId);
        }
    } catch (error) {
        console.error('Error updating average rating:', error);
    }
}

// Add note to favorites
async function addToFavorites(noteId) {
    try {
        if (!currentUser) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('favorites')
            .insert([{
                user_id: currentUser.id,
                note_id: noteId
            }])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error adding to favorites:', error);
        throw error;
    }
}

// Get user's favorite notes
async function getUserFavorites() {
    try {
        if (!currentUser) return [];

        const { data, error } = await supabase
            .from('favorites')
            .select('notes(*)')
            .eq('user_id', currentUser.id);

        if (error) throw error;
        return data.map(f => f.notes) || [];
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return [];
    }
}

// Get user's downloads
async function getUserDownloads() {
    try {
        if (!currentUser) return [];

        const { data, error } = await supabase
            .from('downloads')
            .select('notes(*)')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(d => d.notes) || [];
    } catch (error) {
        console.error('Error fetching downloads:', error);
        return [];
    }
}

// Get user's uploads
async function getUserUploads() {
    try {
        if (!currentUser) return [];

        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('uploader_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching user uploads:', error);
        return [];
    }
}

// Get user by ID
async function getUser(userId) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

// Get all users (admin only)
async function getAllUsers() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

// Delete note (admin or uploader only)
async function deleteNote(noteId) {
    try {
        const { data, error } = await supabase
            .from('notes')
            .delete()
            .eq('id', noteId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting note:', error);
        throw error;
    }
}

// Get statistics
async function getStatistics() {
    try {
        const { count: totalNotes, error: notesError } = await supabase
            .from('notes')
            .select('*', { count: 'exact', head: true });

        const { count: totalUsers, error: usersError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        const { count: totalDownloads, error: downloadsError } = await supabase
            .from('downloads')
            .select('*', { count: 'exact', head: true });

        return {
            totalNotes: totalNotes || 0,
            totalUsers: totalUsers || 0,
            totalDownloads: totalDownloads || 0
        };
    } catch (error) {
        console.error('Error fetching statistics:', error);
        return { totalNotes: 0, totalUsers: 0, totalDownloads: 0 };
    }
}
