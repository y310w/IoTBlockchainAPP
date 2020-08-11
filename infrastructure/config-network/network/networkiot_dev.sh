
#!/bin/bash


printHelp() {
    echo "Uso: networkiot.sh [help, up, down, generate, restart, remove]"
    echo
    echo "Comandos:"
    echo "  help        Mostrar esta ayuda"
    echo "  up          Activar red"
    echo "  generate    Generar red"
    echo "  remove      Eliminar red"
    echo "  all         Generar y Activar red"
    echo
}


generateNetwork() {
    ROOT_FOLDER=${HOME}/tfg/IoTBlockchainAPP/infrastructure/config-network/network/crypto-config/peerOrganizations/

    echo "Generando certificados con cryptogen..."
    # generamos crypto material
    ../bin_dev/cryptogen generate --config=./crypto-config.yaml
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar crypto material..."
    exit 1
    fi

    # generamos bloque genesis para el orderer
    echo
    echo
    echo "Generando bloque genesis..."
    ../bin_dev/configtxgen -profile OrdererGenesis -outputBlock ./channel-artifacts/genesis.block
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar el orderer genesis block..."
    exit 1
    fi

    # generamos la configuracion del canal All
    echo
    echo
    echo "Generando channelall..."
    ../bin_dev/configtxgen -profile ChannelAll -outputCreateChannelTx ./channel-artifacts/channelAll.tx -channelID channelall
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar la configuración del canal All..."
    exit 1
    fi

    # generamos la configuracion del canal Device
    echo
    echo
    echo "Generando devicechannel..."
    ../bin_dev/configtxgen -profile DeviceChannel -outputCreateChannelTx ./channel-artifacts/deviceChannel.tx -channelID devicechannel
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar la configuración del canal Device..."
    exit 1
    fi

    # generamos la configuracion del canal Linkage
    echo
    echo
    echo "Generando linkagechannel.."
    ../bin_dev/configtxgen -profile LinkageChannel -outputCreateChannelTx ./channel-artifacts/linkageChannel.tx -channelID linkagechannel
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar la configuración del canal Linkage..."
    exit 1
    fi

    # Copiando las claves al docker-compose.yml
    echo
    echo
    echo "Exportando claves de Device peer..."
    export DEVICE_CA_KEY=$(cd ${ROOT_FOLDER}device.networkiot.com/ca/ && ls *_sk)

    echo "Exportando claves de Handler peer..."
    export HANDLER_CA_KEY=$(cd ${ROOT_FOLDER}handler.networkiot.com/ca/ && ls *_sk)
    
    echo "Exportando claves de Linkage peer..."
    export LINKAGE_CA_KEY=$(cd ${ROOT_FOLDER}linkage.networkiot.com/ca/ && ls *_sk)

    echo
    echo "Creando red networkiot..."
    docker network create networkiot
    echo "Done"
}


