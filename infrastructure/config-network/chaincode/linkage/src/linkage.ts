import { Context, Contract } from 'fabric-contract-api';
import { Base } from './base'; 
import { Md5 } from 'ts-md5/dist/md5.js';

export class Linkage extends Contract {

    async Init(ctx: Context) {
        console.info('============= START : Initialize Ledger ===========');
        const linkage: Base = {
            docType: 'linkage',
            id: Md5.hashStr('first-linkage'),
            sensor: 'serial_number',
            umbral: 'false',
            actuador: 'serial_number',
            estado: false,
            region: 'none'
        }

        await ctx.stub.putState(linkage.id, Buffer.from(JSON.stringify(linkage)));
        console.info('============= END : Initialize Ledger ===========');
    }

    public async queryLinkage(ctx: Context, query: string) {
        return
    }

    public async addLinkage(ctx: Context, data: object) {
        return
    }

    public async updateLinkage(ctx: Context, query: string, data: object) {
        return
    }

    public async deleteLinkage(ctx: Context, query: string) {
        return
    }
}