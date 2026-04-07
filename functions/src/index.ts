import { UserInfoClient } from 'auth0';
import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

const userInfoClient = new UserInfoClient({
  domain: 'dev-f32zx5mz1bt532qq.us.auth0.com',
});

// Configure your email sender (use Gmail app password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'bossmikosantos@gmail.com',       // ← your Gmail
    pass: 'kumw cyty kpfb ruwa',        
  },
});

export const exchangeAuth0Token = onCall(async (request) => {
  const { accessToken } = request.data;

  if (!accessToken) {
    throw new HttpsError('invalid-argument', 'Missing accessToken.');
  }

  try {
    const response = await userInfoClient.getUserInfo(accessToken);
    const user = response.data;
    const uid = user.sub;
    const email = user.email;
    const name = user.name || user.nickname || 'there';

    if (!uid) {
      throw new HttpsError('internal', 'Could not retrieve UID from Auth0.');
    }

    const firebaseToken = await admin.auth().createCustomToken(uid, { email });

    // ✅ Send login notification email
    if (email) {
      await transporter.sendMail({
        from: '"Study Buddy" <bossmikosantos@gmail.com>',
        to: email,
        subject: 'You just signed in to Study Buddy ',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafd; border-radius: 12px;">
            <h2 style="color: #0D2260; margin-bottom: 8px;">Hey ${name}! 👋</h2>
            <p style="color: #444; font-size: 15px; line-height: 1.6;">
              You just signed in to <strong>Study Buddy</strong>. Welcome back!
            </p>
            <p style="color: #444; font-size: 15px; line-height: 1.6;">
              If this wasn't you, please secure your account immediately.
            </p>
            <div style="margin-top: 24px; padding: 16px; background: #EAF2FB; border-radius: 8px;">
              <p style="color: #6B7A99; font-size: 13px; margin: 0;">
                Time: ${new Date().toLocaleString()}<br/>
                App: Study Buddy
              </p>
            </div>
          </div>
        `,
      });
      console.log('Login email sent to:', email);
    }

    return { firebaseToken };

  } catch (error: any) {
    console.error('Auth0 Exchange Error:', error);
    throw new HttpsError('unauthenticated', error.message || 'Token verification failed.');
  }
});