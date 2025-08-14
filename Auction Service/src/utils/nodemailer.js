var nodemailer = require('nodemailer');

exports.send = (email, text) => {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'syedhaseebahmed38@gmail.com',
            pass: process.env.NODEMAILER_PASSWORD
        }
    });

    var mailOptions = {
        from: 'syedhaseebahmed38@gmail.com',
        to: email,
        subject: '🎉 You’ve Won the Auction – Complete Your Payment Within 20 Minutes',
        html: text
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}
