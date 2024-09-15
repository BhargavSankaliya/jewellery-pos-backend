const express = require('express');
const { FileUpload } = require('../controllers/authController');
const router = express.Router();


//File upload
router.post('/file-upload', FileUpload);



module.exports = router