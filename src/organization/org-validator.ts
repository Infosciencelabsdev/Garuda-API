import * as Joi from "joi";

export const createModel = Joi.object().keys({
    name: Joi.string().required(),
    gst: Joi.string().required().min(15).max(15), //unique
    phone: Joi.string().required(),
    email: Joi.string().email().trim().required(), //unique
    password: Joi.string().trim().required(),
    // confirmPassword: Joi.string().trim().required(),
    address: Joi.object().required().keys({
        street: Joi.string().optional(),
        city: Joi.string().optional(),
        state: Joi.string().optional(),
        country: Joi.string().optional(),
        zip: Joi.number().optional()
      }),
    admin: Joi.array().items(Joi.string()).optional()
});