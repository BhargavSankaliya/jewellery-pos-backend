const express = require('express');

const router = express.Router()
const { validateSchema } = require('../models/baseModel');
const { storeController } = require('../controllers/storeController');
const StoreModel = require('../models/storeModel');


//ads create and update api (if update then _id pass in query)
router.post("/create-update", validateSchema(StoreModel), storeController.createUpdateStore);

// ads list and active list if query isActive:true then
router.get("/list", storeController.list);

// ads details
router.get("/getById", storeController.getByAdsId);

// ads delete
router.delete("", storeController.adsDelete);

// ads status update _id query
router.get("/update-status", storeController.updateStoreStatus);

module.exports = router