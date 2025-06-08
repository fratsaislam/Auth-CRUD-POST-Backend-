const nodemailer = require("nodemailer");
require("dotenv").config();

const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user:process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
        pass:process.env.NODE_CODE_SENDING_EMAIL_PASSWORD,
    }
})

module.exports = transport;