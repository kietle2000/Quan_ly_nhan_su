import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return handleRequest(request, params.path, 'GET');
}

export async function POST(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return handleRequest(request, params.path, 'POST');
}

export async function PUT(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return handleRequest(request, params.path, 'PUT');
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return handleRequest(request, params.path, 'DELETE');
}

async function handleRequest(request: NextRequest, pathParts: string[], method: string) {
  const path = pathParts.join('/');
  
  // Extract query parameters
  const { searchParams } = new URL(request.url);
  const query: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    query[key] = value;
  });

  // Extract auth token and decode payload to get userId and userRole
  let userId = '';
  let userRole = '';
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const parts = token.split('.');
    if (parts.length === 3) {
      try {
        const payloadDecoded = Buffer.from(parts[1], 'base64').toString('utf-8');
        const payloadObj = JSON.parse(payloadDecoded);
        userId = payloadObj.userId || '';
        userRole = payloadObj.role || '';
      } catch (err) {
        console.error('Failed to parse token payload:', err);
      }
    }
  }

  // Parse request body
  let body: any = null;
  const contentType = request.headers.get('content-type') || '';
  if (method !== 'GET' && method !== 'DELETE') {
    if (contentType.includes('application/json')) {
      try {
        body = await request.json();
      } catch (e) {
        body = {};
      }
    } else if (contentType.includes('multipart/form-data')) {
      try {
        const formData = await request.formData();
        body = {};
        for (const [key, value] of formData.entries()) {
          const isFile = value && typeof value === 'object' && typeof (value as any).name === 'string' && typeof (value as any).arrayBuffer === 'function';
          console.log(`[API Router] Parsing formData key: "${key}", isFile: ${isFile}, constructor: ${value?.constructor?.name}`);
          if (isFile) {
            const fileValue = value as any;
            const bytes = await fileValue.arrayBuffer();
            const base64 = Buffer.from(bytes).toString('base64');
            body.file = {
              filename: fileValue.name,
              mimeType: fileValue.type,
              base64: base64
            };
          } else {
            body[key] = value;
          }
        }
      } catch (e) {
        console.error('Failed to parse multipart body:', e);
        body = {};
      }
    }
  }

  // Forward request to Google Apps Script Web App
  const gasUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const apiKey = process.env.GOOGLE_APPS_SCRIPT_API_KEY || 'NhanPhuHrmSecretApiKey_2026';

  if (!gasUrl) {
    return NextResponse.json({ error: 'GOOGLE_APPS_SCRIPT_URL environment variable is not configured' }, { status: 500 });
  }

  try {
    const payload = {
      apiKey,
      path,
      method,
      query,
      body,
      userId,
      userRole
    };

    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Apps Script returned HTTP status ${response.status}` }, { status: response.status });
    }

    const resData = await response.json();
    
    // Check if response contains an error field from Apps Script
    if (resData && resData.error) {
      return NextResponse.json({ error: resData.error }, { status: resData.status || 400 });
    }

    return NextResponse.json(resData);
  } catch (error: any) {
    console.error('Failed to forward request to Apps Script:', error);
    return NextResponse.json({ error: 'Failed to communicate with database server', details: error.message }, { status: 500 });
  }
}
