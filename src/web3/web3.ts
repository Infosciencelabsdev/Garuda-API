import * as Wb3 from 'web3';
import * as Boom from "boom";
import * as Hapi from "hapi";

import * as fs from 'fs';
const Web3 = require('web3'); // tslint:disable-line
import { getWeb3Config, Web3Configuration, IServerConfigurations } from "../configurations";
import { IDatabase } from '../database/database';
import { LoggerInstance } from 'winston';
import { PerformanceObserver, performance } from 'perf_hooks';
import { boomify } from 'boom';
import EmailController from '../communication/email-controller';
import SocketController, { io } from '../socket/socket-controller';
import { ICipher } from '../wallet/wallet';
import uuid = require('uuid');
import { transactionType, scope, transactionStatus, TrxModel, NetworkTransaction, addNetworkTrx, networkType, ITransaction } from '../transaction/trx';
import SawtoothController from '../saw-client/sawtooth-controller';
import { INotification, eventType, events } from '../notification/push';

export const web3Config: Web3Configuration = getWeb3Config();
const UPLOAD_PATH = 'src/artifacts';
const filename = "LandRegistry.json";
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH);
}
export const upload_path = `${UPLOAD_PATH}/${filename}`;

export const LandContract = require('../artifacts/LandRegistry.json');
// export const LandContractAbi = require('../artifacts/LandRegistry.abi');
// export const LandContractBytecode = require('../artifacts/LandRegistry.bytecode');
export const bytecode = LandContract.contracts['LandRegistry.sol:LandRegistry'].bytecode;
export const abi = JSON.parse(LandContract.contracts['LandRegistry.sol:LandRegistry'].interface);

//Sawtooth web3 connection
export const web3 = new Web3(new Web3.providers.HttpProvider(web3Config.sawtoothUrl));
export const web31 = new Web3(new Web3.providers.HttpProvider(web3Config.sawtoothUrl1));
export const contract = new web3.eth.Contract(abi, web3Config.sawtoothAddress);

//Ethereum testnet connection
export const web3TestNet: Wb3.default = new Web3(new Web3.providers.HttpProvider(web3Config.testnetUrl));
export const contractTest = new web3TestNet.eth.Contract(abi, web3Config.testnetAddress);

//Ethereum mainnet connection
export const web3Mainnet: Wb3.default = new Web3(new Web3.providers.HttpProvider(web3Config.mainnetUrl));
export const contractEth = new web3TestNet.eth.Contract(abi, web3Config.ethereumAddress);

export const estimateTest = web3TestNet.eth.estimateGas({ data: '0x' + bytecode });
export const estimateMain = web3TestNet.eth.estimateGas({ data: '0x' + bytecode });
export const estimateSawtooth = web3TestNet.eth.estimateGas({ data: '0x' + bytecode });

export default class WebConnection {
  // socketController = new SocketController(this.server, this.configs, this.database, this.logger);
  sawtoothController = new SawtoothController(this.configs, this.database, this.logger);
  // socketController = new SocketController(this.server, this.configs, this.database, this.logger);

  /**
 * Constructor
 * @param {IServerConfigurations} configs
 * @param {IDatabase} database
 * @param {winston.LoggerInstance} logger
 */
  constructor(
    private configs: IServerConfigurations,
    private database: IDatabase,
    private logger: LoggerInstance) {
  }

  async setMessageGasEstimation(web3, message, cb) {
    var func = "SetMessage(bytes32)";
    var methodSignature = web3TestNet.eth.abi.encodeFunctionSignature(func);

    var messageHex = web3.fromAscii(message, 32);
    var encodedParameter = web3.eth.abi.encodeParameter('bytes32', messageHex);

    var data = methodSignature //method signature
      + encodedParameter.substring(2); //hex of input string without '0x' prefix

    // estimateGas(web3, address, contractAddr, data, function (estimatedGas, err) {
    //   console.log("estimatedGas: " + estimatedGas);
    //   //further logic...
    // });
  }

