import { ApolloError } from 'apollo-server';

let devices = {};

export default {
    Query: {
        devices: (parent) => {
            return Object.values(devices);
        },

        device: (parent, { serial }) => {
            return devices[serial];
        },
    },

    Mutation: {
        addDevice: (parent, { name, serial, ipAddress }, { models }) => {
            const addDevice = new models.Device(name, serial, ipAddress);

            try {
                addDevice.validate();

                if (serial in devices) {
                    throw new ApolloError(`Device with the serial: ${serial}, already exists`);
                }

                for (let serial in devices) {
                    if (ipAddress === devices[serial].ipAddress) {
                        throw new ApolloError(`Device with the ipAddress: ${ipAddress}, already exists`);
                    }
                }

                devices[serial] = addDevice;
                
                return addDevice;
            } catch (err) {
                throw new ApolloError(err);
            }
        },

        updateDevice: (parent, { name, serial, ipAddress }, { models }) => {
            let updateDevice = null;

            if (serial in devices) {
                updateDevice = devices[serial];

                let updateName = name || updateDevice.name;
                let updateIpAddress = ipAddress || updateDevice.ipAddress;
                
                updateDevice = new models.Device(updateName, serial, updateIpAddress, updateDevice.value);
                
                try {
                    updateDevice.validate();

                    for (let s in devices) {
                        if (s !== serial &&ipAddress === devices[s].ipAddress) {
                            throw new ApolloError(`Device with the ipAddress: ${ipAddress}, already exists`);
                        }
                    }

                    devices[serial] = updateDevice;
                    
                    return updateDevice;
                } catch (err) {
                    throw new ApolloError(err);
                }
            } else {
                throw new ApolloError(`Device does not exist`);
            }
        },

        setValue: (parent, { serial, value }) => {
            let defined = false;
            let device = null;

            if (serial in devices) {
                device = devices[serial];

                device['value'] = value;

                if (value = devices[serial].value) {
                    defined = true;
                }
            }

            return defined;
        },

        deleteDevice: (parent, { serial }) => {
            let deleted = false;

            if (serial in devices) {
                delete devices[serial];
                deleted = true;
            }

            return deleted;
        },
    },
};