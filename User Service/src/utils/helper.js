const Database = require('./../database/connection');
const jwt = require('jsonwebtoken')
const Constants = require('./constants')
const authSecretPrivateKey = process.env.AUTH_SECRET.replace(/\\n/g, '\n');

exports.checkOtpValidation = async (contact, otp) => {
    let selectedOtpRecord = await Database.query("SELECT otp,expiration FROM otp WHERE contact=$1 AND otp=$2", [contact, otp]);

    if (selectedOtpRecord?.rows?.length > 0) {
        let record = selectedOtpRecord?.rows[0];
        if (Date.now() > record.expiration)
            return false;
        return true;
    } else {
        return false;
    }

}

exports.getJsonWebToken = (data, purpose) => {
    if (purpose == Constants.PURPOSE.REGISTRATION) {
        let token = jwt.sign({
            data: data
        }, process.env.OTP_SECRECT, { expiresIn: 15 * 60 * 1000 });

        return token;
    } else if (purpose == Constants.PURPOSE.AUTHENTICATION) {
        let token = jwt.sign({
            data: data
        }, authSecretPrivateKey, { expiresIn: '1h', algorithm: 'RS256' });

        return token;
    }
}