import nodemailer from "nodemailer";

export class StandardEmailSender {
  sendEmail(fromName, fromEmail, toAddress, subject, body) {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASS,
      },
    });

    transporter
      .sendMail({
        from: `${fromName} <${fromEmail}>`,
        to: `${toAddress}`,
        subject: subject,
        html: `${body}`,
      })
      .then((info) => {
        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      });
  }
}

export class EmailSenderFactory {
  static getDefaultInstance() {
    return this.getInstance(EmailProvider.DEFAULT);
  }

  static getInstance(provider) {
    if (provider === EmailProvider.DEFAULT) {
      return new StandardEmailSender();
    }
    return new StandardEmailSender();
  }
}

export default new StandardEmailSender();

export const capitalizeEachWord = (str) => {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};
