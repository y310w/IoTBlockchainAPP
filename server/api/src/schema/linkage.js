import { gql } from 'apollo-server-express';

export default gql`
    extend type Query {
        linkages(sensor: String): [Linkage]
        linkage(id: ID!): Linkage
        historyLinkage(id: ID!): [Linkage]
    }

    extend type Mutation {
        addLinkage(sensor: String!, cond: String!, actuator: String!, region: String!): Linkage!
        updateLinkage(id: ID!, cond: String, region: String): Linkage!
        deleteLinkage(id: ID!): Boolean!
        enable(id: ID!): Boolean!
        disable(id: ID!): Boolean!
    }

    type Linkage {
        txId: String
        id: ID
        sensor: String!
        cond: String!
        actuator: String!
        status: Boolean!
        region: String
    }
`;