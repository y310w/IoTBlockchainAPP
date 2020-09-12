import { ApolloError } from 'apollo-server';
import { checkLinkageExists, queryLinkage } from '../models/linkage';

export default {
    Query: {
        linkages: async (parent, { sensor }) => {
            if (sensor != undefined) {
                let res = await queryLinkage(`{\"selector\": {\"sensor\": \"${sensor}\"}}`);
                
                if (!Array.isArray(res)) {
                    res = [res];
                }

                return res;
            } else {
                return await queryLinkage("{\"selector\": {}}");
            }
        },

        linkage: async (parent, { id }) => {
            return await queryLinkage(`{\"selector\": {\"id\": \"${id}\"}}`);
        },

        historyLinkage: async (parent, { id }) => {
            let linkage = await queryLinkage(`{\"selector\": {\"id\": \"${id}\"}}`);
            
            if (linkage) {
                return await linkage.history();
            } else {
                return [];
            }
        },
    },

    Mutation: {
        addLinkage: async (parent, { sensor, cond, actuator, region }, { models }) => {
            if (await checkLinkageExists(sensor, actuator)) {
                throw new ApolloError(`Linkage with the id already exists`);
            }

            const addLinkage = new models.Linkage(undefined, sensor, cond, actuator, true, region);

            try {
                addLinkage.validate();

                if (!await addLinkage.save()) {
                    throw new ApolloError(`An error happend, could not add the new linkage`);
                }

                return addLinkage;
            } catch (err) {
                throw new ApolloError(err);
            }
        },

        updateLinkage: async (parent, { id, cond, region }, { models }) => {
            let updateLinkage = await queryLinkage(`{\"selector\": {\"id\": \"${id}\"}}`);

            if (updateLinkage) {
                let updateCond = cond || updateLinkage.cond;
                let updateRegion = region || updateLinkage.region;
                
                updateLinkage = new models.Linkage(updateLinkage.id, updateLinkage.sensor, updateCond, 
                                                   updateLinkage.actuator, updateLinkage.status, updateRegion);
                
                try {
                    updateLinkage.validate();

                    if (!await updateLinkage.update()) {
                        throw new ApolloError(`An error happend, could not update the linkage`);
                    }
                    
                    return updateLinkage;
                } catch (err) {
                    throw new ApolloError(err);
                }
            } else {
                throw new ApolloError(`Linkage does not exist`);
            }
        },

        deleteLinkage: async (parent, { id }) => {
            let deleted = false;
            let deleteLinkage = await queryLinkage(`{\"selector\": {\"id\": \"${id}\"}}`);

            if (deleteLinkage) {
                deleted = deleteLinkage.remove();
            }

            return deleted;
        },

        enable: async (parent, { id }) => {
            let defined = false;
            let linkage = await queryLinkage(`{\"selector\": {\"id\": \"${id}\"}}`);

            if (linkage != undefined) {    
                linkage.enable();
                
                if (!await linkage.update()) {
                    throw new ApolloError(`An error happend, could not update the linkage`);
                }

                defined = (linkage.status == true);
            }

            return defined;
        },

        disable: async (parent, { id }) => {
            let defined = false;
            let linkage = await queryLinkage(`{\"selector\": {\"id\": \"${id}\"}}`);

            if (linkage != undefined) {
                linkage.disable();
                
                if (!await linkage.update()) {
                    throw new ApolloError(`An error happend, could not update the linkage`);
                }

                defined = (linkage.status == false);                 
            }

            return defined;
        },
    },
};