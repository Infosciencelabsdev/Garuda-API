import * as Mongoose from "mongoose";

export interface IPrivateKey {
    userId: string;
    email: string;
    privateKey: any;
    publicKey: any;
    encrypted: boolean;
    signer: any;
}
export interface SawkeyModel extends Mongoose.Document, IPrivateKey {
}
var noSchema = new Mongoose.Schema({}, { strict: false });

export const KeySchema = new Mongoose.Schema(
    {
        userId: {type: String, unique: true, required: true},
        email: {type: String, unique: true, required: true},
        privateKey: {type: String, required: true},
        publicKey: {type: noSchema, unique: true, required: false},
        encrypted: {type: Boolean, required: true, default: false},
        signer: {type: noSchema, unique: true, required: false},

    },
    {
        timestamps: true
    });
export const sawkeyModel = Mongoose.model<SawkeyModel>('SawKey', KeySchema);

export interface SawkeyEventModel extends Mongoose.Document {
}
export const sawtoothEventModel = Mongoose.model<SawkeyEventModel>('SawKeyEvent', noSchema);