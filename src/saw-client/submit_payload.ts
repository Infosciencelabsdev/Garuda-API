exports.input = {
  submitPayload: async (payload:any, transactor:any) => {
    const txn = payload;
    try {
      const txnRes = await transactor.post(txn);
      if (!txnRes) {
        console.log('No Response');
      }
      console.log({
        status: txnRes[0].status,
        statusText: txnRes[0].statusText
      });
      return txnRes;
    } catch (err) {
      console.log('Error submitting transaction to Sawtooth REST API: ', err);
      console.log('Transaction: ', txn);
    }
  }
};
