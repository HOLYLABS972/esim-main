// FCM Service - STUBBED (Firebase FCM removed)
// Push notifications are no longer available.

export const fcmService = {
  async sendNotification() {
    console.warn('FCM notifications are disabled (Firebase removed)');
    return { success: false, message: 'FCM removed' };
  },
  async getTokens() { return []; },
  async saveToken() { return { success: false }; },
};

export default fcmService;
