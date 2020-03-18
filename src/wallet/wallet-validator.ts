import * as Joi from "joi";

export const createUserModel = Joi.object().keys({
    email: Joi.string().email().trim().required(),
    password: Joi.string().trim().required(),
    username: Joi.string().trim().required(),
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    roleId: Joi.string().required()
});
export const createWallet = Joi.object().keys({
    email: Joi.string().email().trim().required(),
    // password: Joi.string().required(),
});
export const getWallet = Joi.object().keys({
    email: Joi.string().email().trim().required(),
    password: Joi.string().required(),
});