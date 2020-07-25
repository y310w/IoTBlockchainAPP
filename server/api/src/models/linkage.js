import { md5 } from 'md5';

class Linkage {
    constructor(sensor, cond, actuator, region) {
        this.id = md5(sensor + actuator);
        this.sensor = sensor;
        this.cond = cond;
        this.actuator = actuator;
        this.status = false;
        this.region = region;
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
                channel: 'LinkageChannel',
                contractName: 'linkage',
                transaction: 'addLinkage',
                userName: 'user1',
                args: [
                    this.sensor,
                    this.cond,
                    this.actuator,
                    false,
                    this.region
                ]
            };

            if (this.id) {
                data = {
                    channel: 'LinkageChannel',
                    contractName: 'linkage',
                    transaction: 'updateLinkage',
                    userName: 'user1',
                    args: [
                        this.id,
                        this.cond,
                        this.status,
                        this.region
                    ]
                };
            }

            const result = await utils.queryTransaction(data);
        } catch (err) {
            console.log(err);
        }
    }

    async remove() {
        try {
            let data = {
                channel: 'LinkageChannel',
                contractName: 'linkage',
                transaction: 'deleteLinkage',
                userName: 'user1',
                args: [
                    this.id,
                ]
            };

            const result = await utils.queryTransaction(data);
        } catch (err) {
            console.log(err);
        }
    }

    enable() {
        this.status = true;
    }

    disable() {
        this.status = false;
    }
}

export const queryLinkage = async (query) => {
    try {
        let data = {
            channel: 'handlerchannel',
            contractName: 'linkage',
            transaction: 'queryLinkage',
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

export const checkLinkageExists = async (id) => {
    let found = false;

    const linkage = queryLinkage("{\"selector\": {\"id\": ${id}}}")
    
    if (linkage) {
        found = true;
    }

    return found;
}

export default Linkage;