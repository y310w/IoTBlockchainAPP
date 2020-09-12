import { ApolloError } from 'apollo-server';
import { checkDeviceExists, queryDevice } from '../models/device';
import { updateLinkages  } from '../models/linkage';

export default {
    Query: {
        devices: async (parent) => {
            return await queryDevice("{\"selector\": {}}");
        },

        device: async (parent, { serial }) => {
            return await queryDevice(`{\"selector\": {\"serial\": \"${serial}\"}}`);
        },

        historyDevice: async (parent, { serial }) => {
            let device = await queryDevice(`{\"selector\": {\"serial\": \"${serial}\"}}`);
            
            if (device) {
                return await device.history();
            } else {
                return [];
            }
        },
    },

    Mutation: {
        addDevice: async (parent, { name, serial, ipAddress }, { models }) => {
            if (await checkDeviceExists(serial, ipAddress)) {
                throw new ApolloError(`Device with the serial: ${serial} or ipAddress: ${ipAddress} already exists`);
            }

            const addDevice = new models.Device(name, serial, ipAddress);

            try {
                addDevice.validate();

                if (!await addDevice.save()) {
                    throw new ApolloError(`An error happend, could not add the new device`);
                }

                return addDevice;
            } catch (err) {
                throw new ApolloError(err);
            }
        },

        setValue: async (parent, { serial, value }) => {
            let defined = false;
            let updateDevice = await queryDevice(`{\"selector\": {\"serial\": \"${serial}\"}}`);

            if (updateDevice) {
                updateDevice.value = String(value);
                defined = await updateDevice.update();

                updateLinkages(updateDevice.serial, updateDevice.value);
            }

            return defined;
        },

        deleteDevice: async (parent, { serial }) => {
            let deleted = false;
            let deleteDevice = await queryDevice(`{\"selector\": {\"serial\": \"${serial}\"}}`);
            
            if (deleteDevice) {
                deleted = deleteDevice.remove();
            }

            return deleted;
        },
    },
};