import * as Joi from "joi";
export const upload = Joi.object().keys({
  file: Joi.binary().required()
});
export const uploadMultiple = Joi.object().keys({
  files: Joi.array().items(Joi.binary()).required()
});