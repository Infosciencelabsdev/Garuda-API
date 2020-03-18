import * as Hapi from "hapi";
import WalletController from "./wallet-controller";
import * as WalletValidator from "./wallet-validator";
import { IDatabase } from "../database/database";
import { IServerConfigurations, Web3Configuration } from "../configurations";
import { LoggerInstance } from 'winston';
import { jwtValidator } from '../auth/auth-validator';
import * as Joi from "joi";

export default function (
    server: Hapi.Server,
    serverConfigs: IServerConfigurations,
    database: IDatabase,
    logger: LoggerInstance) {
    const walletController = new WalletController(server, serverConfigs, database, logger);
    server.bind(walletController);

//     server.route({
//         method: 'POST',
//         path: '/user/wallet',
//         handler: walletController.createWallet,
//         options: {
//             auth: 'jwt',
//             tags: ['api', 'passports'],
//             description: 'Create new wallet',
//             validate: {
//                 payload: WalletValidator.createWallet
//             },
//             plugins: {
//                 'hapi-swagger': {
//                     responses: {
//                         '200': {
//                             'description': 'User Registered successfully'
//                         }
//                     }
//                 }
//             }
//         }
//     });
//     server.route({
//         method: 'GET',
//         path: '/user/wallet',
//         handler: walletController.getWallet,
//         options: {
//             auth: 'jwt',
//             tags: ['api', 'passports'],
//             description: 'Get user wallet.',
//             plugins: {
//                 'hapi-swagger': {
//                     responses: {
//                         '200': {
//                             'description': 'User Registered successfully'
//                         }
//                     }
//                 }
//             }
//         }
//     });
//     server.route({
//         method: 'POST',
//         path: '/wallet',
//         handler: walletController.getWallet,
//         options: {
//             auth: false,
//             tags: ['api', 'passports'],
//             description: 'Create a wallet for user.',
//             validate: {
//                 payload: WalletValidator.getWallet
//             },
//             plugins: {
//                 'hapi-swagger': {
//                     responses: {
//                         '200': {
//                             'description': 'User Registered successfully'
//                         }
//                     }
//                 }
//             }
//         }
//     });
//     server.route({
//         method: 'POST',
//         path: '/wallet/balance',
//         handler: walletController.getWalletBalance,
//         options: {
//             auth: 'jwt',
//             tags: ['api', 'wallet'],
//             description: 'Get balance of user wallet/account',
//             validate: {
//                 payload: {
//                     password: Joi.string().required()
//                 }
//             },
//             plugins: {
//                 'hapi-swagger': {
//                     responses: {
//                         '200': {
//                             'description': 'Balance retrieved successfully.'
//                         }
//                     }
//                 }
//             }
//         }
//     });
//     server.route({
//         method: 'Get',
//         path: '/wallet/request/balance',
//         handler: walletController.requestBalance,
//         options: {
//             auth: 'jwt',
//             tags: ['api', 'wallet'],
//             description: 'Request balance for testnet account',
//             validate: {
//                 headers: jwtValidator,
//             },
//             plugins: {
//                 'hapi-swagger': {
//                     responses: {
//                         '200': {
//                             'description': 'Balance retrieved successfully.'
//                         }
//                     }
//                 }
//             }
//         }
//     });
}
