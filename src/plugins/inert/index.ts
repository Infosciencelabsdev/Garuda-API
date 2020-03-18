import { IPlugin, IPluginOptions } from "../interfaces";
import * as Hapi from "hapi";
const Inert = require('inert');

const register = async (server: Hapi.Server, options: IPluginOptions): Promise<void> => {
    try {
        return await server.register(Inert);
    } catch (error) {
        console.log(`Error registering inert plugin: ${error}`);
    }
};

// provision();
export default (): IPlugin => {
    return {
        register,
        info: () => {
            return {
                name: 'Inert',
                version: '1.0.0'
            };
        }
    };
};