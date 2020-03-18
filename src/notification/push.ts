import * as Mongoose from "mongoose";
import * as Bcrypt from "bcryptjs";
import { EventEmitter } from "events";
import uuid = require("uuid");

export interface UserNotification {
  userId?: string;
  email: string;
  read: boolean;
}
export interface INotification extends Mongoose.Document {
  id: string;
  UserNotification: [UserNotification];
  title: string;
  message: string;
  icon?: string;
  url?: string;
  event: eventType;
}
export const UserNotification = new Mongoose.Schema({
  userId: { type: String, required: false, sparse: true },
  email: { type: String, required: false, sparse: true },
  read: { type: Boolean, required: true, sparse: true },
});
export const NotificationSchema = new Mongoose.Schema(
  {
    id: { type: String, unique: true, required: true },
    UserNotification: { type: [UserNotification], required: true, sparse: true },
    title: { type: String, required: true },
    url: { type: String, required: false },
    message: { type: String, required: false },
    icon: { type: String, required: false },
  },
  {
    timestamps: true
  });
NotificationSchema.pre('validate', function (next) {
  const notification = this;
  if (!notification.id) {
    notification.id = uuid.v4();
  }
  return next();
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
export const NotificationModel = Mongoose.model<INotification>('Events_te', NotificationSchema);

export enum eventType {
  create_property = "create_property",
  confirm_property = "confirm_property",
  list_property = "list_property",
  buy_property = "buy_property",
  confirm_buy = "confirm_buy",
  reject_buy = "reject_buy",
}

export let events = {
  create_property: {
    title: "Property has been created.",
    message: "This can be tracked by transaction:"
  },
  confirm_property: {
    title: "Property has been confirmed.",
    message: ""
  },
  list_property: {
    title: "Property has been listed to marketplace",
    message: ""
  },
  buy_property: {
    title: "Buy request has been placed for proeprty",
    message: ""
  },
  confirm_buy: {
    title: "Transfer completed",
    message: ""
  },
  reject_buy: {
    title: "Transfer request as been rejected",
    message: ""
  },
};

export let urls = {
  government: {
    listingById: "government/property/manage/",
    transferById: "government/propertyconfirm/",
  },
  admin: {
    propertyById: "admin/property/view/",
    transferById: "admin/propertyconfirm/",
    listingById: "admin/marketplace/viewproperty/",
    boughtPropertyById: "",
    soldPropertyById: "admin/sales/",
  },
  user: {
    propertyById: "user/property/view/",
    listingById: "user/marketplace/viewproperty/",
    boughtPropertyById: "",
    soldPropertyById: "user/sales/",
  }
};

