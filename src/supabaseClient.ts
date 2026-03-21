import { createClient } from '@supabase/supabase-js';

// Substitua pela URL que está lá no painel do Supabase
const supabaseUrl = 'https://iezhmneqdcfcwrpwxtmy.supabase.co/'

// A chave que você acabou de me mandar!
const supabaseKey = 'sb_publishable_odqTBvYT6A0R7_faiWVbQw_wqHU1Z_z';

export const supabase = createClient(supabaseUrl, supabaseKey);