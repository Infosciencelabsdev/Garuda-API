// import { env } from "../saw-client/env";
import { sha256 } from 'js-sha256';

export const r = require('rethinkdbdash')({
    // port: env.rethinkPort,
    // host: env.rethinkUrl,
    db: 'explorer'
});
const tables = [
    "Property",
    "Certificate",
    "Contract",
    "Transaction",
    "User",
    "PropData",
    "PropDetails"
];
for (const table of tables) {
    r.tableList().contains(table)
        .do(function (tableExists) {
            return r.branch(
                tableExists,
                { tables_created: 0 },
                r.tableCreate(table)
            );
        }).run();
}

export async function addDataToDB(tableName, payload: any) {
    r.table(tableName)
        .insert(payload)
        .run()
        .then(function (response: any) {
            return response;
        })
        .error(function (err: Error) {
            return err;
        });
}

export async function addPropData(payload: any) {
    r.table('PropData')
        .insert(payload)
        .run()
        .then(function (response: any) {
            console.log('Data added to  PropData Database');
            return true;
        })
        .error(function (err: Error) {
            console.log('error occurred ', err);
            return true;
        });
}

export async function propList() {
    let rep = await r.table('PropData')
        .pluck('propId')
        .then(function (response: any) {
            console.log('PropId List ', response);
            return response;
        })
        .error(function (err: Error) {
            return err;
        });
    return rep;
}

export async function userList() {
    let rep = await r.table('PropDetails')
        .pluck('owner')
        .distinct()
        .then(function (response: any) {
            console.log('UserId List ', response);
            let userList: any = [];
            for (let i = 0; i < response.length; i++) {
                if (typeof response[i].owner !== "string") {
                    for (let j = 0; j < response[i].owner.length; j++) {
                        if (!userList.includes(response[i].owner[j])) {
                            userList.push(response[i].owner[j]);
                        }
                    }
                } else if (typeof response[i].owner === "string") {
                    if (!userList.includes(response[i].owner)) {
                        userList.push(response[i].owner);
                    }
                } else {
                    console.log('The type should be string or object, not ', typeof response[i].owner);
                }
            }
            console.log('User List is ', userList);
            return userList;
        })
        .error(function (err: Error) {
            return err;
        });
    return rep;
}

export async function addPropDetails(details: any) {
    // let txn = details.transactionList;
    // let propResp: any = await filterData('PropDetails', {
    //     transactionId: details.transactionId
    // });
    // if (objisEmpty(propResp)) {
    //     r.table('PropDetails')
    //         .insert({
    //             owner: details.owner,
    //             propId: details.propId,
    //             certificate: details.certificate,
    //             contract: details.contract,
    //             transactionId: details.transactionId,
    //             expired: false
    //         })
    //         .run()
    //         .then(function (response: any) {
    //             console.log('Data added to Database');
    //             return true;
    //         })
    //         .error(function (err: Error) {
    //             console.log('error occurred ', err);
    //             return false;
    //         });
    // } else {
    //     console.log('Data already exists and is not being added again ', propResp);
    //     return false;
    // }
    let resp = await r.table('PropDetails')
        .insert({
            primId: sha256(details.transactionId),
            owner: details.owner || details.buyer,
            propId: details.propId,
            certificate: details.certificate,
            contract: details.contract,
            transactionId: details.transactionId,
            expired: false
        })
        .run()
        .then(function (response: any) {
            console.log('Data added to PropDetails Database');
            return true;
        })
        .error(function (err: Error) {
            console.log('error occurred ', err);
            return true;
        });
    return resp;
}

export async function getHashDetails(filter: any) {
    r.table('PropDetails')
        .filter(filter)
        .run()
        .then(function (response: any) {
            console.log('Certificate Data', response);
            return response[0];
        })
        .error(function (err: Error) {
            console.log('error occurred ', err);
            return false;
        });
}

export async function hashIdList(fieldName: any) {
    let resp = await r.table('PropDetails')
        .pluck('certificate', 'contract', 'owner', 'propId', 'transactionId')
        // .pluck('certificate')
        // .distinct()
        .then(function (response: any) {
            console.log(fieldName, ' List ', response);
            return response;
        })
        .error(function (err: Error) {
            return err;
        });
    return resp;
}

export async function filterData(dbname: string, filters: any) {
    r.table(dbname)
        .filter(filters)
        .run()
        .then(function (response: any) {
            return response;
        })
        .error(function (err: Error) {
            console.log(err);
            return err;
        });
}

export function objisEmpty(obj: any) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}

export function updatePropData(data: any) {
    let resp = r.table("PropData").get(data.propId).replace({
        propId: data.propId,
        certificate: data.certificate,
        contract: data.contract,
        owner: data.owner || data.buyer,
        transactionId: data.transactionId,
        transactionList: data.transactionList
    })
        .run()
        .then(function (response: any) {
            // console.log('Data updated in Prop Data');
            return true;
        })
        .error(function (err: Error) {
            console.log(err);
            return true;
        });
        return resp;
}