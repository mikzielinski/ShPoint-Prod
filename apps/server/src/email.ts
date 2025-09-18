import nodemailer from 'nodemailer';

// Email configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'ShPoint Team';
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || SMTP_USER;
const APP_URL = process.env.APP_URL || 'http://localhost:5174';

// Create transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️  Email configuration missing. Set SMTP_USER and SMTP_PASS in .env');
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return transporter;
}

// Email templates
export function createInvitationEmail(
  invitedEmail: string,
  inviterName: string,
  inviterEmail: string,
  role: string
): { subject: string; html: string; text: string } {
  const subject = `🎲 You're invited to join ShPoint!`;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShPoint Invitation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 32px;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 8px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 16px;
        }
        .subtitle {
            color: #64748b;
            font-size: 16px;
        }
        .content {
            margin-bottom: 32px;
        }
        .invitation-details {
            background: #f1f5f9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        .detail-label {
            font-weight: 600;
            color: #475569;
        }
        .detail-value {
            color: #1e293b;
        }
        .cta-button {
            display: inline-block;
            background: white;
            color: #1e293b;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 24px 0;
            border: 2px solid #1e293b;
        }
        .cta-button:hover {
            background: #f8fafc;
            border-color: #334155;
        }
        .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 24px;
            margin-top: 32px;
            color: #64748b;
            font-size: 14px;
            text-align: center;
        }
        .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 12px;
            margin: 16px 0;
            color: #92400e;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎲 ShPoint</div>
            <div class="title">You're Invited!</div>
            <div class="subtitle">Join the Shatterpoint community</div>
        </div>

        <div class="content">
            <p>Hello!</p>
            
            <p><strong>${inviterName}</strong> (${inviterEmail}) has invited you to join <strong>ShPoint</strong>, a community platform for Star Wars: Shatterpoint players.</p>

            <div class="invitation-details">
                <div class="detail-row">
                    <span class="detail-label">Invited by:</span>
                    <span class="detail-value">${inviterName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Your role:</span>
                    <span class="detail-value">${role}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${invitedEmail}</span>
                </div>
            </div>

            <p>ShPoint allows you to:</p>
            <ul>
                <li>📚 Browse the complete character library</li>
                <li>📋 Manage your collection and wishlist</li>
                <li>⚔️ Build and share strike teams</li>
                <li>🎯 Track missions and achievements</li>
                <li>👥 Connect with other players</li>
            </ul>

            <div style="text-align: center;">
                <a href="${APP_URL}" class="cta-button">Join ShPoint Now</a>
            </div>

            <div class="warning">
                <strong>⚠️ Important:</strong> You'll need to sign in with your Google account (${invitedEmail}) to access the platform.
            </div>

            <p>Once you click the button above, you'll be able to sign in with your Google account and start exploring ShPoint!</p>

            <p>Welcome to the community!</p>
        </div>

        <div class="footer">
            <p>This invitation was sent by ${inviterName} through ShPoint.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <p><strong>ShPoint Team</strong></p>
        </div>
    </div>
</body>
</html>`;

  const text = `
🎲 You're invited to join ShPoint!

Hello!

${inviterName} (${inviterEmail}) has invited you to join ShPoint, a community platform for Star Wars: Shatterpoint players.

Invitation Details:
- Invited by: ${inviterName}
- Your role: ${role}
- Email: ${invitedEmail}

ShPoint allows you to:
- 📚 Browse the complete character library
- 📋 Manage your collection and wishlist
- ⚔️ Build and share strike teams
- 🎯 Track missions and achievements
- 👥 Connect with other players

Join now: ${APP_URL}

⚠️ Important: You'll need to sign in with your Google account (${invitedEmail}) to access the platform.

Once you visit the link above, you'll be able to sign in with your Google account and start exploring ShPoint!

Welcome to the community!

---
This invitation was sent by ${inviterName} through ShPoint.
If you didn't expect this invitation, you can safely ignore this email.

ShPoint Team
`;

  return { subject, html, text };
}

// Send invitation email
export async function sendInvitationEmail(
  invitedEmail: string,
  inviterName: string,
  inviterEmail: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    
    if (!transporter) {
      return {
        success: false,
        error: 'Email service not configured. Please contact administrator.'
      };
    }

    const { subject, html, text } = createInvitationEmail(
      invitedEmail,
      inviterName,
      inviterEmail,
      role
    );

    const mailOptions = {
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM_ADDRESS}>`,
      to: invitedEmail,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Invitation email sent:', {
      to: invitedEmail,
      messageId: info.messageId,
      inviter: inviterName
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Error sending invitation email:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    };
  }
}

// Test email configuration
export async function testEmailConfiguration(): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    
    if (!transporter) {
      return {
        success: false,
        error: 'Email service not configured'
      };
    }

    // Test connection
    await transporter.verify();
    
    console.log('✅ Email configuration is valid');
    return { success: true };
  } catch (error) {
    console.error('❌ Email configuration test failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email configuration invalid'
    };
  }
}
