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
    # eliminamos cualquier configuracion previa
    rm -fr channel-artifacts/*
    rm -fr crypto-config
    
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

    # generamos la configuracion del canal Device
    ../bin/configtxgen -profile DeviceChannel -outputCreateChannelTx ./channel-artifacts/deviceChannel.tx -channelID devicechannel
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar la configuración del canal Device..."
    exit 1
    fi

    # generamos el anchor peer transaction
    ../bin/configtxgen -profile DeviceChannel -outputAnchorPeersUpdate ./channel-artifacts/anchors/DeviceMSPanchors.tx -channelID dhanchor -asOrg DeviceMSP
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar el anchor peer para DeviceMSP..."
    exit 1
    fi

    # generamos el anchor peer transaction
    ../bin/configtxgen -profile DeviceChannel -outputAnchorPeersUpdate ./channel-artifacts/anchors/DHandlerMSPanchors.tx -channelID hdanchor -asOrg HandlerMSP
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar el anchor peer de Device para HandlerMSP..."
    exit 1
    fi

    # generamos la configuracion del canal Region
    ../bin/configtxgen -profile RegionChannel -outputCreateChannelTx ./channel-artifacts/regionChannel.tx -channelID regionchannel
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar la configuración del canal Region..."
    exit 1
    fi

    # generamos el anchor peer transaction
    ../bin/configtxgen -profile RegionChannel -outputAnchorPeersUpdate ./channel-artifacts/anchors/RegionMSPanchors.tx -channelID rhanchor -asOrg RegionMSP
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar el anchor peer para RegionMSP..."
    exit 1
    fi

    # generamos el anchor peer transaction
    ../bin/configtxgen -profile RegionChannel -outputAnchorPeersUpdate ./channel-artifacts/anchors/RHandlerMSPanchors.tx -channelID hranchor -asOrg HandlerMSP
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar el anchor peer de Region para HandlerMSP..."
    exit 1
    fi
}


startNetwork() {
    set -ev

    docker-compose -f docker-compose.yaml down

    rsync -r channel-artifacts/ ubuntu@192.168.0.32:~/channel-artifacts
    rsync -r crypto-config/ ubuntu@192.168.0.32:~/crypto-config
    rsync -r ../chaincode/ ubuntu@192.168.0.32:~/../chaincode
    
    docker stack deploy --compose-file docker-compose.yaml blockchain && docker ps
    docker-compose -f docker-compose.yaml up -d
    docker ps -a

    
    # Esperarmos a que este todo montado
    export FABRIC_START_TIMEOUT=10
    sleep ${FABRIC_START_TIMEOUT}

    # Create the channel
    docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c mychannel -f /etc/hyperledger/configtx/channel.tx
    # Join peer0.org1.example.com to the channel.
    docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b mychannel.block
}


stopNetwork() {
    set -ev

    docker stack rm blockchain
    # Apagamos los docker images que esten corriendo
    docker-compose -f docker-compose.yaml stop
}


removeNetwork() {
    set -e

    # Apagamos los docker images que esten corriendo
    docker-compose -f docker-compose.yaml kill && docker-compose -f docker-compose.yaml down

    # eliminamos el estado local
    rm -f ~/.hfc-key-store/*

    # eliminamos los docker de chaincode
    docker rm $(docker ps -aq)
    docker rmi $(docker images dev-* -q)
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