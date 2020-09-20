import 'dotenv/config';
import { FileSystemWallet, Gateway } from 'fabric-network';
import path from 'path';

const config = {
    Device: {
        USER: 'userDevice',
        CONNECTION_FILE: process.env.CONNECTION_DEVICE_FILE || 'connections/device/connection.json',
    },
    Linkage: {
        USER: 'userLinkage',
        CONNECTION_FILE: process.env.CONNECTION_LINKAGE_FILE || 'connections/linkage/connection.json',
    }
}

const getGateway = async (org) => {
    try {
        const ccpPath = path.resolve(__dirname, '..', '..', 'config', config[org]['CONNECTION_FILE']);
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: config[org]['USER'], discovery: { enabled: true, asLocalhost: true }});
        
        return gateway;
    } catch (err) {
        throw new Error(`Failed to connect gateway: ${err}`);  
    }
};

const queryTransaction = async (data) => {
    try {
        const gateway = await getGateway(data.org);
        const network = await gateway.getNetwork(data.channel);
        const contract = network.getContract(data.contractName);
        let result = await contract.submitTransaction(data.transaction, ...data.args);

        result = result.toString();

        let json = JSON.parse(result.toString().replace(/\0/g, ''));

        return json.data;
    } catch (err) {
        throw new Error(`Failed to submit the Transaction: ${err}`);
    }
};

const utils = { getGateway, queryTransaction };

export default utils;