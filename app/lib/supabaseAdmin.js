/**
 * Supabase Admin client for API routes (server-side).
 * Uses the service role key for full access.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uhpuqiptxcjluwsetoev.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocHVxaXB0eGNqbHV3c2V0b2V2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA5MTg5NiwiZXhwIjoyMDcyNjY3ODk2fQ.X3FdUURXWp957hFMUVkvWCVjOfVIEYJ9SbSos2Q-xsk';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
