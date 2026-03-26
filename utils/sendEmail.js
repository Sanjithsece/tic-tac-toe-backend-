const nodemailer = require("nodemailer");

const sendEmail = async ({ email, subject, html }) => {

  // Create fake SMTP account automatically
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });

  const info = await transporter.sendMail({
    from: '"TicTacToe App" <no-reply@tictac.com>',
    to: email,
    subject,
    html
  });

  console.log("Reset Link Preview URL:");
  console.log(nodemailer.getTestMessageUrl(info));
};

module.exports = sendEmail;