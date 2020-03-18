import { createContext, CryptoFactory } from 'sawtooth-sdk/signing';

const context = createContext('secp256k1');


const privateKey = context.newRandomPrivateKey();
const signer = CryptoFactory(context).newSigner(privateKey);


export async function createSawtoothAccount() {
    const privateKey = context.newRandomPrivateKey();
    return privateKey;
}
import { randomBytes, createHash } from 'crypto';
// import * as axios from 'axios';
import { protobuf } from "sawtooth-sdk/protobuf";
// // const {
// //     randomBytes,
// //     createHash
// // } = require('crypto');
const axios = require('axios');
const cbor = require('cbor');
// // const protobuf = require('sawtooth-sdk/protobuf');
const {
    TextEncoder,
    TextDecoder
} = require('text-encoding/lib/encoding');
var encoder = new TextEncoder('utf8');
var decoder = new TextDecoder('utf8');

const leafHash = (input, length) => {
    return createHash('sha512').update(input).digest('hex').toLowerCase().slice(0, length);
};

const SawtoothClientFactory = (factoryOptions) => {
    return {
        async get(url) {
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
        newTransactor(transactorOptions) {
            const _familyNamespace = transactorOptions.familyNamespace || leafHash(transactorOptions.familyName, 6);
            const _familyVersion = transactorOptions.familyVersion || '1.0';
            const _familyEncoder = encoder;
            return {
                async post(payload, txnOptions) {
                    const payloadBytes = encoder.encode(payload);

                    // Encode a transaction header
                    const transactionHeaderBytes = protobuf.TransactionHeader.encode({
                        familyName: transactorOptions.familyName,
                        familyVersion: _familyVersion,
                        inputs: [_familyNamespace],
                        outputs: [_familyNamespace],
                        signerPublicKey: factoryOptions.enclave.publicKey.toString('hex'),
                        batcherPublicKey: factoryOptions.enclave.publicKey.toString('hex'),
                        dependencies: [],
                        nonce: randomBytes(32).toString('hex'),
                        payloadSha512: createHash('sha512').update(payloadBytes).digest('hex'),
                        ...txnOptions // overwrite above defaults with passed options
                    }).finish();
                    // console.log(transactionHeaderBytes)

                    // Sign the txn header. This signature will also be the txn address
                    const txnSignature = factoryOptions.enclave.sign(transactionHeaderBytes).toString('hex');
                    console.log("Transaction id:  " + txnSignature);
                    // console.log("sawtooth transaction show --url http://rest-api:8008 {transaction-id}\n")
                    // console.log("The above command will display the details about the transaction");
                    // Create the transaction
                    const transaction = protobuf.Transaction.create({
                        header: transactionHeaderBytes,
                        headerSignature: txnSignature,
                        payload: payloadBytes
                    });
                    // console.log(transaction);
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
                    // console.log("Batch Signature : "+ batchSignature);

                    // Batch the batches into a batch list
                    const batchListBytes = protobuf.BatchList.encode({
                        batches: [batch]
                    }).finish();

                    // Post the batch list
                    try {

                        console.log("This is from sawtooth-client.js");
                        const res = await axios({
                            method: 'post',
                            baseURL: factoryOptions.restApiUrl,
                            url: '/batches',
                            headers: {
                                'Content-Type': 'application/octet-stream'
                            },
                            data: batchListBytes
                        });
                        // console.log("res " + res)
                        return [res, txnSignature];
                    } catch (err) {
                        console.log('error', err);
                    }
                }
            };
        }
    };
};

module.exports = {
    leafHash,
    SawtoothClientFactory
};

