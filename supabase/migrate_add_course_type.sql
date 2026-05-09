-- Add course_type to courses table
ALTER TABLE public.courses ADD COLUMN course_type TEXT DEFAULT 'محاضرة' CHECK (course_type IN ('محاضرة', 'سكشن'));
