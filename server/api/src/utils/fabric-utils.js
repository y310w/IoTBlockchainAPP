import { FileSystemWallet, Gateway } from 'fabric-network';
import fs from 'fs';
import path from 'path';

const connectionFile = process.env.CONNECTION || 'connection_dev.json';

const ccpPath = path.resolve(__dirname, '..', '..', 'config', connectionFile);

const getGateway = async () => {
    try {
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: true });
        
        return gateway;
    } catch (err) {
        throw new Error(`Failed to connect gateway: ${err}`);  
    }
};

const queryTransaction = async (data) => {
    try {
        const gateway = await getGateway();
        const network = await gateway.getNetwork(data.channel);
        const contract = network.getContract(data.contractName);
        return await contract.submitTransaction(data.transaction, ...data.args);
    } catch (err) {
        throw new Error(`Failed to submit the Transaction: ${err}`);
    }
};

const utils = { getGateway, queryTransaction };

export default utils;