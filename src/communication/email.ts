import * as Mongoose from "mongoose";
import * as Bcrypt from "bcryptjs";
import { hashPassword } from "../user/user";

export interface IAuthenticator {
    authenticatorId: string;
    secret: string;
    otpauth_url: string;
    customer: string;
    user: string;
    email: string;
}//to be used for authenticator
export interface EmailOtp extends Mongoose.Document {
    email: string;
    otp: string;
    createdAt: Date;
    updateAt: Date;
    validateOtp(requestOtp): boolean;
}
export const EmailOtpSchema = new Mongoose.Schema(
    {
        email: { type: String, unique: true, required: true },
        otp: { type: String, unique: false, required: true },
    },
    {
        timestamps: true
    });

EmailOtpSchema.methods.validateOtp = function (requestOtp) {
    return Bcrypt.compareSync(requestOtp, this.otp);
};

EmailOtpSchema.pre('save', function (next) {
    const customer = this;

    if (!customer.isModified('otp')) {
        return next();
    }

    customer.otp = hashPassword(customer.otp);

    return next();
});

EmailOtpSchema.pre('findOneAndUpdate', function () {
    const otp = hashPassword(this.getUpdate().$set.otp);

    if (!otp) {
        return;
    }

    this.findOneAndUpdate({}, { otp: otp });
});
export const EmailOtpModel = Mongoose.model<EmailOtp>('EmailOtpt', EmailOtpSchema);