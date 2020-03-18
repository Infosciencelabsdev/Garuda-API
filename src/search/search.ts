import * as Mongoose from "mongoose";
import * as Bcrypt from "bcryptjs";

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zip: string;
}

export interface IPassport extends Mongoose.Document {
  id: string;
  email: string;
  password: string;
  verified: boolean;
  phone: string;
  walletAddress: string;
  dob: Date;
  username: string;
  name: string;
  roleId: string;
  orgId: string;
  address: Address;
  createdAt: Date;
  updateAt: Date;
  validatePassword(requestPassword): boolean;
}

export const PassportSchema = new Mongoose.Schema(
  {
    id: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true, sparse: true },
    password: { type: String, required: true },
    verified: { type: Boolean, unique: false, required: false },
    phone: { type: String, unique: false, required: false },
    walletAddress: { type: String, unique: true, required: false },
    dob: { type: Date, unique: false, required: false },
    name: { type: String, unique: false, required: true },
    roleId: { type: String, required: false },
    orgId: { type: String, required: false },
    address: {
      street: { type: String, required: false },
      city: { type: String, required: false },
      state: { type: String, required: false },
      country: { type: String, required: false },
      zip: { type: Number, required: false   },
      required: false
    },
    createdAt: { type: Date, required: false },
    updatedAt: { type: Date, required: false },
    verifiedAt: { type: Date, required: false }
  },
  {
    timestamps: true
  });

function hashPassword(password: string): string {
  if (!password) {
    return null;
  }
  // return password; //temp script only
  return Bcrypt.hashSync(password, Bcrypt.genSaltSync(10));
}

PassportSchema.methods.validatePassword = function (requestPassword) {
  return Bcrypt.compareSync(requestPassword, this.password);
};

PassportSchema.pre('save', function (next) {
  const user = this;

  if (!user.isModified('password')) {
    return next();
  }

  // user.password = user.password;
  user.password = hashPassword(user.password);

  return next();
});

PassportSchema.pre('findOneAndUpdate', function () {
  const password = this.getUpdate().$set.password;

  if (!password) {
    return;
  }

  this.findOneAndUpdate({}, { password: password });
});
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
export const PassportModel = Mongoose.model<IPassport>('Passportt', PassportSchema);

export const EmailOtpModel = Mongoose.model<EmailOtp>('EmailOtpt', EmailOtpSchema);