  async estimateGas(web3, acc, contractAddr, data) {
    let gas = await web3.eth.estimateGas({
      from: acc,
      data: data,
      to: contractAddr
    });
    return gas;
  }
  /**
  * API route
  *  Sign transaction
  */
  async signTransaction(wallet, rawTransaction, identity, transactions, networkType, gas) {
    const self = this;
    try {
      const encodedABI = rawTransaction;
      web3TestNet.eth.accounts.signTransaction(
        {
          data: encodedABI,
          from: wallet.address,
          gas: gas ? gas : "0x2ECFE",
          gasPrice: "0x003B9ACA00",
          to: contractEth.options.address,
          value: '0x00'
        },
        wallet.privateKey,
      ).then(function (signedTx) {
        try {
          let response = self.sendTransaction(signedTx, identity, self, transactions, networkType);
          return response;
        } catch (error) {
          return boomify(error);
        }
      }
      );
      return encodedABI;
    } catch (error) {
      return new Error(error);
    }
  }
  /**
  * API route
  *  send transaction synchronous
  */
  sendTransaction(signedTx, identity, self, transactions, networkType) {
    try {
      // let emailContorller = new EmailController();
      let payload: NetworkTransaction = {
        message: "Inititated",
        status: transactionStatus.Submitted,
        networkType: networkType,
        receipt: {},
        hash: "-",
      };
      web3TestNet.eth.sendSignedTransaction(signedTx.rawTransaction)
        .once('transactionHash', async (hash) => {
          payload.message = "hash";
          payload.hash = hash;
          // emailContorller.sampleTransactionEmail(JSON.stringify(transactions));
          return payload;
        })
        .on('receipt', async (receipt) => {
          console.log(receipt.toString());
          this.logger.info(receipt.toString());
          payload.message = "receipt";
          payload.networkType = networkType.public;
          payload.receipt = receipt;
          payload.status = transactionStatus.Success;
          let publicTrx = await addNetworkTrx(payload);
          await self.database.transactionModel.findOneAndUpdate({ id: transactions.id }, { public: publicTrx, status: transactionStatus.Success }, { new: true });
          // emailContorller.sampleTransactionEmail(JSON.stringify(transactions));
          return payload;
        })
        .on('confirmation', async (confirmationNumber, receipt) => {
          if (confirmationNumber === 30) {
            transactions.public.status = transactionStatus.Success;
            transactions.save();
            // emailContorller.sampleTransactionEmail(JSON.stringify(transactions));
            // payload.status = transactionStatus.Success;
            // let publicTrx = await addNetworkTrx(payload);
            // await self.database.transactionModel.findOneAndUpdate({ id: transactions.id }, { public: publicTrx });
          }
        })
        .on('error', async (error) => {
          transactions.public.message = "error";
          transactions.public.status = transactionStatus.Failed;
          transactions.public.receipt = error;
          transactions.public.networkType = networkType.public;
          transactions.save();
          // emailContorller.sampleTransactionEmail(JSON.stringify(transactions));
          // await self.database.transactionModel.findOneAndUpdate({ id: transactions.id }, { public: publicTrx });
          return payload;
        }
        );
      return payload;
    } catch (error) {
      return new Error(error);
    }
  }
  /**
  * API route
  *  send transaction sawtooth
  */
  async sendTransactionSawtooth(encodeABI, identity, transactions, networkType, web3Network) {
    try {
      let addressP = {
        "TransactionID": "f8e123ccbb7ec6c4da47b354206e2b641d4b15cfde92612eaae7fcb6762025502e77b696ebae56298208ad85f0fe8d8461bae1cf015ba4103b5a54a63bf7c8e3",
        "Address": "19cb74bca455814272be969820de20d630cf2525"
      };

      let wallet = {
        address: addressP.Address,
        privateKey: "0xMHQCAQEEIN+aabULKNxYL9Hr7//olFiV+jQymfoZ12Fb5CHdtPyVoAcGBSuBBAAKoUQDQgAE8UPlE13s6yDOZz4o4g4fG3oBo2NvpdPa2WKDXlxaD5j/vr8+Wv3GFle+VYrUYSufxzLtzk0HBtSMTQiUVeR8pQ=="
      };
      // 03f143e5135deceb20ce673e28e20e1f1b7a01a3636fa5d3dad962835e5c5a0f98
      // const encodedABI = rawTransaction;
      let response = await web3.eth.sendTransaction({
        data: encodeABI,
        from: wallet.address,
        gas: "0x2ECFE",
        gasPrice: "0x003B9ACA00",
        to: "0x1cf6937d5111a1cc39b852558e616672dd2a1096", //contract.options.address,
        value: '0x00'
      });
      // let emailContorller = new EmailController();
      // let payload: NetworkTransaction = {
      //   message: "Inititated",
      //   status: transactionStatus.Submitted,
      //   networkType: networkType,
      //   receipt: "-",
      //   hash: "-",
      // };
      return response;
    } catch (error) {
      console.log("error at sendTransactionSawtooth");
      console.log(error);
      return Boom.badData(error);
    }
  }
  /**
  * API route
  *  Transfer test net ether to user
  */
  async transferEther(toAddress, amount, identity, trxId) {
    const self = this;
    // console.log(" In tranfer");
    const privateKey = fs.readFileSync("./src/web3/.secret").toString().trim();
    // console.log(" private key " + privateKey);
    try {
      // console.log(" Value to transfer is " + amount + " in wei " + web3TestNet.utils.toWei("0.5", "ether"));
      web3TestNet.eth.accounts.signTransaction(
        {
          from: '0xa16854F9BE984369A80754a0B77557ee63610680',
          to: toAddress,
          gas: "0x2ECFE",
          gasPrice: "0x003B9ACA00",
          value: web3.utils.toWei("0.5", "ether")
        },
        privateKey,
      ).then(function (signedTx) {
        try {
          let response = self.sendTransaction(signedTx, identity, self, trxId, networkType.public);
          self.logger.info(JSON.stringify(signedTx));
          return response;
        } catch (error) {
          return boomify(error);
        }
      }
      );
      return true;
    } catch (error) {
      return new Error(error);
    }
  }
  async getData(address) {
    let result = await contractEth.methods.getRole(address).call();
    return result;
  }
  /**
  *  Create the wallet for user
  * @returns {Promise<any>}
  */
  async createWallet(email: string, password: string) {
    //ToDo password encryption
    // try {
    // let wallet = await this.web3.eth.personal.newAccount(); // To create contract on node connected
    // console.log(" Sawtooth account creation");
    // let sawtooth = await this.createSethAccount(password);
    // console.log(sawtooth);
    let wallet = web3.eth.accounts.create();

    // TO DO: sawtooth account import
    // web3.eth.accounts();
    let cipher: any = web3.eth.accounts.encrypt(wallet.privateKey, email);
    cipher.email = email;
    let cipherDoc = await this.database.cipherModel.findOne({ email: email });
    if (!cipherDoc) {
      await this.database.cipherModel.create(cipher);
    }
    return wallet;
    // } catch (error) {
    //   return Boom.boomify(error, { message: " Error while creating wallet" });
    // }
  }
  /**
  * API route
  *  Create a account in sawtooth seth node
  * @param {IRequest} request
  * @param {ResponseToolkit} h
  * @returns {Promise<any>}
  */
  async createSethAccount(password: string) {
    try {
      // console.log(password);
      let b = performance.now();
      // let wallet = web3TestNet.eth.accounts.create();
      let wallet = web3.eth.accounts.create();
      // let wallets = web3.eth.getAccounts();
      // console.log(" and wallets is " + JSON.stringify(wallets));
      //personal_newAccount
      //["password", "myalias", "+all"]
      // tslint:disable-next-line:whitespace
      let address = await web3.eth.personal.newAccount("password");
      let b2 = performance.now();
      // console.log("time taken by seth is " + (b2 - b));
      // console.log(" and address is " + address);
      // console.log(" and wallets is " + wallets);
      return address;
    } catch (error) {
      console.log("error in seth account creation");
      return Boom.boomify(error);
    }
  }
  //  curl -X POST --data '{"jsonrpc":"2.0","method":"personal_newAccount","params":["password"],"id":1}' http://0.0.0.0:3030
  // curl http://0.0.0.0:3030 -d '{"jsonrpc": "2.0", "id": 1, "method": "personal_unlockAccount","params":["password", "myalias", "+all,-root"]}' -H "Content-Type: application/json"
  // curl http://104.248.221.95:3030 -d '{"jsonrpc": "2.0", "id": 1, "method": "personal_unlockAccount", "params":["myalias", "password"]}' -H "Content-Type: application/json"

