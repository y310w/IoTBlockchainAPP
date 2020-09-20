import 'dotenv/config';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import cors from 'cors';
import http from 'http';
import models from './models';
import resolvers from './resolvers';
import schema from './schema';

const app = express();

app.use(cors());

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
            return {
                models,
            };
        }
    },
});

server.applyMiddleware({ app, path: '/graphql' });

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

const port = process.env.PORT || 8080;

httpServer.listen({ port }, () => {
    console.log(`Apollo Server on http://localhost:${port}/graphql`);
});