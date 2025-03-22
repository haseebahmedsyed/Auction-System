const otpGenerator = require('./../utils/otpGenerator')
const Database = require('./../database/connection');
const nodemailer = require('./../utils/nodemailer');
const { checkOtpValidation, getJsonWebToken } = require('./../utils/helper')
const Constant = require('../utils/constants')
const twilio = require('./../utils/twilio')

queryOtp = async (column, value) => {
    let res = await Database.query(`SELECT ${column} FROM otp WHERE contact=$1`, [value]);
    return res
}

exports.sendOTP = async (req, res) => {
    const { contact } = req.body;
    if (!contact) return res.status(400).json({ isError: true, message: "Contact is required" });

    try {
        // Generate a unique OTP
        let generatedOtp;
        let isOtpUnique = false;

        while (!isOtpUnique) {
            generatedOtp = otpGenerator.generate();
            const { rows } = await queryOtp('otp', generatedOtp);
            isOtpUnique = rows.length === 0;
        }

        const otpExpirationTime = Date.now() + 5 * 60 * 1000;

        // Check if contact exists and update or insert accordingly
        const { rows: contactRows } = await queryOtp('contact', contact);

        if (contactRows.length > 0) {
            // Update existing OTP
            await Database.query(
                'UPDATE otp SET otp = $1, expiration = $2 WHERE contact = $3',
                [generatedOtp, otpExpirationTime, contact]
            );
        } else {
            // Insert new OTP
            await Database.query(
                'INSERT INTO otp (contact, otp, expiration) VALUES ($1, $2, $3)',
                [contact, generatedOtp, otpExpirationTime]
            );
        }
        nodemailer.send(contact, `<p>Your OTP is <b>${generatedOtp}</b></p>`);
        // twilio.send(contact, generatedOtp)
        res.status(200).json({ isError: false, contact });
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { contact, otp } = req.body;
        if (!contact || !otp) return res.status(400).json({ isError: true, message: "Please provide complete information." });

        let isOtpValid = await checkOtpValidation(contact, otp)


        if (isOtpValid) {
            let token = getJsonWebToken({ contact, otp }, Constant.PURPOSE.REGISTRATION);
            return res.cookie('regtoken', token, {
                httpOnly: true, 
                expires: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)),
            }).status(200).json({ isError: false, message: 'Validation Successfull' });
        }

        return res.status(400).json({ isError: true, message: "Unauthorized use of service." });

    } catch (error) {
        console.log(error)
    }
}