const HDWallet = require('truffle-hdwallet-provider');
const infuraKey = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
//
const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();
const SethProvider = require('truffle-sawtooth-seth-provider');

module.exports = {
  /**
   * Networks define how you connect to your ethereum client or virtual machine and let you set the
   * defaults web3 uses to send transactions.
   * $ truffle test --network <network-name>
   */

  networks: {
    test: {
      provider: function () {
        return new HDWallet(mnemonic, new SethProvider('http://localhost:3030'));
      },
      network_id: "*",
      gas: 4500000,
      gasPrice: 10000000000,
    },
    rinkeby: {
      provider: function () {
        return new HDWallet(mnemonic, "https://*******.v3/" + infuraKey);
      },
      network_id: "*",
      gas: 4500000,
      gasPrice: 10000000000,
    },
    sawtooth: {
      network_id: "*",
      host: "http://***.**.**.***",
      port: 3030,
      gas: 4612388
    },
    seth: {
      provider: new SethProvider('http://***.**.**.***:8008'),
      network_id: "*" // Match any network id,
      // from: "0x3A19563FC172fA8bf61D8d70465C51EE758B3494"
    }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      // version: "0.5.1",    // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    }
  }
}