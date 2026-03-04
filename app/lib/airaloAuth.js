/**
 * Airalo API authentication helper.
 * Uses environment variables for credentials.
 */

const AIRALO_BASE_URL = 'https://partners-api.airalo.com';

export async function getAiraloAccessToken() {
  const clientId = process.env.AIRALO_CLIENT_ID || process.env.AIRALO_API_KEY;
  const clientSecret = process.env.AIRALO_CLIENT_SECRET || process.env.AIRALO_CLIENT_SECRET_PRODUCTION;

  if (!clientId || !clientSecret) {
    throw new Error('Airalo credentials not configured. Set AIRALO_CLIENT_ID and AIRALO_CLIENT_SECRET env vars.');
  }

  const authResponse = await fetch(`${AIRALO_BASE_URL}/v2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials'
    })
  });

  if (!authResponse.ok) {
    const errorText = await authResponse.text();
    throw new Error(`Airalo authentication failed: ${authResponse.statusText} - ${errorText}`);
  }

  const authData = await authResponse.json();
  const accessToken = authData.data?.access_token;

  if (!accessToken) {
    throw new Error('No access token received from Airalo API');
  }

  return accessToken;
}

export { AIRALO_BASE_URL };