  // 104.248.221.95
  // curl -X POST --data '{"jsonrpc":"2.0","method":"personal_newAccount","params":["password", "myalias", "+all,-root"],"id":1}' http://0.0.0.0:3030 -H "Content-Type: application/json"
  //  curl http://0.0.0.0:3030 -d '{"jsonrpc": "2.0", "id": 1, "method": "eth_blockNumber"}' -H "Content-Type: application/json"

  //      ("personal_listAccounts".into(), list_accounts),
  //         ("personal_newAccount".into(), new_account),
  //         ("personal_unlockAccount".into(), unlock_account),
  //         ("personal_importRawKey".into(), import_raw_key),
  //                 ("seth_getPermissions".into(), get_permissions),
  //         ("seth_setPermissions".into(), set_permissions),


  //          seth account import key-file.pem raw
  /**
  * Function
  *  Decrypt the user wallet
  * @param {IRequest} request
  * @param {ResponseToolkit} h
  * @returns {Promise<any>}
  */
  async decryptWallet(cipher: ICipher, password: string) {
    let account = web3TestNet.eth.accounts.decrypt(cipher, password);
    return account;
  }
  /**
  * Function call
  *  Create the wallet for user
  * @returns {Promise<any>}
  */
  async createAdminWallet(email: string, password: string) {
    //ToDo password encryption
    // try {
    email.toLowerCase().trim();
    const privateKey = fs.readFileSync("./src/web3/.secret").toString().trim();
    let cipher: any = web3.eth.accounts.encrypt(privateKey, email);
    cipher.email = email;
    let account = await this.database.cipherModel.find({ email: email });
    if (!account) {
      return await this.database.cipherModel.create(cipher);
    }
    let cipherDoc = await this.database.cipherModel.findOneAndUpdate({ email: email }, cipher, { upsert: true });
    return cipherDoc;
    // } catch (error) {
    //   return Boom.boomify(error, { message: " Error while creating wallet" });
    // }
  }
  async getWallet(email: string) {
    let cipher = await this.database.cipherModel.findOne({ email: email });
    delete cipher.email;
    let account = web3.eth.accounts.decrypt(cipher, email);
    return account;
  }

