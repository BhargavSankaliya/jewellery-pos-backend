const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { CustomError, errorHandler } = require("../middlewares/error");
const config = require("../environmentVariable.json")

const verifyToken = async (req, res, next) => {
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
    const userId = decoded._id;
    const user = await User.findOne({
      _id: userId,
    });

    if (user.jwtToken !== token) {
      throw new CustomError("Unauthorized! Token mismatch", 401);
    }

    if (!user) {
      throw new CustomError("Invalid or expired token!", 400);
    }

    req.user = user;
    next();
  } catch (error) {
    errorHandler(error, req, res)
  }
};

module.exports = verifyToken;
