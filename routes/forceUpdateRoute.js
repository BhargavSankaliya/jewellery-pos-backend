const express = require('express');

const router = express.Router()
const { validateSchema } = require('../models/baseModel');
const forceUpdateModel = require('../models/forceUpdateModel');
const { forceUpdateController } = require('../controllers/forceUpdateController');


//ads create and update api (if update then _id pass in query)
router.post("", validateSchema(forceUpdateModel), forceUpdateController.createUpdate);

// ads list and active list if query isActive:true then
router.get("", forceUpdateController.list);

module.exports = router