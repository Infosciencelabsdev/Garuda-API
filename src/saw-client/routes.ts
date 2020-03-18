import * as Hapi from "hapi";
import Controller from "./sawtooth-controller";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import * as Joi from 'joi';
import { jwtValidator } from "../auth/auth-validator";
export default function (
    server: Hapi.Server,
    serverConfigs: IServerConfigurations,
    database: IDatabase,
    logger: LoggerInstance
) {
    const controller = new Controller(serverConfigs, database, logger);
    server.bind(controller);
    server.route({
        method: 'GET',
        path: '/state/address={address}',
        handler: controller.getState,
        options: {
            auth: 'jwt',
            tags: ['api', 'state'],
            description: 'Get address state.',
            validate: {
                headers: jwtValidator,
                params: {
                    address: Joi.string().required(),
                }
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'State'
                        },
                        '401': {
                            'description': 'State address not found.'
                        }
                    }
                }
            }
        }
    });
}
