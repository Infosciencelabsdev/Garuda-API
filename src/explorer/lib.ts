// const { createTransactor } = require('./transactions/createTransactor');
// const { input } = require('./submit_payload');
const fetch = require('node-fetch');
import { env } from "../saw-client/env";

import * as crypto from "crypto";
import { userList, propList, filterData, objisEmpty, getContractDetails, certList } from './db';
// import * as cbor from 'cbor';
const decode = base64Str => {
  return JSON.parse(Buffer.from(base64Str, 'base64').toString());
};
// const {TextEncoder, TextDecoder} = require('text-encoding/lib/encoding');
// var encoder = new TextEncoder('utf8');
// var decoder = new TextDecoder('utf8');

function _hash(x: any): any {
  return crypto.createHash('sha512').update(x).digest('hex').toLowerCase().substring(0, 64);
}

const TP_FAMILY = env.familyName;
const TP_NAMESPACE = env.familyPrefix;

var geturl = 'http://localhost:8008/state';

// export async function submit(newPayload: any, signer: string) {
//   console.log('Sending the Payload to input');
//   var resp = await input.submitPayload(newPayload, createTransactor(signer));
//   return resp;
// }

export async function getCurrentState() {
  console.log('Getting the Current State of the Blockchain');
  let geturl = await 'http://localhost:8008/state';
  let data = await fetch(geturl, {
    method: 'GET'
  })
    .then((response: any) => response.json())
    .then((responseJson: any) => {
      let dataUser = responseJson.data;
      // console.log('Data ', dataUser)
      // let permDetails = Buffer.from(dataUser[0], 'base64')
      // console.log('data ' , permDetails)

      return dataUser;
    })
    .catch((error: Error) => {
      console.error(error);
      return error;
    });
  return data;
}

export async function getPropertyData(propId: any) {
  // console.log('Getting the details of the property', propId)
  let propAddress = TP_NAMESPACE + _hash(propId).slice(-64);
  let geturl = await 'http://localhost:8008/state/' + propAddress;
  console.log('propAddress' , propAddress);
  let data = await fetch(geturl, {
    method: 'GET'
  })
    .then((response: any) => response.json())
    .then((responseJson: any) => {
      let dataUser = responseJson.data;
      // console.log('Data ', dataUser)
      // let permDetails = Buffer.from(dataUser, 'base64');
      // console.log('data ' , permDetails)

      return (decode(dataUser));
    })
    .catch((error: Error) => {
      console.error(error);
      return error;
    });
  return data;
}

export async function getTxnList() {
  let geturl = 'http://localhost:8008/transactions';
  let data = await fetch(geturl, {
    method: 'GET'
  })
    .then((response: any) => response.json())
    .then((responseJson: any) => {
      let dataUser = responseJson.data;
      // console.log('Data ', dataUser)
      let permDetails = Buffer.from(dataUser, 'base64');
      // console.log('data ' , permDetails)

      return JSON.parse(decode(permDetails));
    })
    .catch((error: Error) => {
      console.error(error);
      return error;
    });
  return data;
}

export async function getUserData() {
  console.log('Getting the user list');
  let resp: any = await userList();
  let userData: any = [];
  for (let i = 0; i < resp.length; i++) {
    let userDetails: any = await getPropertyData(resp[i]);
    userDetails.userId = resp[i];
    userData.push(userDetails);
  }
  console.log('User Data', userData);
  return userData;
}

export async function getCertData(type:any) {
  console.log('Getting Certificate List');
  let resp:any = await certList(type);
  if (resp == null) {
    return null;
  }
  let certData: any = [];
  for (let i = 0; i < resp.length; i++) {
    console.log('Getting DEtails of', resp[i][type]);
    let userDetails: any = await getPropertyData(resp[i][type]);
    userDetails[type] = resp[i][type];
    certData.push(userDetails);
  }
  console.log(type, 'Data', certData);
  return certData;
}

export async function getPropertyDetails() {
  console.log('Getting the Property Details');
  let resp: any = await propList();
  console.log('GOT THE RESPONSE', resp);
  let propData: any = [];
  for (let i = 0; i < resp.length; i++) {
    let propDetails: any = await getPropertyData(resp[i].propId);
    propData.push(propDetails);
  }
  console.log('PROP DATA ', propData);
  return propData;
}

export async function getType(id: any) {
  let filData = await filterData('PropDetails', { certificate: id });
  if (!objisEmpty(filData)) {
    return 'certificates';
  } else if (!objisEmpty(await getContractDetails(id))) {
    return 'contracts';
  } else if (!objisEmpty(await filterData('PropDetails', { propId: id }))) {
    return 'properties';
  } else if (!objisEmpty(await filterData('PropDetails', { transactionId: id }))) {
    return 'transactions';
  } else {
    console.log('It is User');
    return 'users';
  }

}

// export async function getCertDetail() {
//   console.log('Getting the Certificate Details');
//   let resp: any = await certList('certificate');
//   console.log('GOT THE RESPONSE', resp);
//   let propData: any = [];
//   for (let i = 0; i < resp.length; i++) {
//     let propDetails: any = await getPropertyData(resp[i].certificate);
//     propData.push(propDetails);
//   }
//   console.log('CERT DATA ', propData);
//   return propData;
// }