  async getAdminWallet() {
    let email = 'admin@garuda.com';
    let cipher = await this.database.cipherModel.findOne({ email: email });
    delete cipher.email;
    let account = web3.eth.accounts.decrypt(cipher, email);
    return account;
  }
  /**
  * API route
  *  Add user to ethereum smart contract
  * @param {IRequest} request
  * @param {ResponseToolkit} h
  * @returns {Promise<any>}
  */
  async addUser(address: string, role: number, identity, trxId) {
    try {
      let account = await this.getAdminWallet();
      let query = await contractEth.methods.addUser(address, role).encodeABI();
      let gas = await contractEth.methods.addUser(address, role).estimateGas({ from: account.address });
      let payload = {
        transactionType: transactionType.AddUser,
        address: address,
        status: transactionStatus.In_Progress,
        scope: scope.admin,
        sender: account.address
      };
      let trxObject = await TrxModel(trxId, payload);
      let transaction = await this.database.transactionModel.create(trxObject);
      let response = await this.signTransaction(account, query, identity, transaction, networkType.public, gas); // Active code
      // TODO sawtooth part;
      // let sawtoothTrx = await this.sendTransactionSawtooth(query, identity, transaction, networkType.private, web3);
      return response;
    } catch (error) {
      // console.log("error at addUser");
      // console.log(error);
      return Boom.badRequest(error);
    }
  } // create events in contract for add user, change role,

  async changeUserRole(address: string, role: number, identity) {
    let account = await this.getAdminWallet();
    enum roles { user, builder, government, admin, superadmin }
    let query = await contractEth.methods.changeRole(address, role).encodeAbi();
    let gas = await contractEth.methods.changeRole(address, role).estimateGas();
    let trxId = uuid.v4();
    let response = await this.signTransaction(account, query, identity, trxId, networkType.public, gas);
    return response;
  }
  async getRole(address: string) {
    let result = await contractEth.methods.getRole(address).call();
    return result;
  }
  async createProperty(account, user, walletAddress, payload, address, trxId, privateKey) {
    let query = await contractEth.methods.createProperty(
      walletAddress, payload.propId, payload.hash, payload.value, [payload.location[0], payload.location[1]], payload.name, address)
      .encodeABI();
    const estimateGas = await web3TestNet.eth.estimateGas({ data: '0x' + bytecode });
    let notify = {
      id: uuid.v4(),
      UserNotification: [{
        userId: user.userId,
        email: user.email,
        read: false
      }],
      title: events.create_property.title,
      message: events.create_property.message,
      // icon?: string;
      url: trxId,
      event: eventType.create_property
    };
    this.sendEvent(notify);
    // let gas = await contractEth.methods.createProperty(
    //   walletAddress, payload.propId, payload.hash, payload.value, [payload.location[0], payload.location[1]], payload.name, address)
    //   .estimateGas(      {
    //     from: account.address,
    //     to: contractEth.
    //   });
    let privateTrx: NetworkTransaction = {
      message: "Inititated",
      status: transactionStatus.Submitted,
      networkType: networkType.private,
      receipt: {},
      hash: "-",
    };
    let trx = {
      transactionType: transactionType.CreateProperty,
      address: walletAddress,
      status: transactionStatus.In_Progress,
      scope: scope.personal,
      sender: account.address,
      private: privateTrx
    };
    let trxObject = await TrxModel(trxId, trx);
    let transaction = await this.database.transactionModel.create(trxObject);
    let response = await this.signTransaction(account, query, user, transaction, networkType.public, estimateGas);
    let result = await this.sawtoothController.sendRequest(privateKey, payload);
    // await this.socketController.sendEvent();
    // let notify = {
    //   id: uuid.v4(),
    //   UserNotification: [{
    //     userId: user.userId,
    //     email: user.email,
    //     read: false
    //   }],
    //   title: events.create_property.title,
    //   message: events.create_property.message,
    //   // icon?: string;
    //   url: "string",
    //   event: eventType.create_property
    // };
    // this.sendEvent(notify);
    return response;
  }

