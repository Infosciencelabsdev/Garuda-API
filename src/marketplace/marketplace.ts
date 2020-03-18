import { Address } from '../user/user';
import * as Mongoose from "mongoose";
import * as Bcrypt from "bcryptjs";
import { IProperty } from '../assets/asset';
import { Status as PropertyStatus } from '../assets/asset';

export interface IMarketplace {
    propertyId: string;
    hash: string;
    name: string;
    propertyType: string;
    description: string;
    area: number;
    location: number[];
    value: number;
    transaction?: string;
    image: string[];
    listingDate: Date;
    listedBy: string;
    listingType: ListingType;
    ownedBy: string[];
    address: Address;
    status: PropertyStatus;
    maintanence?: number;
    isActive?: boolean;
}
enum ListingType { Rent, Sell }
// export enum Status { NotExist, Listed, Tender, Rent, Sold, Unlisted } use property status

export interface Marketplace extends Mongoose.Document, IMarketplace {
    id: string;
}
export const MarketplaceSchema = new Mongoose.Schema(
    {
        id: { type: String, unique: true, required: true, select: false },
        propertyId: { type: String, unique: true, required: true },
        hash: { type: String, unique: true, required: true},
        name: { type: String, unique: true, required: true },
        description: { type: String, unique: false, required: false },
        area: { type: Number, unique: false, required: true },
        location: { type: [Number], required: true },
        value: { type: Number, required: true },
        transaction: { type: String, required: true },
        image: { type: [String], required: false },
        listedBy: { type: String, required: true },
        listingType: { type: ListingType, required: true },
        listingDate: { type: Date, required: true },
        ownedBy: { type: [String], required: true },
        status: { type: PropertyStatus, required: true, default: 2 },
        isActive: { type: Boolean, required: false, default: true },
        propertyType: { type: String, unique: false, required: false },
        address: {
            street: { type: String, required: false },
            city: { type: String, required: false },
            state: { type: String, required: false },
            country: { type: String, required: false },
            zip: { type: Number, required: false },
            required: false
        }
    },
    {
        timestamps: true
    });
MarketplaceSchema.pre('validate', function (next) {
    const self = this;

    console.log(" id is", self.propertyId);

    self.id = self.propertyId;

    console.log(self.id);
    return next();
});
export const MarketplaceModel = Mongoose.model<Marketplace>('Marketplace', MarketplaceSchema);
export const MarketplaceHistoryModel = Mongoose.model<Marketplace>('Marketplace_history', MarketplaceSchema);

export function marketplaceModel(payload, property: IProperty, identity) {
    let Marketplace: IMarketplace = {
        propertyId: property.propertyId,
        hash: property.hash,
        name: property.name,
        propertyType: property.propertyType,
        description: property.description,
        area: property.area,
        location: property.location,
        value: payload.value,
        transaction: property.transaction,
        image: property.image,
        listingDate: new Date(),
        listingType: payload.listingType,
        listedBy: identity,
        address: property.address,
        status: PropertyStatus.Listed,
        ownedBy: property.ownedBy,
        isActive: true
    };
    // console.log(payload.propertyId);
    // Marketplace.id = payload.propertyId;
    // Marketplace.propertyId = property.propertyId;
    // Marketplace.hash = property.hash;
    // Marketplace.name = property.name;
    // Marketplace.description = property.description;
    // Marketplace.propertyId = property.propertyId;
    // Marketplace.area = property.area;
    // Marketplace.location = property.location;
    // Marketplace.value = payload.value;
    // Marketplace.image = payload.image;
    // Marketplace.listingDate = new Date();
    // Marketplace.listingType = payload.listingType;
    // Marketplace.listedBy = identity;
    // Marketplace.address = property.address;
    // Marketplace.status = Status.Listed;
    // Marketplace.ownedBy = property.ownedBy;
    return Marketplace;
}

// export interface BidRequest {
//     propertyId: string;
//     marketplaceId: string;
//     value:  number;
//     tax:  number;
//     amount:  number;
//     seller:  [string];
//     buyer:  [string];
//     status:  ListingStatus;
// }

// enum ListingStatus { ""}
// export interface IBidRequest extends Mongoose.Document, BidRequest {
//     id: string;
// }
// export const BidSchema = new Mongoose.Schema(
//     {
//         id: { type: String, unique: true, required: true},
//         propertyId: { type: String, unique: false, required: true },
//         marketplaceId: { type: String, unique: false, required: true },
//         value: { type: Number, required: true },
//         tax: { type: Number, required: true },
//         amount: { type: Number, required: true },
//         seller: { type: [String], required: true },
//         buyer: { type: [String], required: true },
//         status: { type: String, required: true },
//     },
//     {
//         timestamps: true
//     });
// export const BidModel = Mongoose.model<IBidRequest>('Bid_T', BidSchema);
// export function requestModel(payload, property: IProperty, identity) {
//     let request: BidRequest = {
//         propertyId: property.propertyId,

//         value: payload.value,

//     };
//     console.log(payload.propertyId);
//     return request;
// }