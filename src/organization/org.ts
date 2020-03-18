import * as Mongoose from "mongoose";
import * as Bcrypt from "bcryptjs";
import { Address } from "../user/user";
export interface Organization {
  orgId: string;
  email: string;
  password: string;
  phone: string;
  name: string;
  gst: string;
  address: Address;
  walletAddress: string;
  admin: string[];
}
export interface IOrganization extends Organization, Mongoose.Document {
  id: string;
  createdAt: Date;
  updateAt: Date;
  validatePassword(requestPassword): boolean;
}

export const OrganizationSchema = new Mongoose.Schema(
  {
    orgId: { type: String, unique: true, required: true },
    id: { type: String, unique: true, required: false },
    email: { type: String, unique: true, required: true },
    name: { type: String, unique: false, required: true },
    phone: { type: String, unique: false, required: true },
    gst: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    admin: { type: [String], required: false },
    walletAddress: { type: String, unique: true, required: false },
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

function hashPassword(password: string): string {
  if (!password) {
    return null;
  }
  // return password; //temp script only
  return Bcrypt.hashSync(password, Bcrypt.genSaltSync(10));
}

OrganizationSchema.methods.validatePassword = function (requestPassword) {
  return Bcrypt.compareSync(requestPassword, this.password);
};

OrganizationSchema.pre('save', function (next) {
  const user = this;
  user.id = user.orgId;

  if (!user.isModified('password')) {
    return next();
  }
  // user.password = user.password;
  user.password = hashPassword(user.password);

  return next();
});

OrganizationSchema.pre('findOneAndUpdate', function () {
  const password = this.getUpdate().$set.password;

  if (!password) {
    return;
  }

  this.findOneAndUpdate({}, { password: password });
});
export const OrganizationModel = Mongoose.model<IOrganization>('Organization_t', OrganizationSchema);