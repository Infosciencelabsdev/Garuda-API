const { createTransactor } = require('./transactions/createTransactor');
const { input } = require('./submit_payload');
const fetch = require('node-fetch');

import * as crypto from "crypto";
import { userList, propList, filterData, objisEmpty } from '../database/rethink';
import cbor from 'cbor';


function _hash(x: any): any {
    return crypto.createHash('sha512').update(x).digest('hex').toLowerCase().substring(0, 64);
}

const TP_FAMILY = 'SawExplorer';
const TP_NAMESPACE = _hash(TP_FAMILY).substring(0, 6);

var geturl = 'http://192.168.99.100:8008/state';

export async function submit(newPayload: any, signer: string) {
    console.log('Sending the Payload to input');
    var resp = await input.submitPayload(newPayload, createTransactor(signer));
    return resp;
}

export async function getCurrentState() {
    console.log('Getting the Current State of the Blockchain');
    let geturl = await 'http://192.168.99.100:8008/state';
    let data = await fetch(geturl, {
        method: 'GET'
    })
        .then((response: any) => response.json())
        .then((responseJson: any) => {
            let dataUser = responseJson.data;
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
    let geturl = await 'http://192.168.99.100:8008/state/' + propAddress;
    // console.log('propAddress' , propAddress)
    let data = await fetch(geturl, {
        method: 'GET'
    })
        .then((response: any) => response.json())
        .then((responseJson: any) => {
            let dataUser = responseJson.data;
            console.log('Data ', dataUser);
            let permDetails = Buffer.from(dataUser, 'base64');
            // console.log('data ' , permDetails)

            return cbor.decode(permDetails);
        })
        .catch((error: Error) => {
            console.error(error);
            return error;
        });
    return data;
}

export async function getTxnList() {
    let geturl = 'http://192.168.99.100:8008/transactions';
    let data = await fetch(geturl, {
        method: 'GET'
    })
        .then((response: any) => response.json())
        .then((responseJson: any) => {
            let dataUser = responseJson.data;
            // console.log('Data ', dataUser)
            let permDetails = Buffer.from(dataUser, 'base64');
            // console.log('data ' , permDetails)

            return cbor.decode(permDetails);
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

export async function getPropertyDetails() {
    console.log('Getting the Property Details');
    let resp: any = await propList();
    let propData: any = [];
    for (let i = 0; i < resp.length; i++) {
        let propDetails: any = await getPropertyData(resp[i].propId);
        propData.push(propDetails);
    }
    return propData;
}

export async function getType(id: any) {
    let filData = await filterData('propDetails', { certificate: id });
    if (!objisEmpty(filData)) {
        return 'certificate';
    } else if (!objisEmpty(await filterData('propDetails', { contract: id }))) {
        return 'contract';
    } else if (!objisEmpty(await filterData('propDetails', { propId: id }))) {
        return 'property';
    } else if (!objisEmpty(await filterData('propDetails', { transactionId: id }))) {
        return 'transaction';
    } else {
        return 'user';
    }

}