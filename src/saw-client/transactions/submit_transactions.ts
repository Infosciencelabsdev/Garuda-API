'use strict';
const {
  randomBytes,
  createHash
} = require('crypto');
import { env } from '../env';
const axios = require('axios');
const cbor = require('cbor');
const protobuf = require('sawtooth-sdk/protobuf');

const SawtoothClientFactory = (factoryOptions: any) => {
  return {
    async get(url: any) {
      try {
        const res = await axios({
          method: 'get',
          baseURL: factoryOptions.restApiUrl,
          url
        });
        return res;
      } catch (err) {
        console.log('error', err);
      }
    },
    newTransactor(transactorOptions: any) {
      const _familyNamespace = env.familyPrefix;
      const _familyVersion = env.familyVersion;
      const _familyEncoder = cbor.encode;
      return {
        async post(payload: any, txnOptions: any) {

          //Encoding the payload
          const payloadBytes = cbor.encode(payload);
          console.log('Public Key ', factoryOptions.enclave.publicKey);

          // Encode a transaction header
          const transactionHeaderBytes = protobuf.TransactionHeader.encode({
            familyName: env.familyName,
            familyVersion: env.familyVersion,
            inputs: [_familyNamespace],
            outputs: [_familyNamespace],
            signerPublicKey: factoryOptions.enclave.publicKey.toString('hex'),
            batcherPublicKey: factoryOptions.enclave.publicKey.toString('hex'),
            dependencies: [],
            nonce: randomBytes(32).toString('hex'),
            payloadSha512: createHash('sha512').update(payloadBytes).digest('hex'),
            ...txnOptions // overwrite above defaults with passed options

          }).finish();

          // Sign the txn header. This signature will also be the txn address
          const txnSignature = factoryOptions.enclave.sign(transactionHeaderBytes).toString('hex');
          console.log('Transaction Id ' + txnSignature);

          // Create the transaction
          const transaction = protobuf.Transaction.create({
            header: transactionHeaderBytes,
            headerSignature: txnSignature,
            payload: payloadBytes
          });

          // Batch the transactions and encode a batch header
          const transactions = [transaction];
          const batchHeaderBytes = protobuf.BatchHeader.encode({
            signerPublicKey: factoryOptions.enclave.publicKey.toString('hex'),
            transactionIds: transactions.map((txn) => txn.headerSignature),
          }).finish();


          // Sign the batch header and create the batch
          const batchSignature = factoryOptions.enclave.sign(batchHeaderBytes).toString('hex');
          const batch = protobuf.Batch.create({
            header: batchHeaderBytes,
            headerSignature: batchSignature,
            transactions: transactions
          });

          // Batch the batches into a batch list
          const batchListBytes = protobuf.BatchList.encode({
            batches: [batch]
          }).finish();

          // Post the batch list
          try {
            // console.log("Submitting the transaction to the verifier")

            const res = await axios({
              method: 'post',
              baseURL: 'http://192.168.99.100:8008',
              url: '/batches',
              headers: {
                'Content-Type': 'application/octet-stream'
              },
              data: batchListBytes
            });
            console.log('Submitted the transaction');
            return [res, txnSignature];
          } catch (e) {
            console.log("error;" + e);
          }
        }
      };
    }
  };
};

module.exports = {
  SawtoothClientFactory
};
