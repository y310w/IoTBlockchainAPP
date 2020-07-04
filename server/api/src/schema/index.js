import { gql } from 'apollo-server-express';
 
import userSchema from './user';
import deviceSchema from './device';
import linkageSchema from './linkage'; 

const linkSchema = gql`
  type Query {
    _: Boolean
  }
 
  type Mutation {
    _: Boolean
  }
 
  type Subscription {
    _: Boolean
  }
`;
 
export default [linkSchema, userSchema, deviceSchema, linkageSchema];