import * as Mongoose from "mongoose";
export interface Asset {
    // assetId: string;
    hash: string;
    type: string;
    transactions: string[];
    certificates: string[];
    contracts: string[];
    previousCertificates?: string[];
    previousContracts?: string[];
}
// Property model for explorer
export interface EProperty extends Asset {
    owner: string[]; // for properties
    previousOwners?: string[]; // for properties
}
// User model for explorer
export interface EUser extends Asset {
    assets: string[];
    soldAssets?: string[];
}
// Contract model for explorer
export interface EContract {
    contractId: string;
    hash: string;
    type: string;
    asset: string;
    from: string[];
    to: string[];
    date: Date;
}
export interface ECertificate {
    certificateId: string;
    hash: string;
    type: string;
    asset: string;
    owner: string;
    stake: number;
    sold: boolean;
}
export enum revokeType {
    Buy = "Buy",
    Sell = "Sell",
    Transfer = "Transfer",
    Dispute = "Dispute",
    Others = "Others",
}
export interface ICertificate {
    owner: string;
    propertyHash: string;
    stake: number;
    date: Date;
    contractAddress?: string;
    transactionHash?: string;
    revoke?: boolean;
    revokeType?: revokeType;
    revokeDate?: Date;
    to?: string;
    message?: string;
}
export interface Certificate extends Mongoose.Document, ICertificate {
}
// export function certificateModel(property: IProperty, owner: IUser, transactionHash?) {
//     let certificate: ICertificate = {
//         owner: owner.walletAddress,
//         propertyHash: property.hash,
//         stake: property.owner[0].stake ? property.owner[0].stake : 100,
//         date: new Date(),
//         transactionHash: transactionHash ? transactionHash : undefined,
//     };
//     return certificate;
// }
export function revokeCertificateModel(certificate: Certificate, revokeType, message, to?) {
    certificate.revoke = true;
    certificate.revokeDate = new Date();
    certificate.revokeType = revokeType;
    if (to) {
        certificate.to = to;
    }
    certificate.message = message;
    return certificate;
}
// export interface ICertificate extends Mongoose.Document, Certificate {
//     id: string;
// }
export const CertificateSchema = new Mongoose.Schema(
    {
        owner: { type: String, unique: false, required: true },
        propertyHash: { type: String, unique: false, required: true },
        stake: { type: String, unique: false, required: true },
        date: { type: Date, unique: false, required: true },
        revoke: { type: Boolean, unique: false, required: false },
        revokeType: { type: revokeType, unique: false, required: false },
        revokeDate: { type: Date, unique: false, required: false },
        message: { type: String, unique: false, required: false },
        contractAddress: { type: String, unique: false, required: false },
        transactionHash: { type: String, unique: false, required: false },
        to: { type: String, unique: false, required: false }
    });

export interface Property extends Mongoose.Document, EProperty {
}
export const PropertySchema = new Mongoose.Schema(
    {
        hash: { type: String, unique: false, required: true },
        type: { type: String, unique: false, required: false },
        owner: { type: [String], unique: false, required: true },
        certificates: { type: [String], unique: false, required: true },
        contracts: { type: [String], unique: false, required: true },
        transactions: { type: [String], unique: false, required: true },
    },
    {
        timestamps: true
    });
export const ExplorerCertificateModel = Mongoose.model<Certificate>('explorer_certs', CertificateSchema);

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