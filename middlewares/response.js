// utils/responseHandler.js
function createResponse(data, code, message, res) {
    if (data == 'error') {
        const response = {
            meta: {
                code,
                success: false,
                message
            }
        };
        res.status(code).json(response);
    }
    else if (data) {
        const response = {
            data,
            meta: {
                code,
                success: code == 200 || code == 201 ? true : false,
                message
            }
        };
        res.status(code).json(response);
    }
    else {
        const response = {
            meta: {
                code,
                success: code == 200 || code == 201 ? true : false,
                message
            }
        };
        res.status(code).json(response);
    }

}

module.exports = createResponse;
