import { expect } from 'chai';
import * as userApi from './api';


describe('users', () => {
    describe('user(id: String!): User', () => {
        it('returns a user when user can be found', async () => {
            const expectedResult = {
                data: {
                    user: {
                        id: "5ef248fdcbdc8484f741016f",
                        username: 'fernando',
                        email: 'fernando@hotmail.com',
                        role: 'Admin',
                    },
                },
            };

            const result = await userApi.user({ id: "5ef248fdcbdc8484f741016f" });

            expect(result.data).to.eql(expectedResult);
        });

        it('returns null when user cannot be found', async () => {
            const expectedResult = {
                data: {
                    user: null,
                },
            };

            const result = await userApi.user({ id: '5ef248fdcbdc8484f741016e' });

            expect(result.data).to.eql(expectedResult);
        });
    });

    describe('deleteUser(id: String!): Boolean!', () => {
        it('returns an error because only admins can delete a user', async () => {
            const {
                data: {
                    data: {
                        signIn: { token },
                    },
                },
            } = await userApi.signIn({
                login: 'fernando@hotmail.com',
                password: 'fernando1$',
            });

            const {
                data: { errors },
            } = await userApi.deleteUser({ id: '5ef262de2cd6f9a1a51daab1' }, token);

            expect(errors[0].message).to.eql('Not authorized as admin.');
        });
    });
});