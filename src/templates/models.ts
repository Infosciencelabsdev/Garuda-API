import { Address, IUser, roles, AddressSchema } from "../user/user";
import { IProperty } from "../assets/asset";
import { IMarketplace } from "../marketplace/marketplace";
import * as Mongoose from "mongoose";
export interface TransferContract {
    contractId: string;
    propertyId: string;
    buyer: {
        userId: string;
        name: string;
        address: Address;
        eth: string;
        isbuilder: boolean;
    };
    seller: {
        userId: string;
        name: string;
        address: Address;
        eth: string;
        isbuilder: boolean;
    };
    property: {
        name: string;
        address: Address;
        identification_number?: number;
    };
    price_details: {
        price: number;
        tax_paid: number;
        amount_paid: number;
        conditions?: string;
    };
    docId: string;
    url: string;
    notary: boolean;
    stampDuty: boolean;
    registered: boolean;
    verified: boolean;
    title?: boolean;
    sold?: boolean;
    sellContract?: string;
    hash?: string;
    signedBy: string[];
    verifiedBy?: string;
}

export function buyContractModel(property: IProperty, marketplace: IMarketplace, buyer: IUser, seller: IUser, payload) {
    let buyerIsBuilder = false;
    let sellerIsBuilder = false;
    if (buyer.role === roles.builder) {
        buyerIsBuilder = true;
    }
    if (seller.role === roles.builder) {
        sellerIsBuilder = true;
    }
    let transferContract: any = {
        id: payload.id,
        contractId: payload.id,
        propertyId: property.propertyId,
        buyer: {
            userId: buyer.userId,
            name: buyer.name,
            address: {
                street: buyer.address.street,
                city: buyer.address.city,
                state: buyer.address.state,
                country: buyer.address.country,
                zip: buyer.address.zip
            },
            // eth: buyer.walletAddress,
            isbuilder: buyerIsBuilder,
        },
        seller: {
            userId: seller.userId,
            name: seller.name,
            address: {
                street: seller.address.street,
                city: seller.address.city,
                state: seller.address.state,
                country: seller.address.country,
                zip: seller.address.zip
            },
            // eth: seller.walletAddress,
            isbuilder: sellerIsBuilder,
        },
        property: {
            name: property.name,
            address: property.address,
        },
        price_details: {
            price: marketplace.value,
            tax_paid: payload.tax,
            amount_paid: payload.amount,
        },
        docId: payload.filename,
        url: payload.url ? payload.url : undefined,
        notary: payload.notary,
        stampDuty: payload.stampDuty,
        registered: payload.registered,
        verified: payload.verified,
        sold: false,
        title: true,
        // signedBy: [seller.walletAddress, buyer.walletAddress],
        // verifiedBy:
        // sellContract:
    };
    return transferContract;
}

export interface IContract extends Mongoose.Document, TransferContract {
}
export const UserSchema = new Mongoose.Schema(
    {
        userId: { type: String, unique: false, required: false },
        name: { type: String, unique: false, required: true },
        address: { type: AddressSchema, unique: false, required: true },
        // eth: { type: String, unique: false, required: true },
        isbuilder: { type: Boolean, unique: false, required: true },
    });
export const PropertySchema = new Mongoose.Schema(
    {
        name: { type: String, unique: false, required: true },
        address: { type: AddressSchema, unique: false, required: true }
    });
export const PriceSchema = new Mongoose.Schema(
    {
        price: { type: Number, unique: false, required: true },
        tax_paid: { type: Number, unique: false, required: true },
        amount_paid: { type: Number, unique: false, required: true },
    });
export const ContractSchema = new Mongoose.Schema(
    {
        id: { type: String, unique: true, required: true, sparse: true },
        propertyId: { type: String, unique: false, required: true },
        property: { type: PropertySchema, unique: false, required: true },
        buyer: { type: [UserSchema], unique: false, required: true },
        seller: { type: [UserSchema], unique: false, required: true },
        price_details: { type: PriceSchema, unique: false, required: true },
        docId: { type: String, unique: false, required: false },
        url: { type: String, unique: false, required: false },
        verified: { type: Boolean, unique: false, required: false, default: true },
        sold: { type: Boolean, unique: false, required: false },
        title: { type: Boolean, unique: false, required: true },
        hash:  { type: String, unique: false, required: false },
        sellContract: { type: String, unique: false, required: false },
    },
    {
        timestamps: true
    });
export const ContractModel = Mongoose.model<IContract>('Contrac_T', ContractSchema);
export const ContractRequestModel = Mongoose.model<IContract>('ContractRequest', ContractSchema);
