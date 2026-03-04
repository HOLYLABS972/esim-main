import { supabase } from '../supabase/config';

/**
 * Submit affiliate program application
 */
export async function submitAffiliateApplication(applicationData) {
  try {
    // Check existing
    const { data: existing } = await supabase
      .from('affiliate_applications')
      .select('*')
      .eq('email', applicationData.email)
      .limit(1);

    if (existing?.length) {
      const app = existing[0];
      if (app.affiliate_link) {
        return { id: app.id, affiliateLink: app.affiliate_link, isExisting: true };
      }
    }

    const encodedEmail = encodeURIComponent(applicationData.email);
    const affiliateLink = `https://roamjet.onelink.me/Sc5I/1agbazop?utm_source=${encodedEmail}`;

    const { data: newApp, error } = await supabase
      .from('affiliate_applications')
      .insert({
        ...applicationData,
        status: 'approved',
        reviewed_by: 'auto-approved',
        affiliate_code: encodedEmail,
        affiliate_link: affiliateLink,
        discount_percent: 25,
      })
      .select()
      .single();

    if (error) throw error;

    return { id: newApp.id, affiliateLink, isExisting: false };
  } catch (error) {
    console.error('Error submitting affiliate application:', error);
    throw error;
  }
}

export async function getAffiliateApplications() {
  const { data, error } = await supabase
    .from('affiliate_applications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateAffiliateApplication(id, updates) {
  const { error } = await supabase.from('affiliate_applications').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteAffiliateApplication(id) {
  const { error } = await supabase.from('affiliate_applications').delete().eq('id', id);
  if (error) throw error;
}
