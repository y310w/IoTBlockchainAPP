import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server';
import { isAdmin } from './authorization';
import { combineResolvers } from 'graphql-resolvers';
import jwt from 'jsonwebtoken';


const createToken = async (user, secret, expiresIn) => {
    const { id, email, username, role } = user;

    return await jwt.sign({ id, email, username, role }, secret, { expiresIn });
};

export default {
    Query: {
        users: async (parent, args, { models }) => {
            return await models.User.find();
        },
        
        user: async (parent, { id }, { models }) => {
            return await models.User.findById(id);
        },
        currentUser: async (parent, args, { models, currentUser }) => {
            if (!currentUser) {
                throw new ForbiddenError('Not authenticated as user.');
            }

            return await models.User.findById(currentUser.id);
        },
    },

    Mutation: {
        signUp: async (
            parent,
            { username, email, password },
            { models, secret, expiresIn }
        ) => {
            const user = new models.User({
                username: username,
                email: email,
                password: password,
            });

            await user.save();

            return { token: createToken(user, secret, expiresIn) };
        },

        signIn: async (
            parent,
            { login, password },
            { models, secret, expiresIn }
        ) => {
            const userData = await models.User.findByLogin(login);

            if (!userData) {
                throw new UserInputError('No user found with this login credentials.');
            }

            let user = new models.User(userData);

            const isValid = await user.validatePassword(password);

            if (!isValid) {
                throw new AuthenticationError('Invalid password.');
            }
            
            return { token: createToken(user, secret, expiresIn) };
        },

        deleteUser: combineResolvers(
            isAdmin,
            async (parent, { id }, { models }) => {
                return await models.User.deleteOne({ _id: id});
            },
        ),
    },
};