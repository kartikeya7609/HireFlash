import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  let transporter;

  const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD;

  if (hasSmtpConfig) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: parseInt(process.env.SMTP_PORT, 10) === 465,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      }
    });
  } else {
    // Automatic developer dynamic testing gateway (Ethereal Email)
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  const fromName = process.env.SMTP_FROM_NAME || 'FasHire Marketplace';
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_EMAIL || 'support@fashire.com';

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  const info = await transporter.sendMail(mailOptions);

  if (!hasSmtpConfig) {
    // Provide Ethereal test inbox URL so the user can literally click and read the real HTML email in the browser!
    const testUrl = nodemailer.getTestMessageUrl(info);
    return { success: true, testUrl };
  }

  return { success: true };
};

export default sendEmail;
