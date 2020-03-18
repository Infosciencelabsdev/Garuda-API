import * as crypto from "crypto";
import { TransactionHandler } from 'sawtooth-sdk/processor/handler';
const { InternalError, InvalidTransaction } = require('sawtooth-sdk/processor/exceptions');

import * as cbor from 'cbor';

import { createProp, transferProp, createCert } from './explorerFunc';
import { env } from '../saw-client/env';
import { LoggerInstance } from "winston";
import logger from "../plugins/logger";

const _hash = (x: any) =>
  crypto.createHash('sha512').update(x).digest('hex').toLowerCase().substring(0, 64);

export const makeAddress = (id: any) =>
  TP_NAMESPACE + _hash(id).slice(-64);

const TP_FAMILY: string = env.familyName;
const TP_VERSION: string = env.familyVersion;
const TP_NAMESPACE: string = env.familyPrefix;

export default class ExpHandler extends TransactionHandler {

  constructor(private logger?: LoggerInstance) {
    super(TP_FAMILY, [TP_VERSION], [TP_NAMESPACE]);
  }

  apply(transactionProcessRequest: any, context: any) {
    let payload = cbor.decode(transactionProcessRequest.payload);
    let header = transactionProcessRequest.header;

    var userAddress: any = [];
    if (payload.data.owner) {
      for (let i = 0; i < payload.data.owner.length; i++) {
        userAddress.push(makeAddress(payload.data.owner[i]));
      }
    } else if (payload.data.seller) {
      for (let i = 0; i < payload.data.seller.length; i++) {
        userAddress.push(makeAddress(payload.data.seller[i]));
      }
    } else {
      console.log('Owner Address cannot be calculated');
      return false;
    }

    let propAddress = makeAddress(payload.data.propId);

    let certAddress = null;
    if (payload.data.certificate && payload.data.certificate.length > 1) {
      certAddress = makeAddress(payload.data.certificate);
    }

    var transferAddress: any = false;
    let contractAddress: any = false;

    if (!payload.data.transactionList) {
      payload.data.transactionList = [];
    }
    payload.data.transactionId = transactionProcessRequest.signature;

    let actionFn: any = createProp;
    if (payload.action === 'transfer') {
      actionFn = transferProp;
      transferAddress = makeAddress(payload.data.buyer[0]);
      contractAddress = makeAddress(payload.data.contract);
    } else if (payload.action === 'create') {
      if (payload.entity === 'Certificate') {
        actionFn = createCert;
      } else if (payload.entity === 'contract') {
        actionFn = transferProp;
        transferAddress = makeAddress(payload.data.buyer[0]);
        contractAddress = makeAddress(payload.data.contract);
      } else {
        actionFn = createProp;
      }
    } else {
      throw new InvalidTransaction(
        `Invalid action ${payload.action}`
      );
    }

    let getPromise = context.getState();

    let actionPromise: any;
    if (payload.action === 'transfer' || payload.entity === 'contract') {
      actionPromise = getPromise.then(
        actionFn(context, propAddress, payload, userAddress, certAddress, transferAddress, contractAddress)
      );
    } else {
      actionPromise = getPromise.then(
        actionFn(context, propAddress, payload, userAddress, certAddress)
      );
    }

    return actionPromise.then((addresses: any) => {
      if (addresses.length === 0) {
        throw new InvalidTransaction('State Error!');
      } else if (addresses === 0) {
        console.log('State update function is not executed');
      } else {
        console.log(`State updated at the address: ${JSON.stringify(addresses)}`);
      }
    });
  }
}
