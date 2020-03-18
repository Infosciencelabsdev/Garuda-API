import * as Mongoose from "mongoose";

export interface IModel {
}
enum ListingType { Rent, Sell }
export enum Status { NotExist, Listed, Tender, Rent, Sold, Unlisted }

export interface Model extends Mongoose.Document, IModel {
    id: string;
}
export const Schema = new Mongoose.Schema(
    {
    },
    {
        timestamps: true
    });
Schema.pre('validate', function (next) {
    const self = this;
    self.id = self.propertyId;
    return next();
});
export const Model = Mongoose.model<Model>('Table', Schema);

export function initModel(payload, identity) {
    let Marketplace: IModel = {
    };
    return Marketplace;
}

export interface BidRequest {
    propertyId: string;
    propertyName?: string;
    marketplaceId: string;
    value:  number;
    tax:  number;
    percent:  number;
    amount:  number;
    seller:  [string];
    buyer:  [string];
    contractHash?: string;
    transferDoc?: string; // verify, view
    notary: boolean;
    stampDuty: boolean;
    registered: boolean;
    titleId?: string;
    status: ListingStatus;
    isActive?: boolean;
    // sellerSign: string;
    // buyerSign: string;
}
export enum ListingStatus { Requested = "Requested", Notarized= "Notarized", Registered = "Registered", Completed = "Completed", Rejected = "Rejected"}
export interface IBidRequest extends Mongoose.Document, BidRequest {
    id: string;
}
export const BidSchema = new Mongoose.Schema(
    {
        id: { type: String, unique: true, required: true},
        propertyId: { type: String, unique: false, required: true },
        propertyName: { type: String, unique: false, required: false },
        marketplaceId: { type: String, unique: false, required: true },
        value: { type: Number, required: true },
        percent: { type: Number, required: true },
        tax: { type: Number, required: true },
        amount: { type: Number, required: true },
        seller: { type: [String], required: true },
        buyer: { type: [String], required: true },
        contractHash: { type: String, required: false },
        transferDoc: { type: String, required: false },
        notary: { type: Boolean, required: false },
        stampDuty: { type: Boolean, required: false },
        registered: { type: Boolean, required: false },
        titleId: { type: String, required: false },
        status: { type: ListingStatus, required: false, default: ListingStatus.Requested },
        isActive: { type: Boolean, required: false, default: true },
        // sellerSign: { type: String, required: false },
        // buyerSign: { type: String, required: false },
    },
    {
        timestamps: true
    });
export const BidModel = Mongoose.model<IBidRequest>('Bid_T', BidSchema);
// export function requestModel(payload, property: IProperty, identity) {
//     let request: BidRequest = {
//         propertyId: property.propertyId,

//         value: payload.value,

//     };
//     console.log(payload.propertyId);
//     return request;
// }