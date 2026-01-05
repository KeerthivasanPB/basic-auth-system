import {validationResult} from 'express-validator'
import {ApiError} from '../utils/api-error.js'

export const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next();
    }
    else{
        const extractedErrors = errors.array().map(err => ({ [err.path]: err.msg }))
        throw new ApiError(422, 'Recieved invalid data', extractedErrors);
    }
}