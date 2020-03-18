import * as Joi from "joi";

//Model to transfer ownership after sell or transfer
export const bidModel = Joi.object().keys({
    // propertyId: Joi.string().required(),
    propertyId: Joi.string().required(), // listing id
    //value: Joi.number().required(),
    percent: Joi.number().required(), // percent
    value: Joi.number().required(),
    seller: Joi.array().items(Joi.string().optional()),
    buyer: Joi.array().items(Joi.string().optional()), //lesser in case of rent
    type: Joi.string().required(), // listing id
    toAddress: Joi.string().optional().when('type', { is: Joi.string().valid("transfer"), then: Joi.string().required() }),
    // sellDate: Joi.date().optional(),
    // isExpired: Joi.bool().optional()
});
export const confirmRequestModel = Joi.object().keys({
    id: Joi.string().required(),
    propertyId: Joi.string().optional(),
    status: Joi.string().required().valid(["Approved", "Rejected"]),
    message: Joi.string().optional(),
});