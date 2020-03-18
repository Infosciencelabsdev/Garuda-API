import * as Joi from "joi";
export const listPropertyModel = Joi.object().keys({
    propertyId: Joi.string().required(),
    value: Joi.number().required(), // value per month for rent/ cost for sell
    listingType: Joi.string().required().valid(["sell", "rent", "transfer"]),
    user: Joi.string().optional().when('listingType', { is: Joi.string().valid("transfer"), then: Joi.string().required() }),
});

//Model to transfer ownership after sell or transfer
export const bidModel = Joi.object().keys({
    // propertyId: Joi.string().required(),
    id: Joi.string().required(), // listing id
    // value: Joi.number().required(),
    tax: Joi.number().required(), // percent
    amount: Joi.number().required(),
    seller: Joi.array().items(Joi.string().optional()),
    buyer: Joi.array().items(Joi.string().optional()),
    // toAddress: Joi.string().optional(), //.when('type', { is: Joi.string().valid(["directsell", "transfer"]), then: Joi.string().required() }),
    // sellDate: Joi.date().optional(),
    // isExpired: Joi.bool().optional()
});
export const confirmRequestModel = Joi.object().keys({
    id: Joi.string().required(),
    propertyId: Joi.string().required(),
    status: Joi.string().required().valid(["Approved", "Rejected"]),
    message: Joi.string().optional(),
});