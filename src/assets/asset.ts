import { Address } from '../user/user';
import * as Mongoose from "mongoose";
import * as Bcrypt from "bcryptjs";
const crypto = require("crypto");

export interface IProperty {
    propertyId: string;
    propId: string;
    hash: string;
    publicKey?: string;
    name: string;
    description: string;
    propertyType: string;
    area: number;
    location: number[];
    address: Address;
    value: number;
    owner: Owner[];
    previousOwners?: Owner[];
    status: Status; //
    image: string[];
    docs: string[];
    admin: string[];
    addedBy: string;
    ownedBy: string[];
    verified: boolean;
    message?: string;
    isActive: boolean;
    transaction?: string;
    contract?: string[];
}

// export enum Status { Unsaved = "Unsaved", Pending = "Pending", Approved = "Approved", Rejected  = "Rejected",
// Listed = "Listed", Sold = "Sold", Unlisted = "Unlisted"}
export enum Status { Unsaved, Pending, Approved, Rejected, Listed, Sold, Delisted }
let st = Status.Approved;
export interface Owner {
    id: string;
    type: string;
    stake: number;
    buyDate: Date;
    docs: string[];
    verified: boolean;
    bought: boolean;
    sold: boolean;
    contract?: string;
    title: boolean;
    sellDate?: Date;
}
export interface Property extends Mongoose.Document, IProperty {
    //   [x: string]: string[];
    property: string[];
    id: string;
}
export const OwnerSchema = new Mongoose.Schema({
    id: { type: String, unique: false, required: true },
    type: { type: String, required: true },
    stake: { type: String, required: true },
    buyDate: { type: Date, required: true },
    docs: { type: [String], required: false, select: false },
    verified: { type: Boolean, required: false, select: false },
    bought: { type: Boolean, required: false},
    sold: { type: Boolean, required: false, default: false},
    contract: { type: String, required: false},
    sellDate: { type: Date, required: false},
    title: { type: Boolean, required: false},
});
export const PropertySchema = new Mongoose.Schema(
    {
        propertyId: { type: String, unique: true, required: true },
        id: { type: String, unique: true, required: true, select: false },
        propId: { type: String, unique: true },
        hash: { type: String, unique: true, required: true },
        publicKey: { type: String, unique: false, required: true, select: false },
        name: { type: String, unique: true, required: true },
        description: { type: String, unique: false, required: false },
        area: { type: Number, unique: false, required: true },
        location: { type: [Number], required: true },
        value: { type: Number, required: true, default: 5000 },
        owner: { type: [OwnerSchema], required: true },
        previousOwners: { type: [OwnerSchema], required: false },
        status: { type: String, required: true },
        image: { type: [String], required: false },
        docs: { type: [String], required: false },
        addedBy: { type: String, required: true },
        ownedBy: { type: [String], required: true },
        admin: { type: [String], required: false },
        transaction: { type: String, required: false },
        permissioned: { type: String, required: false, select: false, unique: true, sparse: true },
        propertyType: { type: String, unique: false, required: true },
        address: {
            street: { type: String, required: false },
            city: { type: String, required: false },
            state: { type: String, required: false },
            country: { type: String, required: false },
            zip: { type: Number, required: false },
            required: false
        },
        message: { type: String, required: false, select: false },
        verified: { type: Boolean, required: true, select: false },
        verifiedAt: { type: Date, required: false, select: false },
        isActive: { type: Boolean, required: true, default: false },
    },
    {
        timestamps: true
    });
PropertySchema.pre('validate', function (next) {
    const self = this;

    // console.log(" id is", self.propertyId);

    self.id = self.propertyId;
    self.hash = "c4f834".concat(crypto.createHash('sha512').update(self.propertyId).digest('hex').toLowerCase().substring(0, 64));

    // console.log(self.id);
    return next();
});
export const PropertyModel = Mongoose.model<Property>('Property_s', PropertySchema);

export function hash(x) {
    return crypto.createHash('sha512').update(x).digest('hex').toLowerCase().substring(0, 64);
}