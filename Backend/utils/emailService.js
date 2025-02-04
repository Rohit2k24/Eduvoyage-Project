const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',  // Use Gmail service instead of custom SMTP
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

const sendVerificationEmail = async (email, verificationCode) => {
  // Test the connection first
  try {
    await transporter.verify();
    console.log('SMTP Connection verified successfully');
  } catch (error) {
    console.error('SMTP Connection verification failed:', error);
    return false;
  }

  const mailOptions = {
    from: `"EduVoyage" <${process.env.SMTP_EMAIL}>`,
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

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error; // Throw the error to be caught by the controller
  }
};

module.exports = { sendVerificationEmail }; 