import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ydlsaaqhkakskdfjjdim.supabase.co'
const supabaseKey = 'sb_publishable_71Q51MlfNTAnnr_xWyXQbA_L371SI_H' // Paste the sb_publishable_... key here

export const supabase = createClient(supabaseUrl, supabaseKey)