'use strict';

import * as cbor from 'cbor';
const CBOR = require("cbor-sync");
// var sortJSON = require("./jsonObjSort.js");

import { addPropData, addPropDetails, updatePropData } from '../database/rethink';
const {TextEncoder, TextDecoder} = require('text-encoding/lib/encoding');
var encoder = new TextEncoder('utf8');
var decoder = new TextDecoder('utf8');

const _setEntry = (context: any, address: string, stateValue: any) => {
  // let stateArray = sortJSON.arraySort(stateValue);
  let entries = {
    [address]: encoder.encode(JSON.stringify(stateValue))
  };
  // console.log('ENtries', stateArray);
  // console.log('................');
  return context.setState(entries);
};

export const createProp = (context: any, propAddress: string, payload: any, userAddress: any, certAddress: any) => async (possibleAddressValues: any) => {

  let stateValueRep = await context.getState([propAddress]);
  let propValue = stateValueRep[propAddress];
  let entriestest:any = {};
  let entries:any = {};
  stateValueRep = propValue;
  let propData: any = {};
  payload.data.certificate = null;
  payload.data.contract = null;

  if (stateValueRep == null || stateValueRep === '' || stateValueRep.length === 0) {
    propData = payload.data;
    propData.transactionList.push(payload.data.transactionId);
  } else {
    return false;
  }
  addPropData(payload.data);
  addPropDetails(payload.data);
  entriestest[propAddress] = propData;
  _setEntry(context, propAddress, propData);

  for (let i = 0; i < userAddress.length; i++) {
    let userAdd = userAddress[i];
    stateValueRep = await context.getState([userAdd]);
    let userValue = stateValueRep[userAdd];
    let userData: any = {};

    if (stateValueRep == null || stateValueRep === '' || userValue.length === 0) {
      userData['propIdList'] = [];
      userData['transIds'] = [];
      userData['transIds'].push(payload.data.transactionId);
      userData['propIdList'].push(payload.data.propId);

      userData['certList'] = [];
      userData['contractList'] = [];
    } else {
      let data: any = (JSON.parse((decoder.decode(userValue))));
    console.log('USERDATA', data);

      data['propIdList'].push(payload.data.propId);

      let transList = payload.data.transactionList;
      data['transIds'].push(transList[transList.length - 1]);

      userData = data;
    }
  entriestest[userAdd] = userData;
  entries = {
    [entriestest[0]] : 'a'
  };
    _setEntry(context, userAdd, userData);
  }

  return true;
};

export const createCert = (context: any, propAddress: any, payload: any, userAddress: any, certAddress: any) => async (possibleAddressValues: any) => {

  let propStateValue = await context.getState([propAddress]);
  let propData =  (JSON.parse(decoder.decode(propStateValue[propAddress])));

  if (propData == null || propData === '') {
    console.log('There is no property to confirm');
    console.log('\n ------------------------------------------------------------------------------------------- ');
    return false;
  } else {
    propData.certificate = payload.data.certificate;
    propData.transactionList.push(payload.data.transactionId);
  }
  _setEntry(context, propAddress, propData);

  for (let i = 0; i < userAddress.length; i++) {
    let userAdd = userAddress[0];
    let userStateValue = await context.getState([userAdd]);

    let userData =  (JSON.parse(decoder.decode(userStateValue[userAdd])));
    console.log('USERDATA', userData);
    if (userData == null || userData === '') {
      propData = payload.data;
      return false;
    } else {
      userData.transIds.push(payload.data.transactionId);
      userData.certList.push(payload.data.certificate);
    }
    _setEntry(context, userAdd, userData);
  }
  updatePropData(propData);
  payload.data.contract = null;
  addPropDetails(payload.data);

  propData.valid = true;
  return _setEntry(context, certAddress, propData);

};

