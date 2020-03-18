import * as Hapi from "hapi";
import * as Boom from "boom";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import ExplorerController from "./explorer-controller";
const Wreck = require('wreck');
import * as Joi from 'joi';
import { HapiHandler } from './hapiHandler';
var handler = new HapiHandler();

export default function (
    server: Hapi.Server,
    serverConfigs: IServerConfigurations,
    database: IDatabase,
    logger: LoggerInstance
) {
    const explorerController = new ExplorerController(serverConfigs, database, logger);
    server.bind(explorerController);
    server.route({
        method: 'GET',
        path: '/{path}',
        handler: {
            proxy: {
                uri: 'http://localhost:8008/{path}'
            }
        }
    });
    // server.route({
    //     method: 'GET',
    //     path: '/state/{path}',
    //     handler: {
    //         proxy: {
    //             uri: 'http://localhost:8008/state/{path}'
    //         }
    //     }
    // });
    // server.route({
    //     method: 'GET',
    //     path: '/state/limit={limit}/start={start?}/head={head?}',
    //     options: {
    //         auth: false,
    //         tags: ['api', 'state', 'sawtooth'],
    //         description: 'get sawtooth transactions list',
    //     },
    //     handler: {
    //         proxy: {
    //             uri: 'http://localhost:8008/state?limit=10'
    //         }
    //     }
    // });
    server.route({
        method: 'GET',
        path: '/state/limit={limit}/start={start?}/head={head?}',
        options: {
            auth: false,
            tags: ['api', 'state', 'sawtooth'],
            description: 'get sawtooth state list',
        },
        handler: {
            proxy: {
                mapUri: function (request) {
                    let params = request.params;
                    let url = 'http://localhost:8008/state?';
                    if (params.limit && params.start && params.head) {
                        return {
                            uri: 'http://localhost:8008/state?' + 'head=' + params.head + '&start=' + params.start
                                + '&limit=' + params.limit
                        };
                    } else if (params.limit && params.start) {
                        return {
                            uri: 'http://localhost:8008/state?' + 'start=' + params.start
                                + '&limit=' + params.limit
                        };
                    }
                    return {
                        uri: 'http://localhost:8008/state?' + 'limit=' + params.limit
                    };
                },
                onResponse: async (err, res, request, h, settings, ttl) => {
                    const body = await Wreck.read(res);
                    return h.response(body);
                }
            }
        }
    });
    server.route({
        method: 'GET',
        path: '/transactions/limit={limit}/start={start?}/head={head?}',
        options: {
            auth: false,
            tags: ['api', 'transactions', 'sawtooth'],
            description: 'get sawtooth transactions list',
        },
        handler: {
            proxy: {
                mapUri: function (request) {
                    let params = request.params;
                    let url = 'http://localhost:8008/transactions?';
                    if (params.limit && params.start && params.head) {
                        return {
                            uri: 'http://localhost:8008/transactions?' + 'head=' + params.head + '&start=' + params.start
                                + '&limit=' + params.limit
                        };
                    } else if (params.limit && params.start) {
                        return {
                            uri: 'http://localhost:8008/transactions?' + 'start=' + params.start
                                + '&limit=' + params.limit
                        };
                    }
                    return {
                        uri: 'http://localhost:8008/transactions?' + 'limit=' + params.limit
                    };
                },
                onResponse: async (err, res, request, h, settings, ttl) => {
                    const body = await Wreck.read(res);
                    return h.response(body);
                }
                // uri: 'http://localhost:8008/transactions?limit=10'
            }
        }
    });
    
    server.route({
        method: 'GET',
        path: '/state/{id}/{head?}',
        options: {
            auth: false,
            tags: ['api', 'state', 'sawtooth'],
            description: 'get sawtooth address current state',
        },
        handler: {
            proxy: {
                mapUri: function (request) {
                    let params = request.params;
                    let id = params.id;
                    if (id.length === 64) {
                        id = "c4f834".concat(id);
                    }
                    let url = 'http://localhost:8008/state/' + id;
                    if (params.head) {
                        return {
                            uri: url + '?head=' + params.head
                        };
                    }
                    return {
                        uri: url
                    };
                },
                onResponse: async (err, res, request, h, settings, ttl) => {
                    // try {
                    console.log("State object");
                    // console.log(res);
                    const body = await Wreck.read(res);
                    return h.response(body);
                    // } catch (error) {
                    //     return Boom.badRequest(error);
                    // }
                }
            }
        }
    });
    server.route({
        method: 'GET',
        path: '/batches/limit={limit}/start={start?}/head={head?}',
        options: {
            auth: false,
            tags: ['api', 'batches', 'sawtooth'],
            description: 'get sawtooth batches list',
        },
        handler: {
            proxy: {
                mapUri: function (request) {
                    let params = request.params;
                    let url = 'http://localhost:8008/batches?';
                    if (params.limit && params.start && params.head) {
                        return {
                            uri: 'http://localhost:8008/batches?' + 'head=' + params.head + '&start=' + params.start
                                + '&limit=' + params.limit
                        };
                    } else if (params.limit && params.start) {
                        return {
                            uri: 'http://localhost:8008/batches?' + 'start=' + params.start
                                + '&limit=' + params.limit
                        };
                    }
                    return {
                        uri: 'http://localhost:8008/batches?' + 'limit=' + params.limit
                    };
                },
                onResponse: async (err, res, request, h, settings, ttl) => {
                    const body = await Wreck.read(res);
                    return h.response(body);
                }
                // uri: 'http://localhost:8008/transactions?limit=10'
            }
        }
    });
    // server.route({
    //     method: 'GET',
    //     path: '/batches/limit={limit}/start={start?}/head={head?}',
    //     handler: {
    //         proxy: {
    //             uri: 'http://localhost:8008/batches?limit=10'
    //         }
    //     }
    // });
    server.route({
        method: 'GET',
        path: '/batches/{id}',
        options: {
            auth: false,
            tags: ['api', 'sawtooth'],
            description: 'get sawtooth blocks list',
        },
        handler: {
            proxy: {
                uri: 'http://localhost:8008/batches/{id}'
            }
        }
    });
    server.route({
        method: 'GET',
        path: '/blocks/limit={limit}/start={start?}/head={head?}',
        options: {
            auth: false,
            tags: ['api', 'blocks', 'sawtooth'],
            description: 'get sawtooth blocks list',
        },
        handler: {
            proxy: {
                mapUri: function (request) {
                    let params = request.params;
                    let url = 'http://localhost:8008/blocks?';
                    if (params.limit && params.start && params.head) {
                        return {
                            uri: 'http://localhost:8008/blocks?' + 'head=' + params.head + '&start=' + params.start
                                + '&limit=' + params.limit
                        };
                    } else if (params.limit && params.start) {
                        return {
                            uri: 'http://localhost:8008/blocks?' + 'start=' + params.start
                                + '&limit=' + params.limit
                        };
                    }
                    return {
                        uri: 'http://localhost:8008/blocks?' + 'limit=' + params.limit
                    };
                },
                onResponse: async (err, res, request, h, settings, ttl) => {
                    const body = await Wreck.read(res);
                    return h.response(body);
                }
                // uri: 'http://localhost:8008/transactions?limit=10'
            }
        }
    });
    server.route({
        method: 'GET',
        path: '/blocks/{id}',
        options: {
            auth: false,
            tags: ['api', 'blocks', 'sawtooth'],
            description: 'get sawtooth blocks list',
        },
        handler: {
            proxy: {
                uri: 'http://localhost:8008/blocks/{id}'
            }
        }
    });
    server.route({
        method: 'GET',
        path: '/subscriptions',
        options: {
            auth: false,
            tags: ['api', 'subscriptions', 'sawtooth'],
            description: 'get sawtooth subscriptons',
        },
        handler: {
            proxy: {
                uri: 'http://localhost:8008/subscriptions'
            }
        }
    });
    // server.route({
    //     method: 'GET',
    //     path: '/search/{keyword}',
    //     handler: explorerController.search,
    //     options: {
    //         auth: false,
    //         tags: ['api', 'search', 'sawtooth'],
    //         description: 'Search trx, assets, blocks, batches ',
    //         validate: {
    //             params: {
    //                 keyword: Joi.string().required().trim(),
    //             }
    //         },
    //         plugins: {
    //             'hapi-swagger': {
    //                 responses: {
    //                     '200': {
    //                         'description': 'Retrieved.'
    //                     },
    //                     '401': {
    //                         'description': 'Invalid search.'
    //                     },
    //                     '400': {
    //                         'description': 'String not found'
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // });
    server.route({
        method: 'GET',
        path: '/state/change/{address}/{head}',
        handler: explorerController.getStateChanges,
        options: {
            auth: false,
            tags: ['api', 'search', 'sawtooth'],
            description: 'Get state changes for address',
            validate: {
                params: {
                    address: Joi.string().required().trim(),
                    head: Joi.string().required().trim(),
                }
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Retrieved.'
                        },
                        '401': {
                            'description': 'Invalid search.'
                        },
                        '400': {
                            'description': 'String not found'
                        }
                    }
                }
            }
        }
    });
    server.route({
        method: 'GET',
        path: '/explorer/{resource}/page={page}',
        options: {
            validate: {
                params:{
                    resource: Joi.string().required(),
                    page: Joi.number().required(),
                    // start: Joi.number().optional(),
                    // head: Joi.number().optional(),
                }
            },
            auth: false,
            tags: ['api', 'transactions', 'sawtooth'],
            description: 'get sawtooth properties,users, contracts list',
        },
        handler: explorerController.getResourceList
    });
    server.route({
        method: 'GET',
        path: '/{resource}/id={id}',
        options: {
            validate: {
                params:{
                    resource: Joi.string().required(),
                    id: Joi.number().required(),
                }
            },
            auth: false,
            tags: ['api', 'transactions', 'sawtooth'],
            description: 'get sawtooth properties,users, contracts by id',
        },
        handler: explorerController.getAll
    });

    server.route({
        method: ['GET', 'POST'],
        path: '/users/{id?}',
        options: {
          // handler: handler.login(),
          handler: async (request: Hapi.Request, h:any) => {
            const resp = await handler.getUserDetails(request);
            return resp;
          },
          auth: false,
          description: 'Data is created',
          notes: 'If displayed without error, user is created successfully',
          tags: ['api', 'view']
        }
      });

      server.route({
        method: ['GET', 'POST'],
        path: '/properties/{id?}',
        options: {
          // handler: handler.login(),
          handler: async (request: Hapi.Request, h:any) => {
            const resp = await handler.getPropDetails(request);
            return resp;
          },
          auth: false,
          description: 'Data is created',
          notes: 'If displayed without error, user is created successfully',
          tags: ['api', 'view']
        }
      });

      server.route({
        method: ['GET', 'POST'],
        path: '/certificates/{id?}',
        options: {
          // handler: handler.login(),
          handler: async (request: Hapi.Request, h:any) => {
            const resp = await handler.getCertDetails(request);
            return resp;
          },
          auth: false,
          description: 'Data is created',
          notes: 'If displayed without error, user is created successfully',
          tags: ['api', 'view']
        }
      });

      server.route({
        method: ['GET', 'POST'],
        path: '/contracts/{id?}',
        options: {
          // handler: handler.login(),
          handler: async (request: Hapi.Request, h:any) => {
            const resp = await handler.getContractDetails(request);
            return resp;
          },
          auth: false,
          description: 'Data is created',
          notes: 'If displayed without error, user is created successfully',
          tags: ['api', 'view']
        }
      });

      server.route({
        method: ['GET', 'POST'],
        path: '/transactions/{id?}',
        options: {
          // handler: handler.login(),
          handler: async (request: Hapi.Request, h:any) => {
            const resp = await handler.getTxnDetails(request);
            return resp;
          },
          auth: false,
          description: 'Data is created',
          notes: 'If displayed without error, user is created successfully',
          tags: ['api', 'view']
        }
      });

      server.route({
        method: ['GET', 'POST'],
        path: '/search/{id}',
        options: {
          // handler: handler.login(),
          handler: async (request: Hapi.Request, h: any) => {
            const resp = await handler.getSearchDetails(request);
            return resp;
          },
          auth: false,
          description: 'Data is created',
          notes: 'If displayed without error, user is created successfully',
          tags: ['api', 'view']
        }
      });

}
