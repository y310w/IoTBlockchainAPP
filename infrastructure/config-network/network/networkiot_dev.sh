
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


exportKeys() {
    ROOT_FOLDER=${HOME}/tfg/IoTBlockchainAPP/infrastructure/config-network/network/crypto-config/peerOrganizations/

    # Copiando las claves al docker-compose.yml
    echo
    echo
    echo "Exportando claves de Device peer..."
    export DEVICE_CA_KEY=$(cd ${ROOT_FOLDER}device.networkiot.com/ca/ && ls *_sk)
    
    echo "Exportando claves de Linkage peer..."
    export LINKAGE_CA_KEY=$(cd ${ROOT_FOLDER}linkage.networkiot.com/ca/ && ls *_sk)
}


generateNetwork() {
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
    ../bin_dev/configtxgen -profile OrdererGenesis -channelID networkiot -outputBlock ./channel-artifacts/genesis.block
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar el orderer genesis block..."
    exit 1
    fi

    # generamos la configuracion del canal All
    echo
    echo
    echo "Generando channelall..."
    ../bin_dev/configtxgen -profile ChannelAll -outputCreateChannelTx ./channel-artifacts/channelall.tx -channelID channelall
    if [ "$?" -ne 0 ]; then
    echo "Fallo al generar la configuración del canal All..."
    exit 1
    fi
}


upNetwork() {
    exportKeys
    
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
    docker exec $CLISERVICE peer channel create -o orderer.networkiot.com:7050 -c channelall -f ${CHANNELS}/channelall.tx --tls true --cafile $ORDERER_CA 

    sleep 10
    echo "Done"

    echo
    echo "Uniendo Peer Device al channelAll..."
    echo "Uniendo peer0.device.networkiot.com:7051..."
    docker exec \
    -e CORE_PEER_ADDRESS=peer0.device.networkiot.com:7051 \
    -e CORE_PEER_LOCALMSPID=DeviceMSP \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/device.networkiot.com/users/Admin@device.networkiot.com/msp \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/device.networkiot.com/peers/peer0.device.networkiot.com/tls/ca.crt \
    $CLISERVICE peer channel join -b channelall.block
    echo "Done"
    
    echo
    echo "Uniendo peer1.device.networkiot.com:8051..."
    docker exec \
    -e CORE_PEER_ADDRESS=peer1.device.networkiot.com:8051 \
    -e CORE_PEER_LOCALMSPID=DeviceMSP \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/device.networkiot.com/users/Admin@device.networkiot.com/msp \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/device.networkiot.com/peers/peer1.device.networkiot.com/tls/ca.crt \
    $CLISERVICE peer channel join -b channelall.block
    echo "Done"

    echo
    echo "Uniendo Peer Linkage al channelAll..."
    echo "Uniendo peer0.linkage.networkiot.com:9051..."
    docker exec \
    -e CORE_PEER_ADDRESS=peer0.linkage.networkiot.com:9051 \
    -e CORE_PEER_LOCALMSPID=LinkageMSP \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/linkage.networkiot.com/users/Admin@linkage.networkiot.com/msp \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/linkage.networkiot.com/peers/peer0.linkage.networkiot.com/tls/ca.crt \
    $CLISERVICE peer channel join -b channelall.block
    echo "Done"

    echo
    echo "Uniendo peer1.linkage.networkiot.com:10051..."
    docker exec \
    -e CORE_PEER_ADDRESS=peer1.linkage.networkiot.com:10051 \
    -e CORE_PEER_LOCALMSPID=LinkageMSP \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/linkage.networkiot.com/users/Admin@linkage.networkiot.com/msp \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/linkage.networkiot.com/peers/peer1.linkage.networkiot.com/tls/ca.crt \
    $CLISERVICE peer channel join -b channelall.block
    echo "Done"

    chaincodeOperation
}