export const transferProp = (context: any, propAddress: any, payload: any, userAddress: any, certAddress: any, newOwnerAddress: any, contractAddress: any) => async (possibleAddressValues: any) => {

  let propStateValue = await context.getState([propAddress]);
  let cert: any;
  if (propStateValue[propAddress] == null || propStateValue[propAddress] === '') {
    return false;
  } else {
    let propData =  (JSON.parse(decoder.decode(propStateValue[propAddress])));
    cert = propData.certificate;
    if (!propData['prevOwnerList']) {
      propData['prevOwnerList'] = [];
    }
    propData.prevOwnerList.push(propData.owner);

    if (!propData['prevCertList']) {
      propData['prevCertList'] = [];
    }
    propData.prevCertList.push(propData.certificate);

    if (!propData['prevContractList']) {
      propData['prevContractList'] = [];
    }
    if (propData.contract) {
      propData.prevContractList.push(propData.contract);
    }

    propData.certificate = payload.data.certificate;
    propData.transactionList.push(payload.data.transactionId);
    propData.contract = payload.data.contract;
    propData.owner = payload.data.buyer;

    _setEntry(context, propAddress, propData);
    updatePropData(payload.data);
    addPropDetails(payload.data);
  }

  for (let i = 0; i < userAddress.length; i++) {
    let userData: any = {};
    let userAddr = userAddress[i];
    let userStateValue = await context.getState([userAddr]);

    if (userStateValue[userAddr] == null || userStateValue[userAddr] === '') {
      console.log('User does not contain any properties to transfer');
      return false;
    } else {
      let data =  (JSON.parse(decoder.decode(userStateValue[userAddr])));

      if (!data['prevProperties']) {
        data['prevProperties'] = [];
      }
      data['prevProperties'].push(payload.data.propId);

      let propIndex = data['propIdList'];
      var index = propIndex.indexOf(payload.data.propId);
      if (index > -1) {
        console.log('DELETING FROM PROP LIST');
        data['propIdList'].splice(index, 1);
      }

      if (!data['prevCertList']) {
        data['prevCertList'] = [];
      }
      data['prevCertList'].push(data.certList[index]);

      let certIndex = data['certList'];
      index = certIndex.indexOf(cert);
      if (index > -1) {
        console.log('DELETING FROM CERT LIST');
        data['certList'].splice(index, 1);
      }

      data['transIds'].push(payload.data.transactionId);

      if (!data['contractList']) {
        data['contractList'] = [];
      }
      data['contractList'].push(payload.data.contract);
      userData = data;
      _setEntry(context, userAddr, userData);
    }
  }

  let sellerData: any = {};
  let userAddr = newOwnerAddress;
  let userStateValue = await context.getState([userAddr]);

  if (userStateValue[userAddr] == null || userStateValue[userAddr] === '' || !(userStateValue[userAddr].length > 0)) {
    sellerData['propIdList'] = [];
    sellerData['propIdList'].push(payload.data.propId);

    sellerData['transIds'] = [];
    sellerData['transIds'].push(payload.data.transactionId);

    sellerData['certList'] = [];
    sellerData['certList'].push(payload.data.certificate);

    sellerData['contractList'] = [];
    sellerData['contractList'].push(payload.data.contract);

    _setEntry(context, userAddr, sellerData);
  } else {
    let data =  (JSON.parse(decoder.decode(userStateValue[userAddr])));
    data['propIdList'].push(payload.data.propId);

    let transList = payload.data.transactionList;
    data['transIds'].push(payload.data.transactionId);

    data['certList'].push(payload.data.certificate);
    data['contractList'].push(payload.data.contract);

    _setEntry(context, userAddr, data);

  }
  let certData: any = {
    propId: payload.data.propId,
    owner: payload.data.buyer,
    transactionId: payload.data.transactionId,
    certificate: payload.data.certificate,
    contract: payload.data.contract,
    valid: true,
    timestamp: payload.data.timestamp
  };
  _setEntry(context, certAddress, certData);

  certData.buyer = payload.data.buyer;
  certData.seller = payload.data.seller;
  return _setEntry(context, contractAddress, certData);

};