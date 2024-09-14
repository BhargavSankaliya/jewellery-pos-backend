const mongoose = require("mongoose")
const config = require("../environmentVariable.json")

const connectDB = async () => {
   try {
      await mongoose.connect(config.MONGO_URL)
      console.log("database connected successfully!")
   }
   catch (error) {
      console.log("database is not connected! " + error)
   }
}

module.exports = connectDB