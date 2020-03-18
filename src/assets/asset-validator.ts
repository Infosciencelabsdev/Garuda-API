import * as Joi from "joi";
export const createPropertyModel = Joi.object().keys({
    name: Joi.string().trim().required(),
    description: Joi.string().optional(),
    area: Joi.number().required().unit("square-feet"),
    location: Joi.array().ordered([
        Joi.number().min(-90).max(90).required(),
        Joi.number().min(-180).max(180).required()
    ]).required(),
    propertyType: Joi.string().required().valid([ "Commercial", "Residential", "Agricultural", "Others"]),
    address: Joi.object().optional().keys({
        street: Joi.string().optional(),
        city: Joi.string().optional(),
        state: Joi.string().optional(),
        country: Joi.string().optional(),
        zip: Joi.number().optional()
    }),
    value: Joi.number().required(),
    owner: Joi.array().items(Joi.object().keys({
        id: Joi.string().required(), // userId for individuals, orgId for builders or government
        stake: Joi.number().required().min(0).max(100),
        type: Joi.string().optional(), // individual, builder, government, others
        buyDate: Joi.date().optional(),
        // docs: Joi.array().items(Joi.string().optional()),
        // verified: Joi.boolean().optional().default(false)
    })).required(),
    // status: Joi.string().required().valid(["NotExist", "Pending", "Approved", "Rejected", "Sold"]),
    image: Joi.array().items(Joi.binary().required()),
    docs: Joi.array().items(Joi.binary().required()),
    admin: Joi.array().items(Joi.string()).optional(),
    // addedBy: Joi.string().required(),
    // ownedBy: Joi.string().required(),
    // saleContract: Joi.string().optional().when('status', { is : 'Sold', then: Joi.required()})
});
//Model to confirm property after
export const confirmPropertyModel = Joi.object().keys({
    propertyId: Joi.string().required(),
    status: Joi.string().required().valid([ "Pending", "Approved", "Rejected"]),
    message: Joi.string().optional(),
});

export enum Status { Unsaved, Pending, Approved, Rejected, Listed, Sold }

//Model to transfer ownership after sell or transfer
export const transferRequestModel = Joi.object().keys({
    propertyId: Joi.string().required(),
    type: Joi.string().required().valid(["directsell", "transfer", "marketplace"]),
    toAddress: Joi.string().optional(), //.when('type', { is: Joi.string().valid(["directsell", "transfer"]), then: Joi.string().required() }),
    sellDate: Joi.date().optional(),
    isExpired: Joi.bool().optional()
});
export const confirmRequestModel = Joi.object().keys({
    transferId: Joi.string().required(),
    propertyId: Joi.string().required(),
    status: Joi.string().required().valid(["Approved", "Rejected"]),
});
export const editPropertyModel = Joi.object().keys({
    name: Joi.string().trim().required(),
    description: Joi.string().optional(),
    area: Joi.number().required().unit("square-feet"),
    location: Joi.array().ordered([
        Joi.number().min(-90).max(90).required(),
        Joi.number().min(-180).max(180).required()
    ]).required(),
    propertyType: Joi.string().required().valid([ "Commercial", "Residential", "Agricultural", "Others"]),
    address: Joi.object().optional().keys({
        street: Joi.string().optional(),
        city: Joi.string().optional(),
        state: Joi.string().optional(),
        country: Joi.string().optional(),
        zip: Joi.number().optional()
    }),
    value: Joi.number().required(),
    owner: Joi.array().items(Joi.object().keys({
        id: Joi.string().required(), // userId for individuals, orgId for builders or government
        stake: Joi.number().required().min(0).max(100),
        type: Joi.string().optional(), // individual, builder, government, others
        buyDate: Joi.date().optional(),
        // docs: Joi.array().items(Joi.string().optional()),
        // verified: Joi.boolean().optional().default(false)
    })).required(),
    // status: Joi.string().required().valid(["NotExist", "Pending", "Approved", "Rejected", "Sold"]),
    image: Joi.array().items(Joi.binary().required()),
    docs: Joi.array().items(Joi.binary().required()),
    admin: Joi.array().items(Joi.string()).optional(),
    // addedBy: Joi.string().required(),
    // ownedBy: Joi.string().required(),
    // saleContract: Joi.string().optional().when('status', { is : 'Sold', then: Joi.required()})
});
// enum Status { NotExist, Pending, Approved, Rejected }