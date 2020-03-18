import { getPropertyData, getUserData, getPropertyDetails, getType, getCertData } from './lib';
import { getTransactionDetails, hashIdList, getContractDetails } from './db';

export class HapiHandler {

  home(): any {
    return { name: 'Home Page' };
  }

  async getUserDetails(request?:any) {
    if (request.params.id) {
      let propDetails = await getPropertyData(request.params.id);
  propDetails['userId'] = request.params.id;

      return {data: propDetails};
    }
    let userIds = await getUserData();
    return { data: userIds};
  }

  async getPropDetails(request?:any) {
    if (request.params.id) {
      let propDetails = await getPropertyData(request.params.id);
      return { data: propDetails };
    }
    let propNames = await getPropertyDetails();
    return { data: propNames };
  }

  async getCertDetails(request:any) {
    if (request.params.id) {
      console.log('Getting the specific certificate details');
      // let certDetails = await getCertDetails({ certificate: request.params.id})
      let certDetails = await getPropertyData(request.params.id);

      return { data :certDetails };
    }
    let certNames = await getCertData('certificate');
    if (certNames == null ) {
      return { data: [] };
      } else {
        return { data: certNames };
      }
  }

  async getContractDetails(request?:any) {
    if (request.params.id) {
      let contractDetails = await getPropertyData(request.params.id);
      return {data: contractDetails};
    }
    let contractNames = await getCertData('contract');
    if (contractNames == null ) {
    return {data: [ ] };
    } else {
      return { data: contractNames };
    }
  }

  async getTxnDetails(request:any) {
    if (request.params.id) {
      let txnDetails = await getTransactionDetails({ transactionId: request.params.id});
      return {data: txnDetails};
    }
    let contractNames = await hashIdList('Transaction');
    return {data: contractNames};
  }

  async getSearchDetails(request?:any) {
    let idType = await getType(request.params.id);
    return {type: idType, id: request.params.id};
  }

}

