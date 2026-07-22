import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions) {
  // 1) Create a transport
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_HOST) || 2525,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define the email option
  const mailOptions = {
    from: `Ali Attash <ali.attash1234@gmail.com>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
  };

  // 3) Send the email

  await transporter.sendMail(mailOptions);
}
