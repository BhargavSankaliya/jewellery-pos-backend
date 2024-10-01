const express = require('express');

const router = express.Router()
const { validateSchema } = require('../models/baseModel');
const { machineController } = require('../controllers/machineController');
const { MachineModel } = require('../models/machineModel');


//Category create and update api (if update then _id pass in query)
router.post("/create-update", validateSchema(MachineModel), machineController.createupdate);

// category list and active list if query isActive:true then
router.get("/list", machineController.list);

// category list and active list if query isActive:true then
router.get("/getById", machineController.getByCategoryId);

// category status update _id query
router.get("/update-status", machineController.udpateCatgoryStatus);


module.exports = router