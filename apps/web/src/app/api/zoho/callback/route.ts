import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/zoho/callback
 * OAuth callback handler for Zoho authorization
 *
 * This endpoint receives the authorization code from Zoho
 * and displays it for manual token exchange.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Zoho Authorization Error</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { background: #fee; border: 1px solid #f00; padding: 20px; border-radius: 8px; }
            h1 { color: #c00; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Authorization Failed</h1>
            <p><strong>Error:</strong> ${error}</p>
            <p><strong>Description:</strong> ${errorDescription || 'No description provided'}</p>
            <p>Please try the authorization process again.</p>
          </div>
        </body>
      </html>
      `,
      {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      }
    )
  }

  if (!code) {
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Zoho Callback</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          </style>
        </head>
        <body>
          <h1>No Authorization Code</h1>
          <p>No code was received from Zoho. Please start the authorization process again.</p>
        </body>
      </html>
      `,
      {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      }
    )
  }

  // Display the code and instructions
  return new NextResponse(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Zoho Authorization Success</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 700px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
          .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #2e7d32; margin-top: 0; }
          .code-box { background: #1a1a2e; color: #0f0; padding: 15px; border-radius: 8px; font-family: monospace; word-break: break-all; margin: 20px 0; }
          .step { background: #f0f7ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #1976d2; }
          .step h3 { margin-top: 0; color: #1976d2; }
          pre { background: #263238; color: #aed581; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 13px; }
          .warning { background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800; margin: 15px 0; }
          button { background: #1976d2; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; }
          button:hover { background: #1565c0; }
          .copied { background: #2e7d32 !important; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✓ Authorization Successful!</h1>

          <p>Your authorization code has been received. <strong>This code expires in ~1 minute</strong>, so act quickly!</p>

          <div class="code-box" id="codeBox">
            ${code}
          </div>

          <button onclick="copyCode()">Copy Code</button>

          <div class="warning">
            <strong>⚠️ Important:</strong> This code can only be used once and expires very quickly. Complete the next step immediately.
          </div>

          <div class="step">
            <h3>Step 2: Exchange Code for Refresh Token</h3>
            <p>Run this command in your terminal (replace YOUR_CLIENT_ID and YOUR_CLIENT_SECRET):</p>
            <pre>curl -X POST "https://accounts.zoho.com/oauth/v2/token" \\
  -d "grant_type=authorization_code" \\
  -d "client_id=YOUR_CLIENT_ID" \\
  -d "client_secret=YOUR_CLIENT_SECRET" \\
  -d "redirect_uri=https://helpdesk.easyservicesgroup.co.za/api/zoho/callback" \\
  -d "code=${code}"</pre>
          </div>

          <div class="step">
            <h3>Step 3: Save Your Refresh Token</h3>
            <p>The response will contain a <code>refresh_token</code>. Add it to your <code>.env</code> file:</p>
            <pre>ZOHO_REFRESH_TOKEN=1000.xxxx.xxxx.xxxx</pre>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            You can close this window after completing the steps above.
          </p>
        </div>

        <script>
          function copyCode() {
            navigator.clipboard.writeText('${code}');
            const btn = event.target;
            btn.textContent = 'Copied!';
            btn.classList.add('copied');
            setTimeout(() => {
              btn.textContent = 'Copy Code';
              btn.classList.remove('copied');
            }, 2000);
          }
        </script>
      </body>
    </html>
    `,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    }
  )
}
