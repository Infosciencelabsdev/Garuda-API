import * as Mongoose from "mongoose";
import * as Bcrypt from "bcryptjs";

import { hashPassword } from "../user/user";
export interface Cipher extends Mongoose.Document {
    version: number;
    address: string;
    crypto: {
        ciphertext: string;
        cipherparams: {
            iv: string;
        };
        cipher: string;
        kdf: string;
        kdfparams: {
            dklen: number;
            salt: string;
            n: number;
            r: number;
            p: number;
        };
        mac: string;
    };
}
export interface ICipher extends Mongoose.Document, Cipher {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    address: string;
    sawtooth: string;
    email: string;
    password: string;
    validatePassword(requestPassword): boolean;
}
export const CipherSchema = new Mongoose.Schema(
    {
        id: { type: String, unique: true, required: true },
        version: { type: Number, unique: false, required: true },
        address: { type: String, unique: false, required: true },
        sawtooth: { type: String, unique: false, required: false },
        email: { type: String, unique: true, required: true, default: 'r@cognier.in' },
        crypto: {
            ciphertext: { type: String, unique: false, required: true },
            cipherparams: {
                iv: { type: String, unique: false, required: true },
            },
            cipher: { type: String, unique: false, required: true },
            kdf: { type: String, unique: false, required: true },
            kdfparams: {
                dklen: { type: Number, unique: false, required: true },
                salt: { type: String, unique: false, required: true },
                n: { type: Number, unique: false, required: true },
                r: { type: Number, unique: false, required: true },
                p: { type: Number, unique: false, required: true },
            },
            mac: { type: String, unique: false, required: true },
        }
    },
    {
        timestamps: true,
        strict: false
    });

CipherSchema.methods.validatePassword = function (requestPassword) {
    return Bcrypt.compareSync(requestPassword, this.password);
};

CipherSchema.pre('save', function (next) {
    const user = this;

    if (!user.isModified('password')) {
        return next();
    }

    user.id = user.userId;
    // user.password = user.password;
    user.password = hashPassword(user.password);

    return next();
});

CipherSchema.pre('findOneAndUpdate', function () {
    const password = this.getUpdate().$set.password;

    if (!password) {
        return;
    }

    this.findOneAndUpdate({}, { password: password });
});
export const CipherModel = Mongoose.model<ICipher>('keysipher', CipherSchema);

export interface IWallet {
    walletId: string;
    userId: string;
    currency: Currency[];
    // currencyType: string;
    // valueINR?: string;
    // balance: number;
}
interface Currency {
    currencyType: string;
    valueINR?: string;
    balance: number;
    address?: string;
}
export const CurrencySchema = new Mongoose.Schema(
    {
        currencyType: { type: String, required: true },
        valueINR: { type: String, required: false },
        balance: { type: Number, required: true },
        address: { type: String, required: false },
    }
);
export interface IWalletHistory {
    transactionId: string;
    userId: string;
    transactionType: transactionType;
    date: string;
    amount: number;
    asset: string;
    status: string;
    confirmed: boolean;
}
enum transactionType {
    Withdraw = "Withdraw",
    Deposit = "Deposit",
    Buy = "Buy",
    Subscription = "Subscription",
    Maintanence = "Maintanence",
    Booking = "Booking",
    Rent = "Rent",
    Others = "Others"
}
export interface Wallet extends Mongoose.Document, IWallet {
}
export const WalletSchema = new Mongoose.Schema(
    {
        walletId: { type: String, unique: true, required: true },
        userId: { type: String, unique: true, required: false },
        currency: { type: [CurrencySchema], unique: false, required: false },
    },
    {
        timestamps: true
    });
export const WalletModel = Mongoose.model<Wallet>('user_allet', WalletSchema);