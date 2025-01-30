const express = require('express');
const { FileUpload } = require('../controllers/authController');
const { orderController } = require('../controllers/orderController');
const router = express.Router();


router.get('/dashboard-count', orderController.dashboardCount);

router.get('/dashboard-count-forStore', orderController.dashboardCountForStore);

router.post('/order-chart', orderController.orderChartData);

router.post('/order-chart-forStore', orderController.orderChartDataForStore);

router.get('/list', orderController.list);

router.get('/details', orderController.orderDetails);

router.post('/order-category-base-chart', orderController.orderChartCategoryBaseData);

router.post('/order-category-base-chart-forStore', orderController.orderChartCategoryBaseDataForStore);

router.post('/order-goldType-chart', orderController.goldTypeChartData);

router.post('/order-goldType-chart-forStore', orderController.goldTypeChartDataForStore);

router.get('/delete-order', orderController.deleteOrder);


module.exports = router