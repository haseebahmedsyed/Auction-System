const otpGenerator = require('otp-generator')

exports.generate = () => {
    return otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
}