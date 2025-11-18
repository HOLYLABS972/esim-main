import { NextResponse } from 'next/server';

const EMAIL_API_BASE_URL = 'https://smtp.roamjet.net/api/email/send';
const DEFAULT_PROJECT_ID = process.env.EMAIL_SERVICE_PROJECT_ID || 'FCOUZBcWQt5vtIDHrYkY';
const DEFAULT_TEMPLATE_ID = 'k13zDL6tsIIFhD6WcaR4';
const DEFAULT_COMPANY_NAME = process.env.EMAIL_SERVICE_COMPANY_NAME || 'Esim';

export async function POST(request) {
  try {
    const {
      email,
      userName,
      otpCode,
      projectId = DEFAULT_PROJECT_ID,
      templateId = DEFAULT_TEMPLATE_ID,
      companyName = DEFAULT_COMPANY_NAME,
      extraParams = {},
    } = await request.json();

    if (!email || !userName || !otpCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: email, userName, otpCode',
        },
        { status: 400 },
      );
    }

    const query = new URLSearchParams({
      email,
      project_id: projectId,
      template_id: templateId,
      user_name: userName,
      company_name: companyName,
      current_year: new Date().getFullYear().toString(),
      otp_code: otpCode,
    });

    if (extraParams && typeof extraParams === 'object') {
      Object.entries(extraParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.set(key, String(value));
        }
      });
    }

    const providerResponse = await fetch(`${EMAIL_API_BASE_URL}?${query.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const rawText = await providerResponse.text();
    let parsedBody = null;

    if (rawText) {
      try {
        parsedBody = JSON.parse(rawText);
      } catch {
        parsedBody = rawText;
      }
    }

    if (!providerResponse.ok) {
      console.error('Email provider error:', providerResponse.status, parsedBody);
      return NextResponse.json(
        {
          success: false,
          error: 'Email provider responded with an error',
          details: parsedBody,
        },
        { status: providerResponse.status },
      );
    }

    return NextResponse.json(
      {
        success: true,
        providerResponse: parsedBody,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Email proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Unexpected error while sending email',
      },
      { status: 500 },
    );
  }
}

export function GET() {
  return new NextResponse(null, {
    status: 405,
    headers: {
      Allow: 'POST',
    },
  });
}

