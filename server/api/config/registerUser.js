/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

require('dotenv').config()

const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');
const path = require('path');

const config = {
    Device: {
        CONNECTION_FILE: process.env.CONNECTION_DEVICE_FILE || '/connections/device/connection.json',
        ADMIN: 'adminDevice',
        USER: 'userDevice',
        MSP: 'DeviceMSP'
    },
    Linkage: {
        CONNECTION_FILE: process.env.CONNECTION_LINKAGE_FILE || '/connections/linkage/connection.json',
        ADMIN: 'adminLinkage',
        USER: 'userLinkage',
        MSP: 'LinkageMSP'
    }
}

async function main() {
    try {
        for (let key in config) {
            let ccpPath = path.resolve('./config/' + config[key]['CONNECTION_FILE']);

            // Create a new file system based wallet for managing identities.
            const walletPath = path.join(process.cwd(), 'wallet');
            const wallet = new FileSystemWallet(walletPath);
            console.log(`Wallet path: ${walletPath}`);

            // Check to see if we've already enrolled the user.
            const userExists = await wallet.exists(config[key]['USER']);
            if (userExists) {
                console.log(`An identity for the user ${config[key]['USER']} already exists in the wallet`);
                return;
            }

            // Check to see if we've already enrolled the admin user.
            const adminExists = await wallet.exists(config[key]['ADMIN']);
            if (!adminExists) {
                console.log(`An identity for the admin user ${config[key]['ADMIN']} does not exist in the wallet`);
                console.log('Run the enrollAdmin.js application before retrying');
                return;
            }

            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccpPath, { wallet, identity: config[key]['ADMIN'], discovery: { enabled: true, asLocalhost: true } });
            
            // Get the CA client object from the gateway for interacting with the CA.
            const ca = gateway.getClient().getCertificateAuthority();
            const adminIdentity = gateway.getCurrentIdentity();

            // Register the user, enroll the user, and import the new identity into the wallet.
            const secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: config[key]['USER'], role: 'client' }, adminIdentity);
            const enrollment = await ca.enroll({ enrollmentID: config[key]['USER'], enrollmentSecret: secret });
            const userIdentity = X509WalletMixin.createIdentity(config[key]['MSP'], enrollment.certificate, enrollment.key.toBytes());
            await wallet.import(config[key]['USER'], userIdentity);
            console.log(`Successfully registered and enrolled admin user ${config[key]['USER']} and imported it into the wallet`);
        }

    } catch (error) {
        console.error(`Failed to register user: ${error}`);
        process.exit(1);
    }
}

main();