import { ApolloError } from 'apollo-server';

let linkages = {};

export default {
    Query: {
        linkages: (parent) => {
            return Object.values(linkages);
        },

        linkage: (parent, { id }) => {
            return linkages[id];
        },
    },

    Mutation: {
        addLinkage: (parent, { sensor, cond, actuator, region }, { models }) => {
            const addLinkage = new models.Linkage(sensor, cond, actuator, region);

            try {
                addLinkage.validate();

                let id = sensor.concat('/', actuator);

                if (id in linkages) {
                    throw new ApolloError(`Linkage with the id: ${id}, already exists`);
                }

                linkages[id] = addLinkage;
                
                return addLinkage;
            } catch (err) {
                throw new ApolloError(err);
            }
        },

        updateLinkage: (parent, { id, cond, region }, { models }) => {
            let updateLinkage = null;

            if (id in linkages) {
                updateLinkage = linkages[id];

                let updateCond = cond || updateLinkage.cond;
                let updateRegion = region || updateLinkage.region;
                
                updateLinkage = new models.Linkage(updateLinkage.sensor, updateCond, 
                                                   updateLinkage.actuator, updateRegion);
                
                try {
                    updateLinkage.validate();

                    linkages[id] = updateLinkage;
                    
                    return updateLinkage;
                } catch (err) {
                    throw new ApolloError(err);
                }
            } else {
                throw new ApolloError(`Linkage does not exist`);
            }
        },

        deleteLinkage: (parent, { id }) => {
            let deleted = false;

            if (id in linkages) {
                delete linkages[id];
                deleted = true;
            }

            return deleted;
        },

        enable: (parent, { id }, { models }) => {
            let defined = false;
            
            if (id in linkages) {
                let linkage = linkages[id];

                const link = new models.Linkage(linkage.sensor, linkage.cond, 
                                                linkage.actuator, linkage.region);
                
                link.enable();

                if (link.status == true) {
                    linkages[id] = link;
                    defined = true;
                }                            
            }

            return defined;
        },

        disable: (parent, { id }, { models }) => {
            let defined = false;

            if (id in linkages) {
                const linkage = linkages[id];

                const link = new models.Linkage(linkage.sensor, linkage.cond, 
                                                linkage.actuator, linkage.region);
       
                defined = link.disable();

                if (link.status == false) {
                    linkages[id] = link;
                    defined = true;
                }  
            }

            return defined;
        },
    },
};