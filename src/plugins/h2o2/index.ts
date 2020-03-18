import { IPlugin } from '../interfaces';
import * as Hapi from 'hapi';

const register = async (server: Hapi.Server): Promise<void> => {
  try {
    return await server.register({ plugin: require('h2o2') });
  } catch (err) {
    console.log(`Error registering logger plugin: ${err}`);
    throw err;
  }
};

export default (): IPlugin => {
  return {
    register,
    info: () => {
      return {
        name: 'h2o2',
        version: '1.0.0'
      };
    }
  };
};
