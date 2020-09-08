import utils from '../utils/fabric-utils';

class Device {
    constructor(name, serial, ipAddress, value = "-1") {
        this.name = name;
        this.serial = serial;
        this.ipAddress = ipAddress;
        this.value = String(value);
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
                org: 'Device',
                channel: 'channelall',
                contractName: 'device',
                transaction: 'addDevice',
                args: [
                    this.name,
                    this.serial,
                    this.ipAddress,
                    this.value
                ]
            };

            await utils.queryTransaction(data);
        }
        catch (err) {
            console.log(err);
        }
    }

    async update() {
        try {
            let data = {
                org: 'Device',
                channel: 'channelall',
                contractName: 'device',
                transaction: 'updateDevice',
                args: [
                    this.serial,
                    this.value
                ]
            };

            await utils.queryTransaction(data);
        }
        catch (err) {
            console.log(err);
        }
    }

    async remove() {
        try {
            let data = {
                org: 'Device',
                channel: 'channelall',
                contractName: 'device',
                transaction: 'deleteDevice',
                args: [
                    this.serial,
                ]
            };

            await utils.queryTransaction(data);
        }
        catch (err) {
            console.log(err);
        }
    }
};


export const queryDevice = async (query) => {
    try {
        let data = {
            org: 'Device',
            channel: 'channelall',
            contractName: 'device',
            transaction: 'queryDevice',
            args: [
                query
            ]
        };
        
        const result = await utils.queryTransaction(data);

        let res;

        if (result.length > 1) {
            res = [];

            for (let i = 0; i < result.length; i++) {
                if ("Record" in result[i]) {
                    let record = result[i].Record;
                    res.push(new Device(record.name, record.serial, record.ipAddress, record.value));
                }
            }
        } else {
            let record = result[0].Record;
            res = new Device(record.name, record.serial, record.ipAddress, record.value);
        }

        return res;
    }
    catch (err) {
        console.log(err);
    }
};

export const checkDeviceExists = async (serial, ipAddress) => {
    let found = false;

    const device = await queryDevice(`{\"selector\": {\"$or\": [{\"serial\": \"${serial}\"}, {\"ipAddress\": \"${ipAddress}\"}]}}`);

    if (device != undefined) {
        found = true;
    }

    return found;
}

export default Device;