import 'dotenv/config';
import { ApolloServer, AuthenticationError } from 'apollo-server-express';
import express from 'express';
import cors from 'cors';
import http from 'http';
import models, { connectDb } from './models';
import resolvers from './resolvers';
import schema from './schema';

const app = express();

app.use(cors());

const getCurrentUser = async req => {
    const token = req.headers['x-token'];

    if (token) {
        try {
            return await jwt.verify(token, process.env.SECRET);
        } catch (e) {
            throw new AuthenticationError(
                'Your session expired. Sign in again.',
            );
        }
    }
};

const server = new ApolloServer({
    introspection: true,
    playground: true,
    typeDefs: schema,
    resolvers,
    context: async ({ req, connection }) => {
        if (connection) {
            return {
                models
            };
        }

        if (req) {
            const currentUser = await getCurrentUser(req);

            return {
                models,
                currentUser,
                secret: process.env.JWT_SECRET,
                expiresIn: process.env.JWT_LIFE_TIME,
            };
        }
    },
});

server.applyMiddleware({ app, path: '/graphql' });

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

const port = process.env.PORT || 8000;

connectDb().then(async () => {
    httpServer.listen({ port }, () => {
        console.log(`Apollo Server on http://localhost:${port}/graphql`);
    });
});