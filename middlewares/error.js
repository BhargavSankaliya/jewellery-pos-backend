// const errorHandler = (err, req, res, next) => {
//     console.error(err.stack)
//     if (err instanceof CustomError) {
//         return res.status(err.status).json({ error: err.message })
//     } else if (err.name === "ValidationError") {
//         const errorMessages = Object.values(err.errors).map((err) => err.message);
//         return res.status(400).json({ errors: errorMessages });
//     } else {
//         return res.status(500).json({ error: "Internal Server Error!" });
//     }
// };

const createResponse = require("./response.js");


// class CustomError extends Error{
//     constructor(message,status=500, code = "INTERNAL_SERVER_ERROR"){
//         super(message)
//         this.name=this.constructor.name
//         this.status=status
//         this.code = code
//         Error.captureStackTrace(this,this.constructor)
//     }
// }

// ------------------------------------------------------------------- NEW START ---------------------------------------------------------------------------
function errorHandler(err, req, res, next) {
    let code, message;

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        code = 400;
        message = Object.values(err.errors).map(e => e.message).join(', ');
    }
    else if(err.name === 'TypeError') {
        code = 400;
        message = err.message
    }
    // Handle custom errors
    else if (err instanceof CustomError) {
        code = err.statusCode;
        message = err.message;
    }
    // Other server errors
    else {
        code = 500;
        message = 'Internal Server Error';
    }

    const response = createResponse('', code, message, res);
    // res.status(code).json(response);
}
// ------------------------------------------------------------------- NEW END -----------------------------------------------------------------------------



// ------------------------------------------------------------------- NEW START ---------------------------------------------------------------------------
class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
// ------------------------------------------------------------------- NEW END -----------------------------------------------------------------------------


module.exports = { errorHandler, CustomError }