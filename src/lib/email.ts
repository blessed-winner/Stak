export async function sendPortalEmail({
  to,
  clientName,
  projectName,
  portalUrl,
}: {
  to: string;
  clientName: string;
  projectName: string;
  portalUrl: string;
}) {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY;
  if (!apiKey) {
    console.error('Missing VITE_RESEND_API_KEY');
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Stak <onboarding@resend.dev>',
        to: [to],
        subject: `Your project portal is ready: ${projectName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #111;">Hello ${clientName},</h2>
            <p style="color: #444; font-size: 16px; line-height: 1.5;">
              Your project portal for <strong>${projectName}</strong> has been created.
              You can now view the latest round of edits, leave timestamped feedback, and approve the work.
            </p>
            <div style="margin: 30px 0;">
              <a href="${portalUrl}" style="background-color: #111; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                View Portal
              </a>
            </div>
            <p style="color: #888; font-size: 14px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
              Powered by Stak
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('Failed to send email:', err);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
