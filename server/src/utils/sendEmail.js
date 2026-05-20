import sgMail from "@sendgrid/mail";

const FROM_EMAIL = "keshav0795.be23@chitkara.edu.in";
const FROM_NAME = "SyncSpace";

const sendEmail = async ({ to, subject, text }) => {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error("SENDGRID_API_KEY is missing in environment");
    }

    sgMail.setApiKey(apiKey);

    await sgMail.send({
      to,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject,
      text,
    });

    console.log(`Email sent to ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export default sendEmail;
