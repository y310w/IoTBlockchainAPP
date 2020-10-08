import 'dotenv/config';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import fs from 'fs';
import cors from 'cors';
import https from 'https';
import models from './models';
import resolvers from './resolvers';
import schema from './schema';

const app = express();

app.use(cors());
app.use(express.static('~/IoTBlockchainAPP/server/api/static', { dotfiles: 'allow' }))

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
const httpServer = https.createServer({
  key: fs.readFileSync('/etc/letsencrypt/live/iotblockchainapi.ddns.net/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/iotblockchainapi.ddns.net/cert.pem'),
  ca: fs.readFileSync('/etc/letsencrypt/live/iotblockchainapi.ddns.net/chain.pem'),
}, app)

server.installSubscriptionHandlers(httpServer);

const port = process.env.PORT || 8080;

httpServer.listen({ port }, () => {
    console.log(`Apollo Server on https://localhost:${port}/graphql`);
});

app.get('/', function (req, res) {
  res.redirect('/graphql');
})
