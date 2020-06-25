import mongoose from 'mongoose';

import User from './user';

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

const models = { User };

export { connectDb };

export default models;