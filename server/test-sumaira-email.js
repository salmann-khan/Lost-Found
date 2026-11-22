
require("dotenv").config();

const transporter = require("./config/mail");

async function testEmail() {
    try {
        await transporter.verify();

        console.log("SMTP connection successful.");

        const result = await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: "sumairasher69@gmail.com",
            subject: "FindIt - Email Delivery Test",
            text: "Hello Sumaira, this is a test email from the FindIt platform."
        });

        console.log("Test email accepted by SMTP.");
        console.log("Message ID:", result.messageId);
        console.log("Accepted:", result.accepted);
        console.log("Rejected:", result.rejected);

    } catch (error) {
        console.error("Test email failed:", error.message);
    } finally {
        transporter.close();
    }
}

testEmail();
