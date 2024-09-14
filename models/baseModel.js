const createResponse = require("../middlewares/response");

/**
     * @description Validate data based on entire schema
     * @param {*} data
     */
function validate(data) {
    var self = this;

    for (var key in data) {
        let scm = self.schema[key];
        let val = data[key];

        if (
            val === "" ||
            val === null ||
            val === undefined
        ) {
            if (scm === undefined) {
                return new customError.InvalidInputError(
                    "field " + key + " not exist"
                );
            }

            if (!scm.allowNullEmpty) {
                return new customError.InvalidInputError(
                    key + " should not be empty"
                );
            }
        } else {
            if (scm === undefined) {
                return new customError.InvalidInputError(
                    "field " + key + " not exist"
                );
            }
            if (
                !_.isObject(val) &&
                /^\d+$/.test(val) &&
                scm.type.name.toString().toLowerCase() === "number"
            ) {
                val = parseInt(val);
            }

            if (!(typeof val === scm.type.name.toString().toLowerCase())) {
                if (_.isArray(val)) {
                    if ("array" !== scm.type.name.toString().toLowerCase()) {
                        return new customError.InvalidInputError(
                            key + " should not be empty"
                        );
                    }
                } else if (_.isObject(val)) {
                    if ("object" !== scm.type.name.toString().toLowerCase()) {
                        return new customError.InvalidInputError(
                            key + " should not be empty"
                        );
                    }
                } else {
                    return new customError.InvalidInputError(
                        key + " should be type of " + scm.type.name
                    );
                }
            } else if (scm.enum && !scm.enum[val]) {
                return new customError.InvalidInputError(
                    key + " should be type of supported type"
                );
            } else if (scm.regex && !scm.regex.test(String(val).toLowerCase())) {
                return new customError.InvalidInputError(
                    val + " is not a valid " + key
                );
            }
        }
    }
}


// middleware/validateSchema.js

function validateSchema(model) {
    return (req, res, next) => {
        const doc = new model(req.body); // Create a new document instance

        const validationError = doc.validateSync(); // Validate without saving

        if (validationError) {
            const errorMessages = Object.values(validationError.errors).map(e => e.message);
            const response = createResponse(null, 400, errorMessages.join(', '), res);

            // Send validation error response before proceeding to the API logic
            return res.status(400).json(response);
        }

        // If validation passes, move on to the actual API handler
        next();
    };
}


module.exports = { validate, validateSchema };