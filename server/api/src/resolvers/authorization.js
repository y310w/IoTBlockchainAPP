import { ForbiddenError } from 'apollo-server';
import { combineResolvers, skip } from 'graphql-resolvers';

export const isAuthenticated = (parent, args, { currentUser }) =>
    currentUser ? skip : new ForbiddenError('Not authenticated as user.');

export const isAdmin = combineResolvers(
    isAuthenticated,
    (parent, args, { currentUser: { role } }) =>
        role === 'ADMIN'
            ? skip
            : new ForbiddenError('Not authorized as admin.'),
);