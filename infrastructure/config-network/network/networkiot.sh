#!/bin/bash


printHelp() {
    echo "Uso: networkiot.sh [help, up, down, generate, restart, remove]"
    echo
    echo "Comandos:"
    echo "  help        Mostrar esta ayuda"
    echo "  up          Activar red"
    echo "  down        Desactivar red"
    echo "  generate    Generar red"
    echo "  restart     Reiniciar red"
    echo "  remove      Eliminar red"
    echo
}


generateNetwork() {    
    mkdir ./channel-artifacts/anchors
    
    # generamos crypto material
    ../bin/cryptogen generate --config=./crypto-config.yaml
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar crypto material..."
    exit 1
    fi

    # generamos bloque genesis para el orderer
    ../bin/configtxgen -profile OrdererGenesis -outputBlock ./channel-artifacts/genesis.block
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar el orderer genesis block..."
    exit 1
    fi

    # generamos la configuracion del canal Sensor
    ../bin/configtxgen -profile SensorChannel -outputCreateChannelTx ./channel-artifacts/sensorChannel.tx -channelID sensorchannel
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar la configuración del canal Sensor..."
    exit 1
    fi

    # generamos el anchor peer transaction
    ../bin/configtxgen -profile SensorChannel -outputAnchorPeersUpdate ./channel-artifacts/anchors/SensorMSPanchors.tx -channelID shanchor -asOrg SensorMSP
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar el anchor peer para SensorMSP..."
    exit 1
    fi

    # generamos el anchor peer transaction
    ../bin/configtxgen -profile SensorChannel -outputAnchorPeersUpdate ./channel-artifacts/anchors/SHandlerMSPanchors.tx -channelID hsanchor -asOrg HandlerMSP
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar el anchor peer de Sensor para HandlerMSP..."
    exit 1
    fi

    # generamos la configuracion del canal Linkage
    ../bin/configtxgen -profile LinkageChannel -outputCreateChannelTx ./channel-artifacts/linkageChannel.tx -channelID linkagechannel
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar la configuración del canal Linkage..."
    exit 1
    fi

    # generamos el anchor peer transaction
    ../bin/configtxgen -profile LinkageChannel -outputAnchorPeersUpdate ./channel-artifacts/anchors/LinkageMSPanchors.tx -channelID lhanchor -asOrg LinkageMSP
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar el anchor peer para LinkageMSP..."
    exit 1
    fi

    # generamos el anchor peer transaction
    ../bin/configtxgen -profile LinkageChannel -outputAnchorPeersUpdate ./channel-artifacts/anchors/LHandlerMSPanchors.tx -channelID hlanchor -asOrg HandlerMSP
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar el anchor peer de Linkage para HandlerMSP..."
    exit 1
    fi

    rsync -r channel-artifacts/ ubuntu@192.168.0.31:$PWD/channel-artifacts
    rsync -r crypto-config/ ubuntu@192.168.0.31:$PWD/crypto-config

    rsync -r channel-artifacts/ ubuntu@192.168.0.32:$PWD/channel-artifacts
    rsync -r crypto-config/ ubuntu@192.168.0.32:$PWD/crypto-config
}


startNetwork() {
    set -ev

    docker stack deploy --compose-file docker-compose.yaml blockchainIoT
    docker stack ps blockchainIoT
    docker ps -a
    docker service ls

    # Create the channel
    docker exec -it $(docker ps --format='{{.Names}}' | grep clid) bash
    peer channel create -t 10 -o orderer.networkiot.com:7050 -c sensorchannel -f /etc/hyperledger/configtx/sensorChannel.tx --tls true --cafile $ORDERER_CA

    peer channel update -o orderer.example.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/${CORE_PEER_LOCALMSPID}anchors.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA

    # Join peer0.sensor.networkiot.com to the channel.
    peer channel join -b $CHANNEL_NAME.block
    peer chaincode install -n mycc -v 1.0 -p github.com/hyperledger/fabric/examples/chaincode/go/chaincode_example02

    peer chaincode instantiate -o orderer.example.com:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C $CHANNEL_NAME -n mycc -v 1.0 -c '{"Args":["init","a","100","b","200"]}' -P "OR	('Org1MSP.member','Org2MSP.member')"
}


stopNetwork() {
    set -ev

    # Apagamos los docker images que esten corriendo
    docker stack rm blockchainIoT
}


removeNetwork() {
    stopNetwork

    # eliminamos cualquier configuracion
    rm -fr channel-artifacts/*
    rm -fr crypto-config
}


MODE=$1

if [ "${MODE}" == "up" ]; then                              # Activar red
    startNetwork
elif [ "${MODE}" == "down" ]; then                          # Desactivar red
    stopNetwork
elif [ "${MODE}" == "generate" ]; then                      # Generar red
    generateNetwork
elif [ "${MODE}" == "restart" ]; then                       # Reiniciar red
    startNetwork
    stopNetwork
elif [ "${MODE}" == "remove" ]; then                        # Eliminar red
    removeNetwork
elif [ "${MODE}" == "" ] || [ "${MODE}" == "help" ]; then   # Mostrar la ayuda 
    printHelp
    exit 0
fi