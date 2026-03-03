import { supabase } from '../supabase/config';

const defaultSettings = {
  socialMedia: { linkedin: '', facebook: '', twitter: '', instagram: '', youtube: '', tiktok: '', telegram: '', whatsapp: '' },
  contact: { email: '', phone: '', address: '', city: '', state: '', country: '', postalCode: '', website: '' },
  company: { name: '', description: '', founded: '', employees: '', industry: '', logo: '' },
  businessHours: {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '10:00', close: '16:00', closed: false },
    sunday: { open: '00:00', close: '00:00', closed: true },
  },
  seo: { title: '', description: '', keywords: [], ogImage: '', favicon: '' },
  app: { maintenanceMode: false, allowRegistration: true, requireEmailVerification: false, maxFileSize: 10, supportedFormats: ['jpg','jpeg','png','gif','pdf','doc','docx'] },
  appStore: { iosUrl: '', androidUrl: '' },
  regular: { discountPercentage: 10, minimumPrice: 0.5 },
};

export const getSettings = async () => {
  try {
    if (!supabase) return { id: 'general', ...defaultSettings };

    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'settings')
      .single();

    if (error || !data) return { id: 'general', ...defaultSettings };

    const s = data.value;
    return {
      id: 'general',
      socialMedia: { ...defaultSettings.socialMedia, ...s.socialMedia },
      contact: { ...defaultSettings.contact, ...s.contact },
      company: { ...defaultSettings.company, ...s.company },
      businessHours: { ...defaultSettings.businessHours, ...s.businessHours },
      seo: { ...defaultSettings.seo, ...s.seo },
      app: { ...defaultSettings.app, ...s.app },
      appStore: { ...defaultSettings.appStore, ...s.appStore },
      regular: { ...defaultSettings.regular, ...s.regular },
      referral: s.referral || {},
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    return { id: 'general', ...defaultSettings };
  }
};

export const updateSettings = async (settingsData, userId) => {
  try {
    if (!supabase) throw new Error('Supabase not initialized');
    const { error } = await supabase
      .from('app_config')
      .upsert({ key: 'settings', value: { ...settingsData, updatedBy: userId }, updated_at: new Date().toISOString() });
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

export const updateSettingsSection = async (section, data, userId) => {
  try {
    const settings = await getSettings();
    settings[section] = data;
    return await updateSettings(settings, userId);
  } catch (error) {
    console.error('Error updating settings section:', error);
    throw error;
  }
};

export const getSocialMediaLinks = async () => {
  const s = await getSettings();
  return s.socialMedia || defaultSettings.socialMedia;
};

export const getContactInfo = async () => {
  const s = await getSettings();
  return s.contact || defaultSettings.contact;
};

export const getAppStoreLinks = async () => {
  const s = await getSettings();
  return s.appStore || defaultSettings.appStore;
};

export const getCompanyInfo = async () => {
  const s = await getSettings();
  return s.company || defaultSettings.company;
};

export const getRegularSettings = async () => {
  const s = await getSettings();
  return s.regular || { discountPercentage: 10, minimumPrice: 0.5 };
};

export const resetSettingsToDefaults = async (userId) => {
  return await updateSettings(defaultSettings, userId);
};

export const validateSettings = (settings) => {
  const errors = {};
  if (settings.contact?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contact.email)) {
    errors.email = 'Please enter a valid email address';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
};