upNetwork() {
    set -ev

    BASE=/opt/gopath/src/github.com/hyperledger/fabric/peer/

    ORDERER_CA=${BASE}crypto/ordererOrganizations/networkiot.com/orderers/orderer.networkiot.com/msp/tlscacerts/tlsca.networkiot.com-cert.pem
    CHANNELS=${BASE}channel-artifacts

    echo "Iniciando servicios..."
    docker-compose -f docker-compose-dev.yaml up -d
    
    sleep 10
    
    docker container ls

    CLISERVICE=`docker ps --format='{{.Names}}' | grep cli`

    echo
    # Crear canal All
    echo "Creando canal channelall"
    docker exec -it $CLISERVICE peer channel create -o orderer.networkiot.com:7050 -c channelall -f ${CHANNELS}/channelAll.tx --cafile $ORDERER_CA

    echo
    # Crear canal device
    echo "Creando canal devicechannel"
    docker exec -it $CLISERVICE peer channel create -o orderer.networkiot.com:7050 -c devicechannel -f ${CHANNELS}/deviceChannel.tx --cafile $ORDERER_CA
    
    echo
    # Crear canal linkage
    echo "Creando canal linkagechannel"
    docker exec -it $CLISERVICE peer channel create -o orderer.networkiot.com:7050 -c linkagechannel -f ${CHANNELS}/linkageChannel.tx --cafile $ORDERER_CA
    
    sleep 10
    echo "Done"

    echo
    #Unir handler al canal device
    echo "Uniendo Peer Handler al devicechannel..."
    docker exec -it $CLISERVICE peer channel join -b devicechannel.block
    echo "Done"

    echo
    #Unir handler al canal linkage
    echo "Uniendo Peer Handler al linkagechannel..."
    docker exec -it $CLISERVICE peer channel join -b linkagechannel.block
    echo "Done"

    echo
    #Unir handler al canal All
    echo "Uniendo Peer Handler al channelAll..."
    docker exec -it $CLISERVICE peer channel join -b channelall.block
    echo "Done"

    echo
    echo "Uniendo Peer Device al devicechannel..."
    docker exec -e "CORE_PEER_LOCALMSPID=DeviceMSP" \
    -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/device.networkiot.com/users/Admin@device.networkiot.com/msp" \
    -e "CORE_PEER_ADDRESS=peer0.device.networkiot.com:7051" \
    -it $CLISERVICE peer channel join -b devicechannel.block

    echo
    echo "Uniendo Peer Device al channelAll..."
    docker exec -e "CORE_PEER_LOCALMSPID=DeviceMSP" \
    -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/device.networkiot.com/users/Admin@device.networkiot.com/msp" \
    -e "CORE_PEER_ADDRESS=peer0.device.networkiot.com:7051" \
    -it $CLISERVICE peer channel join -b channelall.block
    echo "Done"

    echo
    echo "Uniendo Peer Linkage al linkagechannel..."
    docker exec -e "CORE_PEER_LOCALMSPID=LinkageMSP" \
    -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/linkage.networkiot.com/users/Admin@linkage.networkiot.com/msp" \
    -e "CORE_PEER_ADDRESS=peer0.linkage.networkiot.com:7051" \
    -it $CLISERVICE peer channel join -b linkagechannel.block

    echo
    echo "Uniendo Peer Linkage al channelAll..."
    docker exec -e "CORE_PEER_LOCALMSPID=LinkageMSP" \
    -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/linkage.networkiot.com/users/Admin@linkage.networkiot.com/msp" \
    -e "CORE_PEER_ADDRESS=peer0.linkage.networkiot.com:7051" \
    -it $CLISERVICE peer channel join -b channelall.block
    echo "Done"

    chaincodeOperation
}


chaincodeOperation() {
    echo
    echo "Instalando chaincode device..."
    docker exec -it $CLISERVICE peer chaincode install -n device -p github.com/chaincode/device -v 1.0

    sleep 5

    echo
    docker exec -it $CLISERVICE peer chaincode instantiate -o orderer.networkiot.com:7050 -C devicechannel -n device -v 1.0 --cafile $ORDERER_CA -c '{"Args": []}' -P "OR('DeviceMSP.member', 'HandlerMSP.member')"
    echo "Done"

    sleep 5

    echo
    docker exec -it $CLISERVICE peer chaincode invoke -o orderer.networkiot.com:7050 -C devicechannel -n device -c '{"function":"Init", "Args": []}'
    echo "Done"


    #echo
    #echo "Instalando chaincode linkage..."
    #docker exec -it $CLISERVICE peer chaincode install -n linkage -p github.com/chaincode/linkage -v 1.0
    
    #echo
    #docker exec -it $CLISERVICE peer chaincode instantiate -o orderer.networkiot.com:7050 -C linkagechannel -n linkage -v 1.0 --cafile $ORDERER_CA -c '{"function":"Init", "Args": []}' -P "OR('LinkageMSP.member', 'HandlerMSP.member')"
    #echo "Done"
}


removeNetwork() {
    echo "Parando servicios..."
    docker-compose -f docker-compose-dev.yaml down
    echo "Done"

    echo
    echo "Eliminando red networkiot..."
    docker network rm networkiot
    echo "Done"

    # eliminamos cualquier configuracion
    echo
    echo "Eliminando configuracion previa..."
    rm -fr channel-artifacts/*
    rm -fr crypto-config
    echo "Done"
}


MODE=$1

if [ "${MODE}" == "up" ]; then          # Activar red
    upNetwork
elif [ "${MODE}" == "generate" ]; then  # Generar red
    generateNetwork
elif [ "${MODE}" == "remove" ]; then    # Eliminar red
    removeNetwork
elif [ "${MODE}" == "all" ]; then       # Generar y activar
    generateNetwork
    sleep 10
    upNetwork
elif [ "${MODE}" == "" ] || [ "${MODE}" == "help" ]; then   # Mostrar la ayuda 
    printHelp
    exit 0
fi