import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jyuqcvksgpkednqdkhbu.supabase.co";
const supabaseAnonKey = "sb_publishable_205gIWPbyEqAvfOp-Fhu5g_6Ve4TMiQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
