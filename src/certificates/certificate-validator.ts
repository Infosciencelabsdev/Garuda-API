import * as Joi from "joi";

export const verifyCertificate = Joi.object().keys({
  certificate: Joi.binary().required(),
  message: Joi.string().required(),
  subject: Joi.string().required()
});
// export const signupModel = Joi.object().keys({
//  firstName: Joi.string().required(),
//  email: Joi.string().required(),
//  // fromemail: Joi.string().required(),
// });