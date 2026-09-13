import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendEmail = async (options) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      ...options,
    });
    return info;
  } catch (error) {
    console.error('Ошибка при отправке email:', error);
    throw error;
  }
};
