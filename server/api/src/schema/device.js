import { gql } from 'apollo-server-express';

export default gql`
    extend type Query {
        devices: [Device!]
        device(serial: String!): Device
    }

    extend type Mutation {
        addDevice(name: String!, serial: String!, ipAddress: String!): Device!
        setValue(serial: String!, value: Int!): Boolean!
        deleteDevice(serial: String!): Boolean!
    }

    type Device {
        name: String!
        serial: String!
        ipAddress: String!
        value: Int
    }
`;