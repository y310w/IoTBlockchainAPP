import { ApolloError } from 'apollo-server';
import { checkLinkageExists, queryLinkage } from '../models/linkage';

export default {
    Query: {
        linkages: async (parent) => {
            return await queryLinkage("{\"selector\": {}}");
        },

        linkage: async (parent, { id }) => {
            return await queryLinkage("{\"selector\": {\"id\": ${id}}}");
        },
    },

    Mutation: {
        addLinkage: async (parent, { sensor, cond, actuator, region }, { models }) => {
            if (checkLinkageExists(md5(sensor + actuator))) {
                throw new ApolloError(`Linkage with the id: ${id} already exists`);
            }

            const addLinkage = new models.Linkage(sensor, cond, actuator, region);

            try {
                addLinkage.validate();

                await addLinkage.save();
                
                return addLinkage;
            } catch (err) {
                throw new ApolloError(err);
            }
        },

        updateLinkage: async (parent, { id, cond, region }, { models }) => {
            let updateLinkage = queryLinkage("{\"selector\": {\"id\": ${id}}}");

            if (updateLinkage) {
                let updateCond = cond || updateLinkage.cond;
                let updateRegion = region || updateLinkage.region;
                
                updateLinkage = new models.Linkage(updateLinkage.sensor, updateCond, 
                                                   updateLinkage.actuator, updateRegion);
                
                try {
                    updateLinkage.validate();

                    await updateLinkage.save();
                    
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
            let deleteLinkage = queryLinkage({"selector": {"id": id}});

            if (deleteLinkage) {
                deleteLinkage.remove();
                deleted = true;
            }

            return deleted;
        },

        enable: async (parent, { id }) => {
            let defined = false;
            
            if (checkLinkageExists(id)) {
                let linkage = queryLinkage({"selector": {"id": id}});
                
                linkage.enable();

                if (linkage.status == true) {
                    await linkage.save();
                    defined = true;
                }                            
            }

            return defined;
        },

        disable: async (parent, { id }) => {
            let defined = false;
            
            if (checkLinkageExists(id)) {
                let linkage = queryLinkage({"selector": {"id": id}});
                
                linkage.disable();

                if (linkage.status == false) {
                    await linkage.save();
                    defined = true;
                }                            
            }

            return defined;
        },
    },
};