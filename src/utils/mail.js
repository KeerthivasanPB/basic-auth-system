import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendMail = async (options) => {
  const mailGenerator = new Mailgen({
    theme : 'default',
    product : {
      name :"task manager",
      link : "https://taskmanager.com"
    }
  })

  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent)
  const emailHTML = mailGenerator.generate(options.mailgenContent,);

  const transporter = nodemailer.createTransport({
    host: process.env. MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT,
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  })

  const mail = {
    from: "mail.taskmanager@example.com",
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHTML,
  };
  
  try {
    await transporter.sendMail(mail)
  } catch (error) {
    console.log("Email service failed silently. Make sure you have a valid mailtrap account")
    console.log("error : ", error)
  }
}

const emailVerificationContent = (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro:
        "Welcome to Project Management Application! We're very excited to have you on board.",
      action: {
        instructions: "To verify your email, please click here:",
        button: {
          color: "#22BC66",
          text: "Verify your email",
          link: verificationUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};
const forgotPasswordContent = (username, passwordResetUrl) => {
  return {
    body: {
      name: username,
      intro:
        "We got a request to reset your password.",
      action: {
        instructions: "To reset your password, please click here:",
        button: {
          color: "#22BC66",
          text: "Reset your password",
          link: passwordResetUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

export { emailVerificationContent, forgotPasswordContent, sendMail };