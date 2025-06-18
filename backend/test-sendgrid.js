require('dotenv').config();
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

sgMail.send({
  to: 'sassanirocco@gmail.com',
  from: 'noreply@quickfixai.net',
  subject: 'Test Email from SendGrid',
  text: 'This is a test email sent from a minimal Node.js script using SendGrid.',
})
.then(() => console.log('Test email sent!'))
.catch((error) => console.error('SendGrid Error:', error));