chaincodeOperation() {
    CONFIG_ROOT=/opt/gopath/src/github.com/hyperledger/fabric/peer
    DEVICE_MSPCONFIGPATH=${CONFIG_ROOT}/crypto/peerOrganizations/device.networkiot.com/users/Admin@device.networkiot.com/msp
    DEVICE_TLS_ROOTCERT_FILE=${CONFIG_ROOT}/crypto/peerOrganizations/device.networkiot.com/peers/peer0.device.networkiot.com/tls/ca.crt
    LINKAGE_MSPCONFIGPATH=${CONFIG_ROOT}/crypto/peerOrganizations/linkage.networkiot.com/users/Admin@linkage.networkiot.com/msp
    LINKAGE_TLS_ROOTCERT_FILE=${CONFIG_ROOT}/crypto/peerOrganizations/linkage.networkiot.com/peers/peer0.linkage.networkiot.com/tls/ca.crt
    ORDERER_TLS_ROOTCERT_FILE=${CONFIG_ROOT}/crypto/ordererOrganizations/networkiot.com/orderers/orderer.networkiot.com/msp/tlscacerts/tlsca.networkiot.com-cert.pem

    echo
    echo "Instalando chaincode device..."
    docker exec \
    -e CORE_PEER_LOCALMSPID=DeviceMSP \
    -e CORE_PEER_ADDRESS=peer0.device.networkiot.com:7051 \
    -e CORE_PEER_MSPCONFIGPATH=${DEVICE_MSPCONFIGPATH} \
    -e CORE_PEER_TLS_ROOTCERT_FILE=${DEVICE_TLS_ROOTCERT_FILE} \
    $CLISERVICE \
    peer chaincode install \
        -n device \
        -v 1.0 \
        -p github.com/chaincode/device \
        -l golang

    docker exec \
    -e CORE_PEER_LOCALMSPID=DeviceMSP \
    -e CORE_PEER_ADDRESS=peer1.device.networkiot.com:8051 \
    -e CORE_PEER_MSPCONFIGPATH=${DEVICE_MSPCONFIGPATH} \
    -e CORE_PEER_TLS_ROOTCERT_FILE=${DEVICE_TLS_ROOTCERT_FILE} \
    $CLISERVICE \
    peer chaincode install \
        -n device \
        -v 1.0 \
        -p github.com/chaincode/device \
        -l golang

    echo
    echo "Instanciando Smart Contract Device en channelAll"
    docker exec \
    -e CORE_PEER_LOCALMSPID=DeviceMSP \
    -e CORE_PEER_MSPCONFIGPATH=${DEVICE_MSPCONFIGPATH} \
    $CLISERVICE \
    peer chaincode instantiate \
        -o orderer.networkiot.com:7050 \
        -C channelall \
        -n device \
        -l golang \
        -v 1.0 \
        -c '{"Args":[]}' \
        -P "AND('DeviceMSP.member')" \
        --tls \
        --cafile ${ORDERER_TLS_ROOTCERT_FILE} \
        --peerAddresses peer0.device.networkiot.com:7051 \
        --tlsRootCertFiles ${DEVICE_TLS_ROOTCERT_FILE}

    echo "Esperando a que la petición de instanciación sea enviada..."
    sleep 10

    echo "Enviando transaccion initDevice a channelall"
    echo "La transaccion se mando a los dos peers peer0.device.networkiot.com y peer1.device.networkiot.com"
    docker exec \
    -e CORE_PEER_LOCALMSPID=DeviceMSP \
    -e CORE_PEER_MSPCONFIGPATH=${DEVICE_MSPCONFIGPATH} \
    $CLISERVICE \
    peer chaincode invoke \
        -o orderer.networkiot.com:7050 \
        -C channelall \
        -n device \
        -c '{"function":"initDevice","Args":[]}' \
        --waitForEvent \
        --tls \
        --cafile ${ORDERER_TLS_ROOTCERT_FILE} \
        --peerAddresses peer0.device.networkiot.com:7051 \
        --peerAddresses peer1.device.networkiot.com:8051 \
        --tlsRootCertFiles ${DEVICE_TLS_ROOTCERT_FILE} \
        --tlsRootCertFiles ${DEVICE_TLS_ROOTCERT_FILE}

# ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    echo
    echo "Instalando chaincode linkage..."
    docker exec \
    -e CORE_PEER_LOCALMSPID=LinkageMSP \
    -e CORE_PEER_ADDRESS=peer0.linkage.networkiot.com:9051 \
    -e CORE_PEER_MSPCONFIGPATH=${LINKAGE_MSPCONFIGPATH} \
    -e CORE_PEER_TLS_ROOTCERT_FILE=${LINKAGE_TLS_ROOTCERT_FILE} \
    $CLISERVICE \
    peer chaincode install \
        -n linkage \
        -v 1.0 \
        -p github.com/chaincode/linkage \
        -l golang

    docker exec \
    -e CORE_PEER_LOCALMSPID=LinkageMSP \
    -e CORE_PEER_ADDRESS=peer1.linkage.networkiot.com:10051 \
    -e CORE_PEER_MSPCONFIGPATH=${LINKAGE_MSPCONFIGPATH} \
    -e CORE_PEER_TLS_ROOTCERT_FILE=${LINKAGE_TLS_ROOTCERT_FILE} \
    $CLISERVICE \
    peer chaincode install \
        -n linkage \
        -v 1.0 \
        -p github.com/chaincode/linkage \
        -l golang

    echo
    echo "Instanciando Smart Contract Linkage en channelAll"
    docker exec \
    -e CORE_PEER_LOCALMSPID=LinkageMSP \
    -e CORE_PEER_MSPCONFIGPATH=${LINKAGE_MSPCONFIGPATH} \
    $CLISERVICE \
    peer chaincode instantiate \
        -o orderer.networkiot.com:7050 \
        -C channelall \
        -n linkage \
        -l golang \
        -v 1.0 \
        -c '{"Args":[]}' \
        -P "AND('LinkageMSP.member')" \
        --tls \
        --cafile ${ORDERER_TLS_ROOTCERT_FILE} \
        --peerAddresses peer0.linkage.networkiot.com:9051 \
        --tlsRootCertFiles ${LINKAGE_TLS_ROOTCERT_FILE}

    echo "Esperando a que la petición de instanciación sea enviada..."
    sleep 10

    echo "Enviando transaccion initLinkage a channelall"
    echo "La transaccion se mando a los dos peers peer0.linkage.networkiot.com y peer1.linkage.networkiot.com"
    docker exec \
    -e CORE_PEER_LOCALMSPID=LinkageMSP \
    -e CORE_PEER_MSPCONFIGPATH=${LINKAGE_MSPCONFIGPATH} \
    $CLISERVICE \
    peer chaincode invoke \
        -o orderer.networkiot.com:7050 \
        -C channelall \
        -n linkage \
        -c '{"function":"initLinkage","Args":[]}' \
        --waitForEvent \
        --tls \
        --cafile ${ORDERER_TLS_ROOTCERT_FILE} \
        --peerAddresses peer0.linkage.networkiot.com:9051 \
        --peerAddresses peer1.linkage.networkiot.com:10051 \
        --tlsRootCertFiles ${LINKAGE_TLS_ROOTCERT_FILE} \
        --tlsRootCertFiles ${LINKAGE_TLS_ROOTCERT_FILE}
}


removeNetwork() {
    exportKeys

    echo "Parando servicios..."
    docker-compose -f docker-compose-dev.yaml down --volumes --remove-orphans
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