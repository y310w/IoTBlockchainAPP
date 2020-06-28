class Linkage {
    constructor(sensor, cond, actuator, region) {
        this.id = sensor.concat('/', actuator);
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

    save() {
        try {
        } catch (err) {
            console.log(err);
        }
    }

    remove() {
        try {
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

export default Linkage;