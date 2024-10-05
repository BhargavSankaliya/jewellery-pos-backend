const express = require('express');

const router = express.Router()
const { validateSchema } = require('../models/baseModel');
const { machineAuthController } = require('../controllers/machineAuthController');

//ads create and update api (if update then _id pass in query)
router.post("/machine-login", machineAuthController.loginMachine);

module.exports = router