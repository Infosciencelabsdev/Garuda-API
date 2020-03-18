import * as Hapi from "hapi";
import * as Boom from "boom";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import { IRequest } from "../interfaces/request";
import { IPassport } from "../user/user";
import { IPrivateKey } from "./model";
import * as Axios from 'axios';
import { env } from "./env";
// Sawtooth dependencise
const { createContext, CryptoFactory } = require('sawtooth-sdk/signing');
const { createHash } = require('crypto');
const cbor = require('cbor');
const crypto = require("crypto");
const {
  Secp256k1PrivateKey,
  Secp256k1PublicKey
} = require('sawtooth-sdk/signing/secp256k1');
const { protobuf } = require('sawtooth-sdk');
const request = require('request-promise');
// const WebSocket = require('ws');

// const ws = new WebSocket('ws://www.host.com/path', {
//   perMessageDeflate: false
// });
export const context = createContext('secp256k1');
export default class SawtoothController {

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
  /**
* API route
*  Create the private key for use in sawtooth
*/
  async createAccount(user: any) {
    try {
      let key = await this.database.sawtoothModel.findOne({ userId: user.userId });
      if (key !== null) {
        return Boom.badData("Key Account already exists");
      }
      //  else if (!key.publicKey) {
      //   key.publicKey = new CryptoFactory(context).newSigner(key.privateKey);
      //   key.save();
      // }
      const privateKey = context.newRandomPrivateKey();
      const signer = new CryptoFactory(context).newSigner(privateKey);
      console.log('SIgner, ', signer);
      console.log('Private Key', privateKey);

      let privateDocument: IPrivateKey = {
        userId: user.id,
        email: user.email,
        privateKey: privateKey,
        publicKey: signer.getPublicKey().asHex(),
        encrypted: false,
        signer: signer
      };
      await this.database.sawtoothModel.create(privateDocument);
      return privateKey;
    } catch (error) {
      return Boom.boomify(error);
    }
  }

