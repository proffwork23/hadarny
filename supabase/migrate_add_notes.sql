-- Run this on existing Supabase databases to add the notes column
-- This is a non-destructive migration
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS notes TEXT;

-- Also ensure public policies allow notes updates
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Allow public update students notes') THEN
    CREATE POLICY "Allow public update students notes" ON public.students FOR UPDATE USING (true);
  END IF;
END $$;
