import * as Joi from "joi";
export const listPropertyModel = Joi.object().keys({
    propertyId: Joi.string().required(),
    value: Joi.number().required(), // value per month for rent/ cost for sell
    listingType: Joi.string().required().valid(["sell", "rent", "transfer"]),
    user: Joi.string().optional().when('listingType', { is: Joi.string().valid("transfer"), then: Joi.string().required() }),
});
export const delistPropertyModel = Joi.object().keys({
    propertyId: Joi.string().required(),
});