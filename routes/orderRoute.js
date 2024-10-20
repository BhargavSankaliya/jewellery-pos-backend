const express = require('express');
const { FileUpload } = require('../controllers/authController');
const { orderController } = require('../controllers/orderController');
const router = express.Router();


router.get('/list', orderController.list);

router.get('/details', orderController.orderDetails);



module.exports = router