/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

require('dotenv').config()

const FabricCAServices = require('fabric-ca-client');
const { FileSystemWallet, X509WalletMixin } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const config = {
    Device: {
        ADMIN: 'adminDevice',
        CONNECTION_FILE: process.env.CONNECTION_DEVICE_FILE || 'connections/device/connection_dev.json',
        CA_AUTH: 'ca.device.networkiot.com',
        MSP: 'DeviceMSP'
    },
    Linkage: {
        ADMIN: 'adminLinkage',
        CONNECTION_FILE: process.env.CONNECTION_LINKAGE_FILE || 'connections/linkage/connection_dev.json',
        CA_AUTH: 'ca.linkage.networkiot.com',
        MSP: 'LinkageMSP'
    }
}

async function main() {
    try {
        for (let key in config) {
            let ccpPath = path.resolve('./config/' + config[key]['CONNECTION_FILE']);
            console.log(ccpPath);
            let ccpJSON = fs.readFileSync(ccpPath, 'utf8');
            let ccp = JSON.parse(ccpJSON);

            // Create a new CA client for interacting with the CA.
            const caInfo = ccp.certificateAuthorities[config[key]['CA_AUTH']];
            const caTLSCACerts = caInfo.tlsCACerts.pem;
            const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

            // Create a new file system based wallet for managing identities.
            const walletPath = path.join(process.cwd(), 'wallet');
            const wallet = new FileSystemWallet(walletPath);
            console.log(`Wallet path: ${walletPath}`);

            // Check to see if we've already enrolled the admin user.
            const adminExists = await wallet.exists(config[key]['ADMIN']);
            if (adminExists) {
                console.log(`An identity for the admin user ${config[key]['ADMIN']} already exists in the wallet`);
                return;
            }

            // Enroll the admin user, and import the new identity into the wallet.
            const enrollment = await ca.enroll({ enrollmentID: config[key]['ADMIN'], enrollmentSecret: 'admin' });
            const identity = X509WalletMixin.createIdentity(config[key]['MSP'], enrollment.certificate, enrollment.key.toBytes());
            await wallet.import(config[key]['ADMIN'], identity);
            console.log(`Successfully enrolled admin user ${config[key]['ADMIN']} and imported it into the wallet`);
        }
    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
        process.exit(1);
    }
}

main();