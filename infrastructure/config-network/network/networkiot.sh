#!/bin/bash

printHelp() {

}

generateNetwork() {
    # remove previous crypto material and config transactions
    rm -fr config/*
    rm -fr crypto-config/*

    # generate crypto material
    cryptogen generate --config=./crypto-config.yaml
    if [ "$?" -ne 0 ]; then
    echo "Failed to generate crypto material..."
    exit 1
    fi

    # generate genesis block for orderer
    configtxgen -profile OneOrgOrdererGenesis -outputBlock ./config/genesis.block
    if [ "$?" -ne 0 ]; then
    echo "Failed to generate orderer genesis block..."
    exit 1
    fi

    # generate channel configuration transaction
    configtxgen -profile OneOrgChannel -outputCreateChannelTx ./config/channel.tx -channelID $CHANNEL_NAME
    if [ "$?" -ne 0 ]; then
    echo "Failed to generate channel configuration transaction..."
    exit 1
    fi

    # generate anchor peer transaction
    configtxgen -profile OneOrgChannel -outputAnchorPeersUpdate ./config/Org1MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org1MSP
    if [ "$?" -ne 0 ]; then
    echo "Failed to generate anchor peer update for Org1MSP..."
    exit 1
    fi
}

startNetwork() {
    set -ev

    # don't rewrite paths for Windows Git Bash users
    export MSYS_NO_PATHCONV=1

    docker-compose -f docker-compose.yml down

    docker-compose -f docker-compose.yml up -d ca.example.com orderer.example.com peer0.org1.example.com couchdb
    docker ps -a

    # wait for Hyperledger Fabric to start
    # incase of errors when running later commands, issue export FABRIC_START_TIMEOUT=<larger number>
    export FABRIC_START_TIMEOUT=10
    #echo ${FABRIC_START_TIMEOUT}
    sleep ${FABRIC_START_TIMEOUT}

    # Create the channel
    docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c mychannel -f /etc/hyperledger/configtx/channel.tx
    # Join peer0.org1.example.com to the channel.
    docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b mychannel.block
}

stopNetwork() {
    set -ev

    # Shut down the Docker containers that might be currently running.
    docker-compose -f docker-compose.yml stop
}

teardownNetwork() {
    set -e

    # Shut down the Docker containers for the system tests.
    docker-compose -f docker-compose.yml kill && docker-compose -f docker-compose.yml down

    # remove the local state
    rm -f ~/.hfc-key-store/*

    # remove chaincode docker images
    docker rm $(docker ps -aq)
    docker rmi $(docker images dev-* -q)
}

if [ "${MODE}" == "up" ]; then
    startNetwork
elif [ "${MODE}" == "down" ]; then ## Clear the network
    networkDown
elif [ "${MODE}" == "generate" ]; then ## Generate Artifacts
    generateNetwork
elif [ "${MODE}" == "restart" ]; then ## Restart the network
    stopNetwork
    startNetwork
elif [ "${MODE}" == "teardown" ]; then ## Restart the network
    teardownNetwork