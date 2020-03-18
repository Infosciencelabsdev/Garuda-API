
import * as Mongoose from 'mongoose';
import { IPassport } from '../user/user';
import { ICipher, Wallet } from '../wallet/wallet';
import { IOrganization } from "../organization/org";
import { IFile } from '../files/file';
import { Property } from '../assets/asset';
import { EmailOtp } from '../communication/email';
import { Marketplace } from '../marketplace/marketplace';
import { IBidRequest } from '../transfer/transfer';
import { ITax } from '../gov/gov';
import { INotification } from '../notification/push';
import { ISubscribe } from '../socket/socket';
import { ITransaction } from '../transaction/trx';
import { IDocument } from '../docs/doc';
import { ICertificate, TitleCertificate } from '../certificates/certificate';
import { IContract } from '../templates/models';
import { SawkeyModel, SawkeyEventModel } from '../saw-client/model';

export interface IDatabase {
  passportModel: Mongoose.Model<IPassport>;
  emailOtpModel: Mongoose.Model<EmailOtp>;
  cipherModel: Mongoose.Model<ICipher>;
  organizationModel: Mongoose.Model<IOrganization>;
  propertyModel: Mongoose.Model<Property>;
  taxModel: Mongoose.Model<ITax>;
  marketplaceModel: Mongoose.Model<Marketplace>;
  marketplaceHistoryModel: Mongoose.Model<Marketplace>;
  buyRequestModel: Mongoose.Model<IBidRequest>;
  walletModel: Mongoose.Model<Wallet>;
  eventModel: Mongoose.Model<INotification>;
  subscribeModel: Mongoose.Model<ISubscribe>;
  transactionModel: Mongoose.Model<ITransaction>;
  documentModel: Mongoose.Model<IDocument>;
  titleCertificateModel: Mongoose.Model<TitleCertificate>;
  contractModel: Mongoose.Model<IContract>;
  requestContractModel: Mongoose.Model<IContract>;
  sawtoothModel: Mongoose.Model<SawkeyModel>;
  sawtootheventModel: Mongoose.Model<SawkeyEventModel>;
}