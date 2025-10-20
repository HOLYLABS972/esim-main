// Email service for sending OTP and verification emails

const EMAIL_API_BASE_URL = 'https://smtp.theholylabs.com/api/email/send';
const PROJECT_ID = 'FCOUZBcWQt5vtIDHrYkY';

// Template IDs for different email types
const TEMPLATE_IDS = {
  VERIFICATION: 'k13zDL6tsIIFhD6WcaR4', // Email verification template
  PASSWORD_RESET: 'k13zDL6tsIIFhD6WcaR4', // Password reset template (using same for now)
};

/**
 * Send verification email with OTP
 * @param {string} email - Recipient email
 * @param {string} userName - User's name
 * @param {string} otpCode - OTP code to send
 * @returns {Promise<boolean>} Success status
 */
export async function sendVerificationEmail(email, userName, otpCode) {
  try {
    const params = new URLSearchParams({
      email: email,
      project_id: PROJECT_ID,
      template_id: TEMPLATE_IDS.VERIFICATION,
      user_name: userName,
      otp_code: otpCode
    });

    const response = await fetch(`${EMAIL_API_BASE_URL}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log(`✅ Verification email sent to ${email} with OTP: ${otpCode}`);
      return true;
    } else {
      console.error('❌ Failed to send verification email:', response.statusText);
      console.log(`📧 OTP Code for ${email}: ${otpCode}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    console.log(`📧 OTP Code for ${email}: ${otpCode}`);
    return false;
  }
}

/**
 * Send password reset email with OTP
 * @param {string} email - Recipient email
 * @param {string} userName - User's name
 * @param {string} otpCode - OTP code to send
 * @returns {Promise<boolean>} Success status
 */
export async function sendPasswordResetEmail(email, userName, otpCode) {
  try {
    const params = new URLSearchParams({
      email: email,
      project_id: PROJECT_ID,
      template_id: TEMPLATE_IDS.PASSWORD_RESET,
      user_name: userName,
      otp_code: otpCode
    });

    const response = await fetch(`${EMAIL_API_BASE_URL}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log(`Password reset email sent to ${email} with OTP: ${otpCode}`);
      return true;
    } else {
      console.error('Failed to send password reset email:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

/**
 * Send custom email with OTP
 * @param {string} email - Recipient email
 * @param {string} userName - User's name
 * @param {string} otpCode - OTP code to send
 * @param {string} templateId - Template ID to use
 * @returns {Promise<boolean>} Success status
 */
export async function sendCustomEmail(email, userName, otpCode, templateId) {
  try {
    const params = new URLSearchParams({
      email: email,
      project_id: PROJECT_ID,
      template_id: templateId,
      user_name: userName,
      otp_code: otpCode
    });

    const response = await fetch(`${EMAIL_API_BASE_URL}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log(`Custom email sent to ${email} with OTP: ${otpCode}`);
      return true;
    } else {
      console.error('Failed to send custom email:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error sending custom email:', error);
    return false;
  }
}
