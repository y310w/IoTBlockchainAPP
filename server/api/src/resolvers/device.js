import { ApolloError } from 'apollo-server';
import { checkDeviceExists, queryDevice } from '../models/device';

export default {
    Query: {
        devices: async (parent) => {
            return await queryDevice("{\"selector\": {}}");
        },

        device: async (parent, { serial }) => {
            return await queryDevice("{\"selector\": {\"serial\": ${serial}}}");
        },
    },

    Mutation: {
        addDevice: async (parent, { name, serial, ipAddress }, { models }) => {
            if (checkDeviceExists(serial, ipAddress)) {
                throw new ApolloError(`Device with the serial: ${serial} or ipAddress: ${ipAddress} already exists`);
            } 

            const addDevice = new models.Device(name, serial, ipAddress);

            try {
                addDevice.validate();

                await addDevice.save();
                
                return addDevice;
            } catch (err) {
                throw new ApolloError(err);
            }
        },

        setValue: async (parent, { serial, value }) => {
            let defined = false;
            let updateDevice = queryDevice("{\"selector\": {\"serial\": serial}}");

            if (updateDevice) {
                updateDevice.value = value;
                await updateDevice.save();
                defined = true;
            }

            return defined;
        },

        deleteDevice: async (parent, { serial }) => {
            let deleted = false;
            let deleteDevice = queryDevice("{\"selector\": {\"serial\": serial}}");
            
            if (deleteDevice) {
                deleteDevice.remove();
                deleted = true;
            }

            return deleted;
        },
    },
};