import * as Hapi from "hapi";
import Web3Controller from "./web3-controller";
import * as Web3Validator from "./web3-validator";
import { IDatabase } from "../database/database";
import { IServerConfigurations, Web3Configuration } from "../configurations";
import { LoggerInstance } from 'winston';
import { jwtValidator } from '../auth/auth-validator';

export default function (
    server: Hapi.Server,
    serverConfigs: IServerConfigurations,
    database: IDatabase,
    logger: LoggerInstance
) {
    const passportController = new Web3Controller(server, serverConfigs, database, logger );
    server.bind(passportController);

    // server.route({
    //     method: 'POST',
    //     path: '/compile',
    //     handler: passportController.compileContract,
    //     options: {
    //         auth: 'jwt',
    //         tags: ['contract'],
    //         description: 'Compile contract and store artificats',
    //         plugins: {
    //             'hapi-swagger': {
    //                 responses: {
    //                     '200': {
    //                         'description': 'Compiled successfully'
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // });
}