  async getSigner(userId, email) {
    let key = await this.database.sawtoothModel.findOne({ userId: userId });
    if (key == null) {
      var privateKey = context.newRandomPrivateKey();
      const signer = new CryptoFactory(context).newSigner(privateKey);
      console.log('Creating a new Signer to create the property');

      let privateDocument: IPrivateKey = {
        userId: userId,
        email: email,
        privateKey: privateKey.asHex(),
        publicKey: null,
        encrypted: false,
        signer: signer,
      };
      await this.database.sawtoothModel.create(privateDocument);
      return signer;

    } else if (!key.publicKey) {
      console.log("There is no public key: ");
      const signer = new CryptoFactory(context).newSigner(Secp256k1PrivateKey.fromHex(key.privateKey));
      key.publicKey = signer;
      key.save();
      return signer;
    }
    console.log('Retrieving the signer data corresponding to the private Key');
    const signer = new CryptoFactory(context).newSigner(Secp256k1PrivateKey.fromHex(key.privateKey));
    return signer;
  }
  async createHeaderSignature(privateKey, payload) {
    const signer = new CryptoFactory(context).newSigner(privateKey);
    const payloadBytes = cbor.encode(payload);
    const transactionHeaderBytes = protobuf.TransactionHeader.encode({
      familyName: 'gblock',
      familyVersion: '1.0',
      inputs: ['c4f834'],
      outputs: ['c4f834'],
      signerPublicKey: signer.getPublicKey().asHex(),
      batcherPublicKey: signer.getPublicKey().asHex(),
      dependencies: [],
      payloadSha512: createHash('sha512').update(payloadBytes).digest('hex'),
      nonce: (new Date()).toString()
    }).finish();

    const signature = signer.sign(transactionHeaderBytes);
    return { signature, signer, payloadBytes, transactionHeaderBytes };
  }
  async postRequest(signature, transactionHeaderBytes, payloadBytes, privateKey) {
    const signer = new CryptoFactory(context).newSigner(privateKey);

    const transaction = protobuf.Transaction.create({
      header: transactionHeaderBytes,
      headerSignature: signature,
      payload: payloadBytes
    });
    const transactions = [transaction];

    const batchHeaderBytes = protobuf.BatchHeader.encode({
      signerPublicKey: signer.getPublicKey().asHex(),
      transactionIds: transactions.map((txn) => txn.headerSignature),
    }).finish();

    let headerSignature = signer.sign(batchHeaderBytes);

    const batch = protobuf.Batch.create({
      header: batchHeaderBytes,
      headerSignature: headerSignature,
      transactions: transactions
    });

    const batchListBytes = protobuf.BatchList.encode({
      batches: [batch]
    }).finish();
    request.post({
      url: 'http://localhost:8008/batches',
      body: batchListBytes,
      headers: { 'Content-Type': 'application/octet-stream' }
    }, async (err, response) => {
      if (err) {
        return console.log(err);
      }
      console.log(response.body);
      return response;
    });
  }
  async sendRequestNoDb(privateKey: any, payload: any) {
    const signer = new CryptoFactory(context).newSigner(privateKey);
    const payloadBytes = cbor.encode(payload);
    const transactionHeaderBytes = protobuf.TransactionHeader.encode({
      familyName: 'gblock',
      familyVersion: '1.0',
      inputs: ['c4f834'],
      outputs: ['c4f834'],
      signerPublicKey: signer.getPublicKey().asHex(),
      batcherPublicKey: signer.getPublicKey().asHex(),
      dependencies: [],
      payloadSha512: createHash('sha512').update(payloadBytes).digest('hex'),
      nonce: (new Date()).toString()
    }).finish();

    const signature = signer.sign(transactionHeaderBytes);
    const transaction = protobuf.Transaction.create({
      header: transactionHeaderBytes,
      headerSignature: signature,
      payload: payloadBytes
    });
    const transactions = [transaction];

    const batchHeaderBytes = protobuf.BatchHeader.encode({
      signerPublicKey: signer.getPublicKey().asHex(),
      transactionIds: transactions.map((txn) => txn.headerSignature),
    }).finish();

    let headerSignature = signer.sign(batchHeaderBytes);

    const batch = protobuf.Batch.create({
      header: batchHeaderBytes,
      headerSignature: headerSignature,
      transactions: transactions
    });

    const batchListBytes = protobuf.BatchList.encode({
      batches: [batch]
    }).finish();
    // let response = await
    request.post({
      url: 'http://localhost:8008/batches',
      // url: 'http://158.69.118.172:8008/batches'
      body: batchListBytes,
      headers: { 'Content-Type': 'application/octet-stream' }
      // });
      // // console.log("response from trx processor");
      // // console.log(response);
      // return response;
    }, async (err, response) => {
      if (err) {
        // dbTransaction.private.status = transactionStatus.Failed;
        // dbTransaction.private.receipt = err;
        // dbTransaction.save();
        // console.log(err);
        response.hash = signature;
        return err;
      }
      // dbTransaction.private.status = transactionStatus.Success;
      // dbTransaction.private.receipt = response;
      // dbTransaction.save();
      // Create db private transaction
      console.log(response.body);
      response.hash = signature;
      return response;
    });
    return { hash: signature };
    // const res = await Axios({
    //   method: 'post',
    //   baseURL: 'http://158.69.118.172:8080',
    //   url: '/batches',
    //   headers: {
    //     'Content-Type': 'application/octet-stream'
    //   },
    //   data: batchListBytes
    // });
    // return res;
  }
  async sendRequest(privateKey, payload, TitleDoc?) {
    try {
      // let titleCertificate = await this.database.titleCertificateModel.findOne({ id: payload.data.propId }).then( function(response:any) {
      //   console.log('Differernt' , response);
      //   return response;
      // });
      //  titleCertificate = await this.database.titleCertificateModel.findOne({ id: payload.data.propId });
      const signer = privateKey;

      const payloadBytes = cbor.encode(payload);
      const transactionHeaderBytes = protobuf.TransactionHeader.encode({
        familyName: env.familyName,
        familyVersion: env.familyVersion,
        inputs: ['c4f834'],
        outputs: ['c4f834'],
        signerPublicKey: signer.getPublicKey().asHex(),
        batcherPublicKey: signer.getPublicKey().asHex(),
        dependencies: [],
        payloadSha512: createHash('sha512').update(payloadBytes).digest('hex'),
        nonce: (new Date()).toString()
      }).finish();

      const signature = signer.sign(transactionHeaderBytes);

      const transaction = protobuf.Transaction.create({
        header: transactionHeaderBytes,
        headerSignature: signature,
        payload: payloadBytes
      });
      // const transactions = [transaction];

      const batchHeaderBytes = protobuf.BatchHeader.encode({
        signerPublicKey: signer.getPublicKey().asHex(),
        transactionIds: [transaction.headerSignature]
      }).finish();

      let headerSignature = signer.sign(batchHeaderBytes);

      const batch = protobuf.Batch.create({
        header: batchHeaderBytes,
        headerSignature: headerSignature,
        transactions: [transaction]
      });

      const batchListBytes = protobuf.BatchList.encode({
        batches: [batch]
      }).finish();
      request.post({
        url: 'http://localhost:8008/batches',
        // url: 'http://158.69.118.172:8008/batches'
        body: batchListBytes,
        headers: { 'Content-Type': 'application/octet-stream' }
      }, async (err, response) => {
        // console.log(response);
        console.log('Sent the transaction');
        response.hash = signature;
        if (err) {
          return err;
        }
        console.log(response.body);

        return signature;
      });
      // const res = await Axios.default({
      // let res = await Axios.default({
      //   method: 'post',
      //   baseURL: 'http://localhost:8008',
      //   url: '/batches',
      //   headers: {
      //     'Content-Type': 'application/octet-stream'
      //   },
      //   data: batchListBytes
      // });
      // return {hash: signature, response: res};
      return signature ;
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
  async createTransaction(privateKey, payload, dbTransaction) {
    const signer = new CryptoFactory(context).newSigner(privateKey);
    const payloadBytes = cbor.encode(payload);
    const transactionHeaderBytes = protobuf.TransactionHeader.encode({
      familyName: 'gblock',
      familyVersion: '1.0',
      inputs: ['c4f834'],
      outputs: ['c4f834'],
      signerPublicKey: signer.getPublicKey().asHex(),
      batcherPublicKey: signer.getPublicKey().asHex(),
      dependencies: [],
      payloadSha512: createHash('sha512').update(payloadBytes).digest('hex'),
      nonce: (new Date()).toString()
    }).finish();

    const signature = signer.sign(transactionHeaderBytes);
    dbTransaction.private.hash = signature;
    dbTransaction.save();
    const transaction = protobuf.Transaction.create({
      header: transactionHeaderBytes,
      headerSignature: signature,
      payload: payloadBytes
    });
    return { transaction, signature };
  }
  async sendMultipleRequest(transactions, privateKey) {
    const signer = new CryptoFactory(context).newSigner(privateKey);

    const batchHeaderBytes = protobuf.BatchHeader.encode({
      signerPublicKey: signer.getPublicKey().asHex(),
      transactionIds: transactions.map((txn) => txn.headerSignature),
    }).finish();

    let headerSignature = signer.sign(batchHeaderBytes);

    const batch = protobuf.Batch.create({
      header: batchHeaderBytes,
      headerSignature: headerSignature,
      transactions: transactions
    });

    const batchListBytes = protobuf.BatchList.encode({
      batches: [batch]
    }).finish();
    // let response = await
    request.post({
      url: 'http://localhost:8008/batches',
      // url: 'http://158.69.118.172:8008/batches'
      body: batchListBytes,
      headers: { 'Content-Type': 'application/octet-stream' }
      // });
      // // console.log("response from trx processor");
      // // console.log(response);
      // return response;
    }, async (err, response) => {
      if (err) {
        // dbTransaction.private.status = transactionStatus.Failed;
        // dbTransaction.private.receipt = err;
        // dbTransaction.save();
        // console.log(err);
        // response.hash = signatures;
        return err;
      }
      // dbTransaction.private.status = transactionStatus.Success;
      // dbTransaction.private.receipt = response;
      // dbTransaction.save();
      // Create db private transaction
      // response.hash = signatures;
      return response;
    });
    // return { hash: signatures };
    // const res = await Axios({
    //   method: 'post',
    //   baseURL: 'http://158.69.118.172:8080',
    //   url: '/batches',
    //   headers: {
    //     'Content-Type': 'application/octet-stream'
    //   },
    //   data: batchListBytes
    // });
    // return res;
  }
  async getRequest(privateKey, address) {
    address = makeAddress(address, '');
    let payload = {
      action: "get",
      address: address
    };
    const signer = new CryptoFactory(context).newSigner(privateKey);
    // console.log(payload);
    const payloadBytes = cbor.encode(payload);
    const transactionHeaderBytes = protobuf.TransactionHeader.encode({
      familyName: 'gblock',
      familyVersion: '1.0',
      inputs: ['c4f834'],
      outputs: ['c4f834'],
      signerPublicKey: signer.getPublicKey().asHex(),
      batcherPublicKey: signer.getPublicKey().asHex(),
      dependencies: [],
      payloadSha512: createHash('sha512').update(payloadBytes).digest('hex'),
      nonce: (new Date()).toString()
    }).finish();

    const signature = signer.sign(transactionHeaderBytes);
    const transaction = protobuf.Transaction.create({
      header: transactionHeaderBytes,
      headerSignature: signature,
      payload: payloadBytes
    });
    const transactions = [transaction];

    const batchHeaderBytes = protobuf.BatchHeader.encode({
      signerPublicKey: signer.getPublicKey().asHex(),
      transactionIds: transactions.map((txn) => txn.headerSignature),
    }).finish();

    let headerSignature = signer.sign(batchHeaderBytes);

    const batch = protobuf.Batch.create({
      header: batchHeaderBytes,
      headerSignature: headerSignature,
      transactions: transactions
    });

    const batchListBytes = protobuf.BatchList.encode({
      batches: [batch]
    }).finish();
    let response = await
      request.post({
        url: 'http://localhost:8008/batches',
        body: batchListBytes,
        headers: { 'Content-Type': 'application/octet-stream' }
        // });
        // // console.log("response from trx processor");
        // // console.log(response);
        // return response;
      });
    return response;
  }
  async getState(request: any, h: Hapi.ResponseToolkit): Promise<any> {
    const identity = request.auth.credentials.id;
    let params = request.params;
    let address = params["address"];
    // let address = makeAddress(params["address"], '');
    try {
      let user = await this.database.passportModel.findOne({ email: identity });

      let key = await this.database.sawtoothModel.findOne({ email: identity }).select('-privateKey._id -privateKey.__v');
      let privateKey;
      if (key == null) {
        privateKey = await this.createAccount(user);
        // await this.sawtoothController.sendRequest(privateKey, payload, trxId);
      } else {
        privateKey = { privateKeyBytes: key.privateKey.privateKeyBytes };
        // await this.sawtoothController.sendRequest(privateKey1, payload, trxId);
      }
      return await this.getRequest(privateKey, address);
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
}
let _hash = (x) =>
  crypto.createHash('sha512').update(x).digest('hex').toLowerCase().substring(0, 64);

let TP_NAMESPACE = _hash('gblock').substring(0, 6);

const makeAddress = (x, label) => TP_NAMESPACE + _hash(x);