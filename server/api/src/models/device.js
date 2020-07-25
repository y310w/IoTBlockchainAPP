import utils from '../utils/fabric-utils';

class Device {
    constructor(name, serial, ipAddress, value = null) {
        this.name = name;
        this.serial = serial;
        this.ipAddress = ipAddress;
        this.value = value;
    }

    validate() {
        if (this.name === null || this.serial === null || this.ipAddress === null) {
            throw new Error('Some values are null');
        }

        const reSerialNumber = /^[0-9]{3}-[0-9]{3}-[0-9]{3}$/;

        if (!reSerialNumber.test(String(this.serial))) {
            throw new Error('Invalid value for Serial Number, must follow like this XXX-XXX-XXX');
        }

        const reIpAddress = /\b((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.|$)){4}\b/;

        if (!reIpAddress.test(String(this.ipAddress))) {
            throw new Error('Invalid IP address');
        }
    }

    async save() {
        try {
            let data = {
                channel: 'devicechannel',
                contractName: 'device',
                transaction: 'addDevice',
                userName: 'user1',
                args: [
                    this.name,
                    this.serial,
                    this.ipAddress,
                    this.value
                ]
            };

            const result = await utils.queryTransaction(data);
        }
        catch (err) {
            console.log(err);
        }
    }

    async remove() {
        try {
            let data = {
                channel: 'devicechannel',
                contractName: 'device',
                transaction: 'deleteDevice',
                userName: 'user1',
                args: [
                    this.serial,
                ]
            };

            const result = await utils.queryTransaction(data);
        }
        catch (err) {
            console.log(err);
        }
    }
};


export const queryDevice = async (query) => {
    try {
        let data = {
            channel: 'devicechannel',
            contractName: 'device',
            transaction: 'queryDevice',
            userName: 'user1',
            args: [
                query
            ]
        };
        
        const result = await utils.queryTransaction(data);
        
        return result;
    }
    catch (err) {
        console.log(err);
    }
};

export const checkDeviceExists = async (serial, ipAddress) => {
    let found = false;

    const device = queryDevice("{\"selector\": {\"serial\": ${serial}, {\"ipAddress\": ${ipAddress}}}")
    
    if (device) {
        found = true;
    }

    return found;
}

export default Device;