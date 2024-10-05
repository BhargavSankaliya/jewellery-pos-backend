const jwt = require("jsonwebtoken");
const { CustomError, errorHandler } = require("./error");
const config = require("../environmentVariable.json");
const StoreModel = require("../models/storeModel");
const { MachineModel } = require("../models/machineModel");

const verifyMachineToken = async (req, res, next) => {
  try {

    let token = req.headers["authorization"];
    if (!token || !token.startsWith("Bearer ")) {
      throw new CustomError("No token provided", 401);
    }

    token = token.split("Bearer ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (err) {
      throw new CustomError("Invalid token", 401);
    }
    const machineId = decoded._id;
    const machine = await MachineModel.findOne({
      _id: machineId,
    });

    if (!machine) {
      throw new CustomError("Invalid or expired token!", 400);
    }

    if (machine.status == 'Inactive') {
      throw new CustomError("Machine is inactivated!", 401);
    }

    req.machine = machine;
    next();
  } catch (error) {
    errorHandler(error, req, res)
  }
};

module.exports = verifyMachineToken;
