const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
};

const sendOTPEmail = async (email, name, otp) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"MicDrop" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Verify Your MicDrop Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #e63946;">Welcome to MicDrop!</h2>
        <p>Hi ${name},</p>
        <p>Thanks for signing up. Please verify your email address using the OTP below:</p>
        <div style="background: #f4f4f4; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #e63946; letter-spacing: 8px; font-size: 36px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP is valid for <strong>10 minutes</strong>.</p>
        <p>If you did not create an account, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #888; font-size: 12px;">MicDrop — Where performers find their stage.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

const sendApplicationConfirmation = async (email, name, showTitle) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"MicDrop" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Application Received — ${showTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #e63946;">Application Submitted!</h2>
        <p>Hi ${name},</p>
        <p>We've received your performer application for <strong>${showTitle}</strong>.</p>
        <p>Your application is currently <strong>under review</strong>. You'll receive an email once a decision has been made.</p>
        <p>Good luck! 🎤</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #888; font-size: 12px;">MicDrop — Where performers find their stage.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

const sendApprovalEmail = async (email, name, showTitle, slotTime) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"MicDrop" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `You're In! — ${showTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2a9d8f;">Congratulations, ${name}!</h2>
        <p>Your application for <strong>${showTitle}</strong> has been <strong style="color: #2a9d8f;">approved</strong>!</p>
        ${slotTime ? `<p>Your performance slot: <strong>${slotTime}</strong></p>` : ''}
        <p>Get ready to take the stage. Please arrive at least 30 minutes before the show starts.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #888; font-size: 12px;">MicDrop — Where performers find their stage.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

const sendRejectionEmail = async (email, name, showTitle, feedback) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"MicDrop" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Application Update — ${showTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #e63946;">Application Update</h2>
        <p>Hi ${name},</p>
        <p>Thank you for applying to perform at <strong>${showTitle}</strong>.</p>
        <p>After careful consideration, we're unable to accommodate your application for this show.</p>
        ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ''}
        <p>We encourage you to apply for future shows. Keep performing!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #888; font-size: 12px;">MicDrop — Where performers find their stage.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

const sendTicketEmail = async (email, name, booking, pdfBuffer) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"MicDrop" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Your Tickets — ${booking.show?.title || 'MicDrop Show'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #e63946;">Your Tickets Are Ready!</h2>
        <p>Hi ${name},</p>
        <p>Thanks for booking! Your tickets for <strong>${booking.show?.title || 'the show'}</strong> are attached.</p>
        <div style="background: #f9f9f9; border-left: 4px solid #e63946; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Quantity:</strong> ${booking.quantity} ticket(s)</p>
          <p style="margin: 5px 0 0;"><strong>Total Paid:</strong> ₹${booking.totalAmount}</p>
        </div>
        <p>Please present your QR code at the venue for entry.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #888; font-size: 12px;">MicDrop — Where performers find their stage.</p>
      </div>
    `,
    attachments: [
      {
        filename: `micdrop-ticket-${booking._id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };
  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendOTPEmail,
  sendApplicationConfirmation,
  sendApprovalEmail,
  sendRejectionEmail,
  sendTicketEmail,
};
