const express = require('express');

const router = express.Router()
const { validateSchema } = require('../models/baseModel');
const CouponModel = require('../models/couponModel');
const { couponsController } = require('../controllers/couponsController');
const cron = require('node-cron');

// Function to handle the cron job logic
async function markExpiredCoupons() {
    try {
        const currentDateUTC = new Date(); // This will automatically be in UTC

        // Update expired coupons by marking them as deleted
        const result = await CouponModel.updateMany(
            {
                endDate: { $lt: currentDateUTC },
                isDeleted: false // Only update if the coupon isn't already deleted
            },
            { $set: { isDeleted: true } }
        );

        console.log(`${result.nModified} coupons marked as deleted`);
    } catch (err) {
        console.error('Error updating expired coupons:', err);
    }
}

// Schedule the cron job to run at midnight UTC
cron.schedule('0 0 * * *', async () => {
    console.log('Running coupon expiration check at midnight UTC');
    await markExpiredCoupons();
}, {
    timezone: "Etc/UTC" // Ensure that the job runs in UTC
});

//coupon create and update api (if update then _id pass in query)
router.post("/create", couponsController.createCoupons);

// store list using coupon configuration
router.get("/storeListForCoupon", couponsController.createCouponForStoreList);

// coupon list
router.get("/list", couponsController.list);

// // ads details
// router.get("/getById", couponsController.getByAdsId);

// // coupon delete
router.delete("/delete", couponsController.couponDelete);

// // ads status update _id query
// router.get("/update-status", couponsController.updateAdsStatus);


module.exports = router