const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const createTransporter = async () => {
  try {
    console.log(process.env.GMAIL_REFRESH_TOKEN)
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
      console.log("🚀 ~ createTransporter ~ transporter:", transporter)

      // Verify the transporter
      await transporter.verify();
      console.log('Transporter verified successfully');
      
      return transporter;
    } catch (error) {
      console.error('Transporter error:', error);
      throw new Error(`Failed to create email transporter: ${error.message}`);
    }
  } catch (error) {
    console.error('OAuth2 error:', error);
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

const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    console.log('Creating email transporter...');
    const transporter = await createTransporter();
    console.log('Transporter created successfully');

    const mailOptions = {
      from: {
        name: 'EduVoyage',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'EduVoyage - Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <a href="${resetUrl}" style="
            display: inline-block;
            background: #3498db;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          ">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
          <p>This link will expire in 30 minutes.</p>
          <p>Or copy and paste this URL into your browser:</p>
          <p>${resetUrl}</p>
        </div>
      `
    };

    console.log('Sending password reset email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.response);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

module.exports = { 
  sendVerificationEmail, 
  sendPasswordResetEmail 
}; 