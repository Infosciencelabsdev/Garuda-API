import * as Mongoose from "mongoose";
import { IDataConfiguration } from "../configurations/index";
import { IPassport, PassportModel } from "../user/user";
import { LoggerInstance } from 'winston';
import { IDatabase } from './database';
import { CipherModel, ICipher, Wallet, WalletModel } from "../wallet/wallet";
import { IOrganization, OrganizationModel } from "../organization/org";
import { IFile, FileModel } from "../files/file";
import * as rethink from 'rethinkdb';
import { Property, PropertyModel } from "../assets/asset";
import { EmailOtp, EmailOtpModel } from "../communication/email";
import { MarketplaceModel, MarketplaceHistoryModel, Marketplace} from "../marketplace/marketplace";
import { BidModel, IBidRequest } from "../transfer/transfer";
import { ITax, TaxModel } from "../gov/gov";
import { INotification, NotificationModel } from "../notification/push";
import { ISubscribe, subscribeModel } from "../socket/socket";
import { ITransaction, TransactionModel } from "../transaction/trx";
import { IDocument, DocumentModel } from "../docs/doc";
import { TitleCertificateModel, TitleCertificate } from "../certificates/certificate";
import { IContract, ContractModel, ContractRequestModel } from "../templates/models";
import { SawkeyModel, sawkeyModel, SawkeyEventModel, sawtoothEventModel } from "../saw-client/model";

export class MongoDatabase implements IDatabase {

  passportModel: Mongoose.Model<IPassport> = PassportModel;
  emailOtpModel: Mongoose.Model<EmailOtp> = EmailOtpModel;
  cipherModel: Mongoose.Model<ICipher> = CipherModel;
  organizationModel: Mongoose.Model<IOrganization> = OrganizationModel;
  propertyModel: Mongoose.Model<Property> = PropertyModel;
  taxModel: Mongoose.Model<ITax> = TaxModel;
  marketplaceModel: Mongoose.Model<Marketplace> = MarketplaceModel;
  marketplaceHistoryModel: Mongoose.Model<Marketplace> = MarketplaceHistoryModel;
  buyRequestModel: Mongoose.Model<IBidRequest> = BidModel;
  walletModel: Mongoose.Model<Wallet> = WalletModel;
  eventModel: Mongoose.Model<INotification> = NotificationModel;
  subscribeModel: Mongoose.Model<ISubscribe> = subscribeModel;
  transactionModel: Mongoose.Model<ITransaction> = TransactionModel;
  documentModel: Mongoose.Model<IDocument> = DocumentModel;
  titleCertificateModel: Mongoose.Model<TitleCertificate> = TitleCertificateModel;
  contractModel: Mongoose.Model<IContract> = ContractModel;
  requestContractModel: Mongoose.Model<IContract> = ContractRequestModel;
  sawtoothModel: Mongoose.Model<SawkeyModel> = sawkeyModel;
  sawtootheventModel: Mongoose.Model<SawkeyEventModel> = sawtoothEventModel;


  /**
   * Constructor
   * @param {IDataConfiguration} config
   * @param {winston.LoggerInstance} logger
   */
  constructor(private config: IDataConfiguration, private logger: LoggerInstance) {
  }

  /**
   * Connect to mongo database
   * @returns {Promise<void>}
   */
  private async connectMongo() {
    (<any>Mongoose).Promise = Promise;
    let mongoDb = Mongoose.connection;
    // let mongoUrl = process.env.MONGO_URL || this.config.connectionString;
    let mongoUrl = this.config.authConnectionString;
    // mongoDb.authenticate();
    mongoDb.once('open', () => {
      this.logger.info(`Connected to database: ${mongoUrl}`);
    });

    mongoDb.on('error', () => {
      this.logger.info(`Unable to connect to database: ${mongoUrl}`);
    });
    var options = {
      user: this.config.username,
      pass: this.config.password,
      useMongoClient: true
    };

    let retries = 0;
    while (retries++ < 5) {
      try {
        await Mongoose.connect(mongoUrl, options);
        break;
      } catch (err) {
        this.logger.info(`Retry to connect to database: ${mongoUrl} (${retries})`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  /**
   * Connect to Rethink database
   * @returns {Promise<void>}
   */
  private async connectRethink() {
  }
  /**
   * Initialize
   * @returns {Promise<void>}
   */
  async initialize() {
    this.connectMongo();
  }
}