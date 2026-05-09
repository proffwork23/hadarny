-- Hadarni Schema Setup

-- 1. Instructors (Extends auth.users)
CREATE TABLE public.instructors (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Courses / Sections
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructors(id) NOT NULL,
  title TEXT NOT NULL,
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Students
CREATE TABLE public.students (
  student_code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  academic_year TEXT,
  device_fingerprint TEXT, -- Used to prevent multiple registrations from the same device
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Course Enrollments
CREATE TABLE public.course_enrollments (
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  student_code TEXT REFERENCES public.students(student_code) ON DELETE CASCADE,
  serial_number TEXT,
  section_group TEXT,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (course_id, student_code)
);

-- 5. Sessions (Attendance Instances)
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  secret_key TEXT NOT NULL, -- The base32 secret for TOTP generation
  is_active BOOLEAN DEFAULT TRUE,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- 6. Attendance
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_code TEXT REFERENCES public.students(student_code) ON DELETE CASCADE,
  status TEXT DEFAULT 'present', -- 'present', 'manual', 'absent'
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_code) -- A student can only attend a session once
);

-- Enable Realtime for attendance table
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;

-- Optional: Basic RLS (For MVP we can allow authenticated instructors full access, and public students to insert attendance)
-- To keep things fast for tomorrow, we can bypass RLS or set very simple policies.
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Allow public access to insert attendance (student scanning)
CREATE POLICY "Allow public insert to attendance" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Allow public select sessions" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Allow public select students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow public update students" ON public.students FOR UPDATE USING (true);

-- Instructor policies
CREATE POLICY "Instructors manage their courses" ON public.courses FOR ALL USING (auth.uid() = instructor_id);
CREATE POLICY "Instructors manage their sessions" ON public.sessions FOR ALL USING (
  course_id IN (SELECT id FROM public.courses WHERE instructor_id = auth.uid())
);
CREATE POLICY "Instructors read their students attendance" ON public.attendance FOR ALL USING (
  session_id IN (SELECT id FROM public.sessions WHERE course_id IN (SELECT id FROM public.courses WHERE instructor_id = auth.uid()))
);
