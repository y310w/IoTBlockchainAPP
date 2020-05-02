import { Context, Contract } from 'fabric-contract-api';
import { Base } from './base'; 

export class Sensor extends Contract {

    async Init(ctx: Context) {
        console.info('============= START : Initialize Ledger ===========');
        const sensor: Base = {
            docType: 'Sensor',
            serial: 'serial_number',
            valor: -1
        }

        await ctx.stub.putState(sensor.serial, Buffer.from(JSON.stringify(sensor)));
        console.info('============= END : Initialize Ledger ===========');
    }

    public async querySensor(ctx: Context, query: string) {
        return
    }

    public async addSensor(ctx: Context, data: object) {
        return
    }

    public async updateSensor(ctx: Context, query: string, data: object) {
        return
    }

    public async deleteSensor(ctx: Context, query: string) {
        return
    }
}