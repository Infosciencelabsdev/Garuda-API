var r = require('rethinkdbdash')({
  db: 'explorer'
});

export async function addPropData(payload: any) {
  r.table('PropData')
    .insert(payload)
    .run()
    .then(function (response: any) {
      console.log('Data added to Database');
      return true;
    })
    .error(function (err: Error) {
      console.log('error occurred ', err);
      return false;
    });
}

export async function propList() {
  let rep = await r.table('PropData')
    .pluck('propId')
    .then(function (response: any) {
      // console.log('PropId List ', response);
      return response;
    })
    .error(function (err: Error) {
      console.log('Error when receiving prop list at propList()', err);
      return err;
    });
  let resp: any = [];
  for (let i: any = 0; i < rep.length; i++) {
    if (!resp.includes(rep[i])) {
      resp.push(rep[i]);
    }
  }
  return rep;
}

export async function userList() {
  let rep = await r.table('PropDetails')
    .pluck('owner')
    .distinct()
    .then(function (response: any) {
      // console.log('UserId List ', response)
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
      // console.log('User List is ', userList)
      return userList;
    })
    .error(function (err: Error) {
      console.log('Error when receiving user list at userList()', err);

      return err;
    });
  return rep;
}

export async function addPropDetails(details: any) {
  let txn = details.transactionList;
  let propResp: any = await filterData('PropDetails', {
    certificate: details.certificate
  });
  if (objisEmpty(propResp)) {
    r.table('PropDetails')
      .insert({
        owner: details.owner,
        propId: details.propId,
        certificate: details.certificate,
        contract: details.contract,
        transactionId: txn[txn.length - 1],
        // expired: false
      })
      .run()
      .then(function (response: any) {
        console.log('Data added to Database');
        return true;
      })
      .error(function (err: Error) {
        console.log('error occurred ', err);
        return false;
      });
  } else {
    console.log('Prop Details Data already exists and is not being added again ', propResp);
    return false;
  }
}

export async function getTransactionDetails(filter: any) {
  let resp = r.table('PropDetails')
    .filter(filter)
    .run()
    .then(function (response: any) {
      console.log('Transaction Data', response);
      return response[0];
    })
    .error(function (err: Error) {
      console.log('error occurred ', err);
      return false;
    });
  return resp;
}

export async function getContractDetails(contractId: any) {
  let resp = await r.table('PropDetails')
    .filter(r.row('contract')
      .contains(function (contract: any) {
        return contract.eq(contractId);
      }))
    .run()
    .then(function (response: any) {
      console.log('Contract Data', response);
      return response[0];
    })
    .error(function (err: Error) {
      console.log('error occurred ', err);
      return false;
    });
  return resp;

}
export async function hashIdList(fieldName: any) {
  let resp = await r.table('PropDetails')
    .pluck('certificate', 'contract', 'owner', 'propId', 'transactionId', 'type')
    // .pluck('certificate')
    // .distinct()
    .then(function (response: any) {
      // console.log(fieldName, ' List ', response);
      return response;
    })
    .error(function (err: Error) {
      return err;
    });
  return resp;
}

export async function filterData(dbname: string, filters: any) {
  // filters = payload.data.certificate
  let resp = r.table('PropDetails')
    .filter(filters)
    .run()
    .then(function (response: any) {
      // console.log('RESPONSE ', response)
      return response;
    })
    .error(function (err: Error) {
      console.log('ERROR ', err);
      console.log(err);
      return err;
    });
  return resp;
}

export function objisEmpty(obj: any) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

export async function certList(type:any) {
  let rep = await r.table('PropDetails')
    .pluck(type)
    .then(function (response: any) {
      console.log('Cert List ', response);
      return response;
    })
    .error(function (err: Error) {
      console.log('Error when receiving cert list at certList()', err);
      return err;
    });
    if (!rep) {
      console.log('Here');
      return null;
    }
  let resp: any = [ ];
  for (let i: any = 0; i < rep.length; i++) {
    if (rep[i][type] ) {
      if (!resp.includes(rep[i])) {
        resp.push(rep[i]);
      }
    }
  }
  if (resp.length === 0) {
    return null;
  }
  console.log("REsponse from db", resp);
  return resp;
}