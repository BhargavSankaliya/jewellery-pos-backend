const express = require('express');

const router = express.Router()
const { validateSchema } = require('../models/baseModel');
const { storeController } = require('../controllers/storeController');
const StoreModel = require('../models/storeModel');


//ads create and update api (if update then _id pass in query)
router.post("/create-update", validateSchema(StoreModel), storeController.createUpdateStore);

// ads list and active list if query isActive:true then
router.get("/list", storeController.list);

// ads list and active list if query isActive:true then
router.post("/changePassword", storeController.changePasswordByEmail);

// ads details
router.get("/getById", storeController.getByAdsId);

// ads delete
router.delete("", storeController.adsDelete);

// ads status update _id query
router.get("/update-status", storeController.updateStoreStatus);

// update gold percentage value 
router.post("/update-gold-percentage", storeController.updateGoldPercentageValue);

// update gold percentage value 
router.get("/latest/goldPrice", storeController.getGoldPriceLatest);

module.exports = router