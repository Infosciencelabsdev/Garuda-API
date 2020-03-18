import * as nconf from 'nconf';
import * as path from 'path';

//Read Configurations
const configs = new nconf.Provider({
  env: true,
  argv: true,
  store: {
    type: 'file',
    file: path.join(__dirname, `./config.${process.env.NODE_ENV || 'dev'}.json`)
  }
});
export interface WalletConfigurations {
  type: string;
  desc: string;
  options: Array<string>;
}
export interface IServerConfigurations {
  port: number;
  plugins: Array<string>;
  jwt: IJWTConfiguration;
  routePrefix: string;
  accessList: Array<string>;
  enableDefaultPasswordForTesting: boolean;
  defaultPasswordForTesting: string;
}

export interface IJWTConfiguration {
  secret: string;
  expiration: string;
  algorithm: string;
  issuer: string;
  audience: string;
}

export interface IDataConfiguration {
  connectionString: string;
  authConnectionString: string;
  username: string;
  password: string;
}

export interface Web3Configuration {
  testnetUrl: string;
  mainnetUrl: string;
  sawtoothUrl: string;
  sawtoothUrl1: string;
  sawtoothAddress: string;
  ethereumAddress: string;
  testnetAddress: string;
}

export interface MsgConfiguration {
  API_KEY: string;
  SENDER_ID: string;
  ROUTE_NO: number;
}

export interface CookieOptions {
  ttl: string; // expires a year from today
  encoding: string;   // we already used JWT to encode
  isSecure: Boolean;     // warm & fuzzy feelings
  isHttpOnly: Boolean;    // prevent client alteration
  clearInvalid: Boolean; // remove invalid cookies
  strictHeader: Boolean;   // don't allow violations of RFC 6265
}

export function getDatabaseConfig(): IDataConfiguration {
  return configs.get('database');
}

export function getServerConfigs(): IServerConfigurations {
  return configs.get('server');
}

// export function getCookieConfigs(): CookieOptions {
//   return configs.get('cookie');
// }

export function getWeb3Config(): Web3Configuration {
  return configs.get('web3');
}

export function getComposerConnectionProfileConfig(): object {
  return configs.get('composer-connection-profile');
}

export function getMsgConfiguration(): MsgConfiguration {
  return configs.get('msg');
}