import mongoose from 'mongoose';

import User from './user';
import Device from './device';
import Linkage from './linkage';

const connectDb = () => {
    return mongoose.connect(
        process.env.TEST_DB_URI || process.env.MONGODB_URI,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        }
    );
};

const models = { User, Device, Linkage };

export { connectDb };

export default models;