const express = require('express');
const { FileUpload } = require('../controllers/authController');
const { orderController } = require('../controllers/orderController');
const router = express.Router();


router.get('/dashboard-count', orderController.dashboardCount);

router.post('/order-chart', orderController.orderChartData);

router.get('/list', orderController.list);

router.get('/details', orderController.orderDetails);

router.post('/order-category-base-chart', orderController.orderChartCategoryBaseData);


module.exports = router