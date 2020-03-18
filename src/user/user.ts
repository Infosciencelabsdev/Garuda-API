import * as Mongoose from "mongoose";
import * as Bcrypt from "bcryptjs";
import uuid = require("uuid");

export enum roles { user, builder, government, admin, superadmin }

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zip: string;
}
export interface IUser {
  userId: string;
  email: string;
  password: string;
  verified: boolean;
  phone: string;
  walletAddress: string;
  publicKey: string;
  dob: Date;
  name: string;
  roleId: string;
  role: roles;
  orgId: string;
  address: Address;
}
export interface IPassport extends Mongoose.Document, IUser {
  createdAt: Date;
  updateAt: Date;
  validatePassword(requestPassword): boolean;
}
export const AddressSchema = new Mongoose.Schema({
  street: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  country: { type: String, required: false },
  zip: { type: Number, required: false },
});
export const PassportSchema = new Mongoose.Schema(
  {
    userId: { type: String, unique: true, required: true, select: true },
    id: { type: String, unique: true, required: false },
    email: { type: String, unique: true, required: true, sparse: true },
    password: { type: String, required: true },
    verified: { type: Boolean, unique: false, required: false },
    phone: { type: String, unique: false, required: false },
    walletAddress: { type: String, unique: false, required: false },
    publicKey: { type: String, unique: false, required: false },
    dob: { type: Date, unique: false, required: false },
    name: { type: String, unique: false, required: true },
    roleId: { type: String, required: true, default: "user" },
    role: { type: roles, required: true, default: 0 },
    orgId: { type: String, required: false },
    address: {
      street: { type: String, required: false },
      city: { type: String, required: false },
      state: { type: String, required: false },
      country: { type: String, required: false },
      zip: { type: Number, required: false },
      required: false
    },
    createdAt: { type: Date, required: false },
    updatedAt: { type: Date, required: false },
    verifiedAt: { type: Date, required: false }
  },
  {
    timestamps: true
  });

export function hashPassword(password: string): string {
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

  user.id = user.userId;
  // user.password = user.password;
  user.password = hashPassword(user.password);

  return next();
});
PassportSchema.pre('findOneAndUpdate', function () {
  const password = this.getUpdate().$set.password;

  if (!password) {
    return;
  }

  this.findOneAndUpdate({}, { password: hashPassword(password) });
});
// PassportSchema.pre("update", function(next) {
//   const password = this.getUpdate().$set.password;
//   if (!password) {
//       return next();
//   }
//   try {
//       // const salt = Bcrypt.genSaltSync();
//       // const hash = Bcrypt.hashSync(password, salt);
//       this.getUpdate().$set.password = hashPassword(password);
//       next();
//   } catch (error) {
//       return next(error);
//   }
// });
// PassportSchema.pre('validate', function () {
//   const user = this;

//   if (!user.isModified('password')) {
//     return;
//   }
//   // user.password = hashPassword(user.password);
//   const password = hashPassword(user.password);
//   if (!password) {
//     return;
//   }
//   this.findOneAndUpdate({}, { password: password });
// });
export const PassportModel = Mongoose.model<IPassport>('Passportt', PassportSchema);


export async function createUserModel(payload: IPassport, wallet) {
  switch (payload.roleId) {
    case "builder":
      payload.role = 1;
      break;
    case "government":
      payload.role = 2;
      break;
    case "admin":
      payload.role = 3;
      break;
    case "superadmin":
      payload.role = 4;
      break;
    default:
      payload.role = 0;
      break;
  }
  //user, builder, government, admin, superadmin
  let passport: IUser = {
    userId: uuid.v4(),
    email: payload.email.toLowerCase(),
    walletAddress: wallet.address,
    publicKey: payload.publicKey,
    name: payload.name,
    phone: payload.phone,
    dob: payload.dob,
    password: payload.password, // setting password to test for dev
    roleId: payload.roleId ? payload.roleId : "user",
    role: payload.role,
    orgId: payload.orgId ? payload.orgId : null,
    address: payload.address ? {
      street: payload.address.street,
      city: payload.address.city,
      state: payload.address.state,
      country: payload.address.country,
      zip: payload.address.zip,
    } : null,
    verified: false
  };
  return passport;
}


export async function updateUserModel(user: IPassport, payload) {
  //user, builder, government, admin, superadmin
  let passport: any = {
    walletAddress: user.walletAddress,
    name: user.name,
    phone: payload.phone ? payload.phone : user.phone,
    dob: payload.dob ? payload.dob : user.dob,
    roleId: user.roleId,
    role: user.role,
    orgId: user.orgId ? user.orgId : undefined,
    address: payload.address ? {
      street: payload.address.street,
      city: payload.address.city,
      state: payload.address.state,
      country: payload.address.country,
      zip: payload.address.zip,
    } : user.address,
    verified: user.verified
  };
  return passport;
}