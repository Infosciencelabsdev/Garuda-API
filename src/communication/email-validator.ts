import * as Joi from "joi";

export const emailModel = Joi.object().keys({
  password: Joi.string().trim().optional(),
  email: Joi.string().optional(),
});
export const contactUsModel = Joi.object().keys({
 message: Joi.string().required(),
 subject: Joi.string().required()
});
export const signupModel = Joi.object().keys({
 firstName: Joi.string().required(),
 email: Joi.string().required(),
 // fromemail: Joi.string().required(),
});