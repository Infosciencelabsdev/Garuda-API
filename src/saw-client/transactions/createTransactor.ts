// const getKeys = require('../../wallet/keys')
const { EnclaveFactory } = require('./enclave');
const { SawtoothClientFactory } = require('./submit_transactions');
import {env} from '../env';
const FAMILY_NAME = 'Saw_Explorer';
const VERSION = '1.0';
const VALIDATOR = 'http://192.168.99.100:8008';

// var keys = getKeys.keys

exports.createTransactor = (privateKey) => {
  // create the keys file with users and private key/public key
  const enclave = EnclaveFactory(Buffer.from(privateKey, 'hex'));

  const client = SawtoothClientFactory({
    enclave: enclave,
    restApiUrl: env.restApiUrl
  });

  return client.newTransactor({
    familyName: env.familyName,
    familyVersion: env.familyVersion
  });
};
