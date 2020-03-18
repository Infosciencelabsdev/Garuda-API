import * as Joi from "joi";

export const loginModel = Joi.object().keys({
    email: Joi.string().email().trim().required(),
    password: Joi.string().trim().required()
});

export const registerModel = Joi.object().keys({
    email: Joi.string().email().trim().required(),
    password: Joi.string().trim().required(),
    name: Joi.string().required(),
    phone: Joi.string().required(),
    dob: Joi.date().optional(),
    roleId: Joi.string().optional(), //.when('createdBy', { is : 'admin', then: Joi.required()}),
    orgId: Joi.string().optional().when('roleId', { is: 'builder', then: Joi.required() }),
    address: Joi.object().optional().keys({
        street: Joi.string().optional(),
        city: Joi.string().optional(),
        state: Joi.string().optional(),
        country: Joi.string().optional(),
        zip: Joi.number().optional()
    }),
});
export const updateProfile = Joi.object().keys({
    email: Joi.string().email().trim().required(),
    name: Joi.string().required(),
    phone: Joi.string().required(),
    dob: Joi.date().required(),
    roleId: Joi.string().required(), //.when('createdBy', { is : 'admin', then: Joi.required()}),
    orgId: Joi.string().optional().allow(null), //.when('roleId', { is : 'builder', then: Joi.required()}),
    address: Joi.object().required().keys({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        country: Joi.string().required(),
        zip: Joi.number().required()
    }),
    createdAt: Joi.string().optional(),
    id: Joi.string().optional(),
    role: Joi.number().optional(),
    updatedAt: Joi.string().optional(),
    userId: Joi.string().optional(),
    verified: Joi.boolean().optional(),
    walletAddress: Joi.string().optional(),
});
export const changeRole = Joi.object().keys({
    email: Joi.string().email().trim().required(),
    roleId: Joi.string().required(),
});