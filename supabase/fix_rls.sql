-- DiseaseWatch — Disable RLS or Allow Full Access for Hackathon Prototype
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run

ALTER TABLE IF EXISTS camps DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS health_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS environmental_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS risk_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;

-- If you prefer keeping RLS enabled with permissive public policies instead:
-- DO $$ 
-- BEGIN
--   EXECUTE 'CREATE POLICY "Allow public all on camps" ON camps FOR ALL USING (true) WITH CHECK (true)';
--   EXECUTE 'CREATE POLICY "Allow public all on users" ON users FOR ALL USING (true) WITH CHECK (true)';
--   EXECUTE 'CREATE POLICY "Allow public all on health_reports" ON health_reports FOR ALL USING (true) WITH CHECK (true)';
--   EXECUTE 'CREATE POLICY "Allow public all on environmental_reports" ON environmental_reports FOR ALL USING (true) WITH CHECK (true)';
--   EXECUTE 'CREATE POLICY "Allow public all on alerts" ON alerts FOR ALL USING (true) WITH CHECK (true)';
--   EXECUTE 'CREATE POLICY "Allow public all on actions" ON actions FOR ALL USING (true) WITH CHECK (true)';
-- EXCEPTION WHEN OTHERS THEN NULL;
-- END $$;
