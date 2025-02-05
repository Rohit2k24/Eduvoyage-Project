const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const createTransporter = async () => {
  try {
    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );

    // Set refresh token
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN.trim()
    });

    try {
      // Get access token
      const accessToken = await oauth2Client.getAccessToken();
      console.log('Access token obtained');

      // Create transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.EMAIL_USER,
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN,
          accessToken: accessToken?.token
        }
      });

      return transporter;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error('Failed to get access token');
    }
  } catch (error) {
    console.error('Error creating transporter:', error);
    throw error;
  }
};

const sendVerificationEmail = async (email, verificationCode) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: {
        name: 'EduVoyage',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'EduVoyage - Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Welcome to EduVoyage!</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #3498db; font-size: 32px; letter-spacing: 5px;">${verificationCode}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return true;
  } catch (error) {
    console.error('Email error details:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = { sendVerificationEmail }; 