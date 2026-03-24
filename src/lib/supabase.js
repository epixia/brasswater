import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://ydsripcbdobrdnsxelve.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkc3JpcGNiZG9icmRuc3hlbHZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTI3MzQsImV4cCI6MjA4OTkyODczNH0.slyTwNJfHlLv-FaoTGHUjhbpQHjhz280w1KMPQ_LEk0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase;
