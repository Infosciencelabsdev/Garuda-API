import * as Joi from "joi";

export const addEditTaxModel = Joi.object().keys({
    percent: Joi.number().required().min(0).max(100),
    propertyType: Joi.string().optional().valid([ "Commercial", "Residential", "Agricultural", "Others"]),
});