  async sendEvent(notification) {
    try {
      let event = await this.database.eventModel.create(notification);
      notification.UserNotification.forEach(async (user) => {
        let subscription;
        if (user.userId) {
          subscription = await this.database.subscribeModel.findOne({ userId: user.userId });
        } else {
          subscription = await this.database.subscribeModel.findOne({ email: user.email });
        }
        if (subscription !== null) {
          user.read = true;
          console.log(subscription.socketId);
          // this.emitter.emit("new_notification", notification);
          io.to(subscription.socketId).emit('new_notification', notification);
        }
      });
      return event;
    } catch (error) {
      return Boom.boomify(error, { message: "Error while Send event" });
    }
  }
  async approveProperty(property, identity, privateKey, trxId, certificate) {
    try {
      let account = await this.getAdminWallet();
      //(property, identity, privateKey, trxId)
      // console.log(account);
      let query = await contractEth.methods.approveProperty(property.propId).encodeABI();
      let gas = await contractEth.methods.approveProperty(property.propId).estimateGas({
        from: account.address
      });
      let privateTrx: NetworkTransaction = {
        message: "Inititated",
        status: transactionStatus.Submitted,
        networkType: networkType.private,
        receipt: {},
        hash: "-",
      };
      let payload = {
        transactionType: transactionType.ConfirmProperty,
        address: account.address,
        status: transactionStatus.In_Progress,
        scope: scope.government,
        sender: account.address,
        private: privateTrx
      };
      let trxObject = await TrxModel(trxId, payload);
      let transaction = await this.database.transactionModel.create(trxObject);
      let response = await this.signTransaction(account, query, identity, transaction, networkType.public, gas); // Active code
      // TODO sawtooth part;
      // certificate.action = 'certificate';
      // certificate.id = uuid.v4();
      let result = await this.sawtoothController.sendRequest(privateKey, certificate);
      // response.hash = result.hash;
      let notify = {
        id: uuid.v4(),
        UserNotification: [{
          // userId: user.userId,
          email: identity,
          read: false
        }],
        title: events.create_property.title,
        message: events.create_property.message,
        // icon?: string;
        url: "string",
        event: eventType.create_property
      };
      this.sendEvent(notify);
      return result;
    } catch (error) {
      this.logger.error(error);
      // return Boom.badImplementation(error);
    }
  }

