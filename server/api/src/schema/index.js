import { gql } from 'apollo-server-express';
 
import deviceSchema from './device';
import linkageSchema from './linkage'; 

const linkSchema = gql`
  type Query {
    _: Boolean
  }
 
  type Mutation {
    _: Boolean
  }
`;
 
export default [linkSchema, deviceSchema, linkageSchema];