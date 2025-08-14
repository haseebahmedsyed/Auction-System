const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { validateToken } = require('./../middleware/middleware')
const { createAuction, getAuction, getAllAuctions,checkJobExists } = require('./../controller/auction')
const router = express.Router();

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save images to the 'uploads' folder
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Validate file type
        const fileTypes = /jpeg|jpg|png/;
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);

        if (extName && mimeType) {
            cb(null, true);
        } else {
            cb(new Error("Only images (jpeg, jpg, png) are allowed."));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
});

router.post('/create-auction', validateToken(true), upload.any('images'), createAuction)
router.get('/get-auction/:id', validateToken(), getAuction)
router.get('/get-auctions', validateToken(), getAllAuctions)
router.post('/job-exists', checkJobExists)

module.exports = router;