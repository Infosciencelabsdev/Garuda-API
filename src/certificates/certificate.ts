import * as Mongoose from "mongoose";
// import uuid = require("uuid");
// import { DocumentModel } from "../docs/doc";
import { IProperty } from "../assets/asset";
import { IUser } from "../user/user";
export enum revokeType {
    Buy = "Buy",
    Sell = "Sell",
    Transfer = "Transfer",
    Dispute = "Dispute",
    Others = "Others",
}
export interface Certificate {
    name: string;
    publicKey: string;
    userId: string;
    propertyName: string;
    stake: number;
    hash: string;
    docId?: string;
    url?: string;
    date: Date;
    contractAddress?: string;
    transactionHash?: string;
    revoke?: boolean;
    revoketype?: revokeType;
    revokeDate?: Date;
    message?: string;
}
export function certificateModel(property: IProperty, owner: IUser, filename, transactionHash?, url?) {
    let certificate: Certificate = {
        name: owner.name,
        publicKey: owner.walletAddress ? owner.walletAddress : undefined,
        userId: owner.userId ? owner.userId : undefined,
        stake: property.owner[0].stake ? property.owner[0].stake : 100,
        propertyName: property.name,
        docId: filename,
        url: url ? url : undefined,
        hash: transactionHash ? transactionHash : undefined,
        date: new Date(),
        transactionHash: transactionHash ? transactionHash : undefined
        // contractAddress: payload.contractAddress
    };
    return certificate;
}
export interface ICertificate extends Mongoose.Document, Certificate {
    id: string;
}
export const CertificateSchema = new Mongoose.Schema(
    {
        name: { type: String, unique: false, required: true },
        publicKey: { type: String, unique: false, required: true },
        userId: { type: String, unique: false, required: true },
        hash: { type: String, unique: false, required: false },
        stake: { type: String, unique: false, required: true },
        date: { type: Date, unique: false, required: true },
        docId: { type: String, unique: false, required: false },
        url: { type: String, unique: false, required: false },
        revoke: { type: Boolean, unique: false, required: false },
        revokeType: { type: revokeType, unique: false, required: false },
        revokeDate: { type: Date, unique: false, required: false },
        message: { type: String, unique: false, required: false },
    });
export interface TitleCertificate extends Mongoose.Document {
    id: string;
    propertyId: string;
    propertyName: string;
    hash: string;
    certificate?: [Certificate];
}
export const TitleSchema = new Mongoose.Schema(
    {
        id: { type: String, unique: true, required: true, sparse: true },
        propertyId: { type: String, unique: true, required: true },
        propertyName: { type: String, unique: false, required: true },
        hash: { type: String, unique: false, required: false },
        certificate: { type: [CertificateSchema], unique: false, required: true },
    },
    {
        timestamps: true
    });
export const TitleCertificateModel = Mongoose.model<TitleCertificate>('Certs_T', TitleSchema);
export const RevokeCertificateModel = Mongoose.model<RevokedCertificate>('Certs_T', TitleSchema);

export interface RevokedCertificate extends Mongoose.Document, Certificate {
    revokeKey: string;
    type: revokeType;
    revokeDate: Date;
    message: string;
}
export const RevokeSchema = new Mongoose.Schema(
    {
        name: { type: String, unique: false, required: true },
        hash: { type: String, unique: false, required: false },
        stake: { type: String, unique: false, required: true },
        date: { type: Date, unique: false, required: true },
        docId: { type: String, unique: false, required: false },
        url: { type: String, unique: false, required: false },
        revokeKey: { type: String, unique: false, required: true },
        type: { type: revokeType, unique: false, required: false },
        message: { type: String, unique: false, required: false },
        revokeDate: { type: Date, unique: false, required: true },
    });