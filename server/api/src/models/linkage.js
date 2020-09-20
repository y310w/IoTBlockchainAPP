import utils from '../utils/fabric-utils';
import http from 'http';
import { queryDevice } from './device';

class Linkage {
    constructor(id = undefined, sensor, cond, actuator, status, region) {
        this.txId = null;
        this.id = id;
        this.sensor = sensor;
        this.cond = cond;
        this.actuator = actuator;
        this.status = Boolean(status);
        this.region = region || "";
    }

    validate() {
        if (this.sensor === null || this.cond === null || this.cond === "" || this.actuator === null) {
            throw new Error('Some values are null');
        }

        const reSerialNumber = /^[0-9]{3}-[0-9]{3}-[0-9]{3}$/;

        if (!reSerialNumber.test(String(this.sensor))) {
            throw new Error('Invalid value for Serial Number, must follow like this XXX-XXX-XXX');
        }

        if (!reSerialNumber.test(String(this.actuator))) {
            throw new Error('Invalid value for Serial Number, must follow like this XXX-XXX-XXX');
        }

        if (this.sensor == this.actuator) {
            throw new Error('Linkage must not be with the same device');
        }

        if (typeof this.status != "boolean") {
            throw new Error('Status must be a boolean instance');
        }

        if (this.cond.includes('value')) {
            let condNumber = this.cond.match(/\d+/);
            let condOperator = this.cond.replace('value', '');

            if (condNumber != null && condNumber.length > 0) {
                condOperator = condOperator.replace(/\d+/, '');

                if (condOperator != '<' && condOperator != '>' &&
                    condOperator != '<=' && condOperator != '>=' &&
                    condOperator != '==' && condOperator != '!=') {
                    throw new Error('Condition must contain arithmetic operators');
                }
            } else {
                throw new Error('Condition must contain arithmetic value to be compared');
            }
        } else {
            throw new Error('Condition must contain `value` variable to be compared');
        }
    }

    async save() {
        try {
            let data = {
                org: 'Linkage',
                channel: 'channelall',
                contractName: 'linkage',
                transaction: 'addLinkage',
                args: [
                    this.sensor,
                    this.cond,
                    this.actuator,
                    String(this.status),
                    this.region
                ]
            };

            return await utils.queryTransaction(data);
        } catch (err) {
            console.log(err);
        }
    }

    async update() {
        try {
            let data = {
                org: 'Linkage',
                channel: 'channelall',
                contractName: 'linkage',
                transaction: 'updateLinkage',
                args: [
                    this.id,
                    this.cond,
                    String(this.status),
                    this.region
                ]
            };

            return await utils.queryTransaction(data);
        } catch (err) {
            console.log(err);
        }
    }

    async remove() {
        try {
            let data = {
                org: 'Linkage',
                channel: 'channelall',
                contractName: 'linkage',
                transaction: 'deleteLinkage',
                args: [
                    this.id,
                ]
            };

            return await utils.queryTransaction(data);
        } catch (err) {
            console.log(err);
        }
    }

    async history() {
        try {
            let data = {
                org: 'Linkage',
                channel: 'channelall',
                contractName: 'linkage',
                transaction: 'historyLinkage',
                args: [
                    this.id,
                ]
            };

            const result = await utils.queryTransaction(data);

            let res = [];

            if (result.length > 0) {
                for (let i = 0; i < result.length; i++) {
                    if ("value" in result[i]) {
                        let record = result[i].value;

                        let linkage = new Linkage(record.id, record.sensor, record.cond, record.actuator, record.status, record.region);
                        linkage.txId = result[i].txId;

                        res.push(linkage);
                    }
                }
            }

            return res;
        } catch (err) {
            console.log(err);
        }
    }

    async enable() {
        this.status = true;
        const actuator = await queryDevice(`{\"selector\": {\"serial\": \"${this.actuator}\"}}`);
        this.sendRequest("enable", actuator.ipAddress);
    }

    async disable() {
        this.status = false;
        const actuator = await queryDevice(`{\"selector\": {\"serial\": \"${this.actuator}\"}}`);
        this.sendRequest("disable", actuator.ipAddress);
    }

    sendRequest(status, ipAddress) {
        const data = JSON.stringify({
            data: status,
        });

        const options = {
            hostname: ipAddress,
            port: 80,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
            },
        }

        const req = http.request(options, (res) => {
            console.log(`statusCode: ${res.statusCode}`)

            res.on('data', (d) => {
                process.stdout.write(d)
            })
        })

        req.on('error', (error) => {
            console.error(error)
        })

        req.write(data)
        req.end()
    }
}

export const queryLinkage = async (query) => {
    try {
        let data = {
            org: 'Linkage',
            channel: 'channelall',
            contractName: 'linkage',
            transaction: 'queryLinkage',
            args: [
                query
            ]
        };

        const result = await utils.queryTransaction(data);

        let res = undefined;

        if (result != null || result != undefined) {
            if (result.length > 1) {
                res = [];

                for (let i = 0; i < result.length; i++) {
                    if ("Record" in result[i]) {
                        let record = result[i].Record;
                        res.push(new Linkage(record.id, record.sensor, record.cond, record.actuator, record.status, record.region));
                    }
                }
            } else if (result.length == 1) {
                let record = result[0].Record;
                res = new Linkage(record.id, record.sensor, record.cond, record.actuator, record.status, record.region);
            }
        }

        return res;
    } catch (err) {
        console.log(err);
    }
};

export const checkLinkageExists = async (sensor, actuator) => {
    let linkage = await queryLinkage(`{\"selector\": {\"sensor\": \"${sensor}\", \"actuator\": \"${actuator}\"}}`);

    if (linkage != undefined) {
        return true;
    }

    linkage = await queryLinkage(`{\"selector\": {\"sensor\": \"${actuator}\", \"actuator\": \"${sensor}\"}}`);

    if (linkage != undefined) {
        return true;
    }

    return false;
}

const evaluateCondition = (cond) => {
    const numbers = cond.match(/\d+/g).map(numStr => parseInt(numStr));
    const condOperator = cond.replace(/\d+/g, '');

    if (numbers.length == 2) {
        if (condOperator == '<') {
            return (numbers[0] < numbers[1]);
        } else if (condOperator == '>') {
            return (numbers[0] > numbers[1]);
        } else if (condOperator == '<=') {
            return (numbers[0] <= numbers[1]);
        } else if (condOperator == '>=') {
            return (numbers[0] >= numbers[1]);
        } else if (condOperator == '==') {
            return (numbers[0] == numbers[1]);
        } else if (condOperator == '!=') {
            return (numbers[0] != numbers[1]);
        } else {
            return null;
        }
    }
}

export const updateLinkages = async (serial, value) => {
    const res = await queryLinkage(`{\"selector\": {\"sensor\": \"${serial}\"}}`);

    let status = undefined;

    if (res != null || res != undefined) {
        if (Array.isArray(res)) {
            for (let i = 0; i < res.length; i++) {
                status = evaluateCondition(res[i].cond.replace('value', value));

                status = (status != null) ? status : res.status;

                if (status) {
                    res[i].enable();
                } else {
                    res[i].disable();
                }

                await res[i].update();
            }
        } else {
            status = evaluateCondition(res.cond.replace('value', value));

            status = (status != null) ? status : res.status;
            
            if (status) {
                res.enable();
            } else {
                res.disable();
            }

            await res.update();
        }
    }
}

export default Linkage;