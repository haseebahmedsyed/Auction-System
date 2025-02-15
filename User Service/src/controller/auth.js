const bcrypt = require('bcrypt')
const Database = require('./../database/connection')
const { getJsonWebToken } = require('./../utils/helper')
const Constant = require('../utils/constants')

exports.handleLogin = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Fetch user details from the database
        const query = `SELECT * FROM users WHERE username=$1 LIMIT 1`;
        const result = await Database.query(query, [username]);
        const user = result?.rows[0];

        // If user does not exist
        if (!user) {
            return res.status(400).json({
                isError: true,
                message: "Authentication failed. Please check your credentials.",
            });
        }

        // Verify password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                isError: true,
                message: "Authentication failed. Please check your credentials.",
            });
        }

        // Generate token and prepare user data for response
        const { password: pass, ...userData } = user;
        const token = getJsonWebToken(userData, Constant.PURPOSE.AUTHENTICATION);

        // Set secure cookie and send response
        return res
            .cookie("authtoken", token, {
                httpOnly: true,  // Prevent client-side scripts from accessing the cookie
                secure: process.env.NODE_ENV === "production",  // HTTPS-only in production
                maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
                sameSite: "strict", // Protect against CSRF
            })
            .status(200)
            .json({
                isError: false,
                message: "Login successful.",
                token,
                user: userData,
            });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            isError: true,
            message: "Internal Server Error. Please try again later.",
        });
    }
};

exports.handleRegistration = async (req, res) => {
    const { username, fullname, password, address, phone } = req.body;

    try {
        // Use WITH clause to check username existence and insert user if not exists
        const query = `
            WITH username_check AS (
                SELECT 1 FROM users WHERE username = $1 LIMIT 1
            ), insert_user AS (
                INSERT INTO users (username, fullname, password, address, phone)
                SELECT $1, $2, $3, $4, $5
                WHERE NOT EXISTS (SELECT 1 FROM username_check)
                RETURNING username, fullname, address, phone
            )
            SELECT * FROM insert_user;
        `;

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Execute the query
        const { rows } = await Database.query(query, [username, fullname, hashedPassword, address, phone]);

        if (rows.length === 0) {
            return res.json({ isError: true, message: 'Unable to process your request. Please check the provided details.' });
        }

        // Respond with the created user details
        const user = rows[0];
        res.status(200).json({ isError: false, message: 'Successfully registered.', user });

    } catch (error) {
        console.error("Error during registration:", error); // Log the error for debugging
        res.status(500).json({ isError: true, message: 'Internal Server Error' });
    }
};