  async rejectProperty(property, identity) {
    try {
      let account = await this.getAdminWallet();
      // console.log(account);
      let query = await contractEth.methods.rejectProperty(property.propId).encodeABI();
      let gas = await contractEth.methods.rejectProperty(property.propId).estimateGas();
      let trxId = uuid.v4();
      let payload = {
        transactionType: transactionType.ConfirmProperty,
        address: account.address,
        status: transactionStatus.Failed,
        scope: scope.government,
        sender: account.address
      };
      let trxObject = await TrxModel(trxId, payload);
      let transaction = await this.database.transactionModel.create(trxObject);
      let response = await this.signTransaction(account, query, identity, transaction, networkType.public, gas); // Active code
      // TODO sawtooth part;
      return response;
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
  async ListMarketplace(account, property, identity, listingType, privateKey, payload) { //, trxId, privateKey
    try {
      let query = await contractEth.methods.listMarketplace(property.propId, property.value, listingType).encodeABI();
      // let gas = await contractEth.methods.listMarketplace(property.propId, property.value, listingType)
      //   .estimateGas({
      //     from: account.address
      //   });
      const estimateGas = await web3TestNet.eth.estimateGas({ data: '0x' + bytecode });

      let trxId = uuid.v4();
      let privateTrx: NetworkTransaction = {
        message: "Inititated",
        status: transactionStatus.Submitted,
        networkType: networkType.private,
        receipt: {},
        hash: "-",
      };
      let trx = {
        transactionType: transactionType.List,
        address: account.address,
        status: transactionStatus.In_Progress,
        scope: scope.personal,
        sender: account.address,
        private: privateTrx
      };
      let trxObject = await TrxModel(trxId, trx);
      let transaction = await this.database.transactionModel.create(trxObject);
      let response = await this.signTransaction(account, query, identity, transaction, networkType.public, estimateGas);
      let result = await this.sawtoothController.sendRequest(privateKey, payload);
      return response;
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
  // buy request
  async buyRequest(account, payload, identity, contract, privateKey) {
    // try {
    console.log(payload.buyerAddress);
    let query = await contractEth.methods.buyRequest(payload.propId, payload.buyerAddress).encodeABI();
    // let gas = await contractEth.methods.buyRequest(payload.propId, payload.buyerAddress)
    //   .estimateGas({
    //     from: account.address
    //   });
    const gas = await web3TestNet.eth.estimateGas({ data: '0x' + bytecode });

    let trxId = uuid.v4();
    let privateTrx: NetworkTransaction = {
      message: "Inititated",
      status: transactionStatus.Submitted,
      networkType: networkType.private,
      receipt: {},
      hash: "-",
    };
    let trx = {
      transactionType: transactionType.Buy,
      address: account.address,
      status: transactionStatus.In_Progress,
      scope: scope.personal,
      sender: account.address,
      private: privateTrx
    };
    let trxObject = await TrxModel(trxId, trx);
    let transaction = await this.database.transactionModel.create(trxObject);
    // console.log(transaction);
    let response = await this.signTransaction(account, query, identity, transaction, networkType.public, gas);
    // console.log("Web3 ");
    let result = await this.sawtoothController.sendRequest(privateKey, contract);

    return result;
    // } catch (error) {
    //   return Boom.badImplementation(error);
    // }
  }
  async changeOwnership(account, payload, identity) {
    try {
      // direct transfer only owner
      let query = await contractEth.methods.changeOwnership(payload.propId, payload.buyerAddress).encodeABI();
      // let gas = await contractEth.methods.changeOwnership(payload.propId, payload.buyerAddress)
      //   .estimateGas({
      //     from: account.address
      //   });
      const gas = await web3TestNet.eth.estimateGas({ data: '0x' + bytecode });

      let trxId = uuid.v4();
      let trx = {
        transactionType: transactionType.Transfer,
        address: account.address,
        status: transactionStatus.In_Progress,
        scope: scope.government,
        sender: account.address
      };
      let trxObject = await TrxModel(trxId, trx);
      let transaction = await this.database.transactionModel.create(trxObject);
      console.log(transaction);
      let response = await this.signTransaction(account, query, identity, transaction, networkType.public, gas);
      // console.log("Web3 ");
      return response;
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  async approveChangeOwnership(account, payload, identity) {
    try {
      let query = await contractEth.methods.approveChangeOwnership(payload.propId).encodeABI();
      // let gas = await contractEth.methods.approveChangeOwnership(payload.propId)
      //   .estimateGas({
      //     from: account.address
      //   });
      const gas = await web3TestNet.eth.estimateGas({ data: '0x' + bytecode });

      let trxId = uuid.v4();
      let trx = {
        transactionType: transactionType.ConfirmBuy,
        address: account.address,
        status: transactionStatus.In_Progress,
        scope: scope.personal,
        sender: account.address
      };
      let trxObject = await TrxModel(trxId, trx);
      let transaction = await this.database.transactionModel.create(trxObject);
      console.log(transaction);
      let response = await this.signTransaction(account, query, identity, transaction, networkType.public, gas);
      // console.log("Web3 ");
      return response;
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
  async getPropertyDetails(account, identity) {

  }
  async getPropertyArray(account, identity) {

  }
  async getUserProperties(account, identity) {

  }
  async getMarketplace(account, identity) {

  }
}