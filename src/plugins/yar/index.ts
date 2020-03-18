import { IPlugin, IPluginOptions } from "../interfaces";
import * as Hapi from "hapi";
const yar = require('yar');
let options = {
    storeBlank: false,
    // cookieOptions: {
    //     password: 'the-password-must-be-at-least-32-characters-long',
    //     isSecure: false,
    //     ignoreErrors: false,
    //     ttl: 24 * 102401
    //  },
    //  cache: {
    //     cache: 'mongoCache',
    //     expiresIn: 24 * 60 * 60 * 1000,
    //     segment: 'session'
    // },
    cookieOptions: {
        password: 'secretTobeKEPTsecretvfsglobesdcmdkkcx',
        isSecure: false,
        clearInvalid: true,
        ttl: 24 * 60 * 60 * 1000
    }
};
const register = async (server: Hapi.Server): Promise<void> => {
    try {
        return await server.register({ plugin: yar, options: options });
    } catch (error) {
        console.log(`Error registering yar plugin: ${error}`);
    }
};

// provision();
export default (): IPlugin => {
    return {
        register,
        info: () => {
            return {
                name: 'Cache and Yar session manager',
                version: '1.0.0'
            };
        }
    };
};