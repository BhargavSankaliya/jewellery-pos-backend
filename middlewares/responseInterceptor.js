// middlewares/responseInterceptor.js

const responseInterceptor = (req, res, next) => {
    // Store the original send method
    const originalSend = res.send;

    res.send = function (data) {

        const Udata = data ? JSON.parse(data) : ''

        // Modify the response structure
        const formattedResponse = {
            data: Udata,
            meta: {
                success: res.statusCode >= 200 && res.statusCode < 300,
                status: res.statusCode,
                timestamp: new Date().toISOString(),
                message: (Udata && Udata.message) ? Udata.message : (Udata && Udata.error) ? Udata.error : ''
            }
        };

        // Call the original send method with the modified response
        originalSend.call(this, JSON.stringify(formattedResponse));
    };

    next();
};

module.exports = responseInterceptor;
