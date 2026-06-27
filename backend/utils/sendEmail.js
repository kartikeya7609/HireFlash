const sendEmail = async (options) => {
  const serviceId = process.env.EMAILJS_SERVICE_ID || 'service_mdjy4m6';
  const templateId = process.env.EMAILJS_TEMPLATE_ID || 'template_tu5jcf6';
  const publicKey = process.env.EMAILJS_PUBLIC_KEY || 'x5ns0x845LwLgna6x';

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email: options.email,
      to_name: options.name || options.email.split('@')[0],
      name: options.name || options.email.split('@')[0],
      email: options.email,
      otp_code: options.otp || '',
      app_name: 'FasHire',
      expiry_minutes: '5'
    }
  };

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EmailJS API request failed: ${response.status} - ${errorText}`);
  }

  return { success: true };
};

export default sendEmail;
