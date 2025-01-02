import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/db/supabase.ts";

export const getUser = async (session: Session) => {
  supabase.auth.setSession(session);
  return await supabase.auth.getUser(session.access_token);
};
