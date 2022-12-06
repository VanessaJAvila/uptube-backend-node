require("dotenv").config();


// create reusable transporter object
    const mail = require("nodemailer");
    const transporter = mail.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_TEST,
            pass: process.env.EMAIL_TEST_APP_PSWD,
        },
        tls: {
            rejectUnauthorized: false,
        }
    });

// setup email data
async function sendMail(to, subject, text) {
    await transporter.sendMail({
        from: process.env.EMAIL,
        to: to,
        subject: subject,
        text: text
    }), function (error, info) {
    if (error) {
        return res.status(404).json({success: false, message: '[ERROR]'});
    } else {
        return res.status(200).json({sucess: true, message: 'Email sent', receiver_email});
    }}
}


module.exports = {sendMail};