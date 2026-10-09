-- Jalankan sekali di Supabase: Dashboard > SQL Editor > New query > Run.
-- Membuat dua bucket publik untuk avatar dan banner profil Nontonime.
-- Unggahan TIDAK dilakukan dari browser: server Nontonime memakai SERVICE ROLE KEY
-- setelah memverifikasi ID token Firebase, jadi tidak ada policy tulis untuk anon.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 1048576, array['image/jpeg', 'image/png', 'image/webp']),
  ('banners', 'banners', true, 2621440, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
