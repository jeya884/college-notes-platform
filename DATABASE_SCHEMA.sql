-- College Notes Platform Database Schema
-- Copy and paste this into Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth)
CREATE TABLE public.users (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE,
  name text,
  role text DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Notes table
CREATE TABLE public.notes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  course_code text,
  uploader_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_size integer,
  average_rating numeric(3,2) DEFAULT 0,
  download_count integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create index for faster searches
CREATE INDEX notes_category_idx ON public.notes(category);
CREATE INDEX notes_title_idx ON public.notes USING GIN(to_tsvector('english', title));
CREATE INDEX notes_uploader_idx ON public.notes(uploader_id);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Ratings table
CREATE TABLE public.ratings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  note_id uuid REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp DEFAULT now(),
  UNIQUE(note_id, user_id)
);

-- Enable RLS
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Downloads table (for tracking)
CREATE TABLE public.downloads (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  note_id uuid REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now()
);

-- Create index
CREATE INDEX downloads_user_idx ON public.downloads(user_id);
CREATE INDEX downloads_note_idx ON public.downloads(note_id);

-- Enable RLS
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

-- Favorites table
CREATE TABLE public.favorites (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  note_id uuid REFERENCES public.notes(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id, note_id)
);

-- Create index
CREATE INDEX favorites_user_idx ON public.favorites(user_id);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- ROW LEVEL SECURITY POLICIES

-- Users can read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can read all data (for public profiles)
CREATE POLICY "Users can read all users" ON public.users
  FOR SELECT USING (true);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Anyone can read notes
CREATE POLICY "Anyone can read notes" ON public.notes
  FOR SELECT USING (true);

-- Users can insert notes
CREATE POLICY "Users can insert notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = uploader_id);

-- Users can delete their own notes
CREATE POLICY "Users can delete own notes" ON public.notes
  FOR DELETE USING (auth.uid() = uploader_id);

-- Admins can delete any notes
CREATE POLICY "Admins can delete notes" ON public.notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Anyone can read ratings
CREATE POLICY "Anyone can read ratings" ON public.ratings
  FOR SELECT USING (true);

-- Users can insert ratings
CREATE POLICY "Users can insert ratings" ON public.ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anyone can read downloads
CREATE POLICY "Anyone can read downloads" ON public.downloads
  FOR SELECT USING (true);

-- Users can insert downloads
CREATE POLICY "Users can insert downloads" ON public.downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anyone can read favorites
CREATE POLICY "Anyone can read favorites" ON public.favorites
  FOR SELECT USING (true);

-- Users can insert favorites
CREATE POLICY "Users can insert favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete own favorites
CREATE POLICY "Users can delete own favorites" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

-- FUNCTIONS

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_download_count(note_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.notes
  SET download_count = download_count + 1
  WHERE id = note_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (new.id, new.email, new.user_metadata->>'name', new.user_metadata->>'role');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STORAGE

-- Create storage bucket for notes
INSERT INTO storage.buckets (id, name, public) VALUES ('notes', 'notes', false);

-- Storage RLS policy - allow authenticated uploads
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'notes' AND auth.role() = 'authenticated');

-- Storage RLS policy - allow downloads
CREATE POLICY "Allow public downloads" ON storage.objects
  FOR SELECT USING (bucket_id = 'notes');

-- Storage RLS policy - allow users to delete own uploads
CREATE POLICY "Allow users to delete own uploads" ON storage.objects
  FOR DELETE USING (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);
