#!/bin/bash

printHelp() {
    echo "Uso: setup_base.sh [opciones]"
    echo
    echo "opciones:"
    echo "-h : muestra esta ayuda"
    echo "-p : instalar prerrequisitos"
    echo "-f : instalar binarios e imagenes de Hyperlegder Fabric"
    echo "-s : iniciar Docker Swarm cluster"
    echo "-d : pull imagenes Docker"
    echo "-v : muestra las versiones de los prerrequisitos"
    echo
    echo "e.g. setup_base.sh -f"
    echo "creara los binarios e imagenes de Hyperledger Fabric"
}


installPrerequisites() {
    echo "---- Instalando Prerrequisitos ----"
    sudo apt-get update -y && sudo apt-get upgrade -y
    # ----------------------------------------------------------------
    # Install cURL
    # ----------------------------------------------------------------
    echo "---- Instalando cURL ----"
    sudo apt install -y curl
    echo

    # ----------------------------------------------------------------
    # Install Git
    # ----------------------------------------------------------------
    echo "---- Instalando git ----"
    sudo apt install -y git
    echo

    # ----------------------------------------------------------------
    # Docker & Docker Compose
    # ----------------------------------------------------------------
    echo "---- Instalando Docker ----"
    sudo apt-get remove docker docker-engine docker.io containerd runc
    sudo apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg-agent \
        software-properties-common
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo apt-key fingerprint 0EBFCD88
    sudo add-apt-repository \
    "deb [arch=arm64] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) \
    stable"
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io

    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -a -G docker ubuntu

    echo "---- Instalando Docker Compose ----"
    sudo apt-get install -y libffi-dev libssl-dev python3 python3-pip
    sudo apt-get remove python-configparser
    sudo pip3 install docker-compose
    echo

    # ----------------------------------------------------------------
    # Install Golang
    # ----------------------------------------------------------------
    echo "---- Instalando Golang ----"
    sudo wget https://storage.googleapis.com/golang/go1.12.17.linux-arm64.tar.gz
    sudo tar -C /usr/local -xzf go1.12.17.linux-arm64.tar.gz
    echo 'export GOROOT=/usr/local/go' >> ~/.profile
    echo 'export GOROOT=/usr/local/go' >> ~/.bashrc
    echo 'export GOPATH=$HOME/go' >> ~/.profile
    echo 'export GOPATH=$HOME/go' >> ~/.bashrc
    echo 'export PATH=$GOPATH/bin:$GOROOT/bin:$PATH' >> ~/.profile
    echo 'export PATH=$GOPATH/bin:$GOROOT/bin:$PATH' >> ~/.bashrc
    source ~/.profile
    echo


    # ----------------------------------------------------------------
    # Install NodeJS
    # ----------------------------------------------------------------
    echo "---- Instalando NodeJS & NPM ----"
    sudo apt-get install -y nodejs npm
    sudo npm install npm@5.6.0 -g
    echo

    # ----------------------------------------------------------------
    # Install Python
    # ----------------------------------------------------------------
    echo "---- Instalando Python ----"
    sudo apt-get install -y python


    echo
    echo
    echo
    showVersion
    echo "Reiniciando en 5 segundos"
    sleep 5
    sudo reboot
}

# ----------------------------------------------------------------
# Hyperledger Fabric
# ----------------------------------------------------------------

installHyperledgerFabric() {
    mkdir -p $HOME/go/src/github.com/hyperledger/
    cd $HOME/go/src/github.com/hyperledger/
    git clone -b project https://github.com/Thejokeri/fabric-baseimage.git
    git clone -b v1.4.4 https://github.com/hyperledger/fabric.git
    git clone -b v1.4.4 https://github.com/hyperledger/fabric-ca.git

    cd $HOME/go/src/github.com/hyperledger/fabric-baseimage
    make docker couchdb kafka zookeeper
    cd $HOME/go/src/github.com/hyperledger/fabric
    make native license spelling linter docker

    if [[ $? -eq 1 ]] ; then
        make docker
    fi

    cd $HOME/go/src/github.com/hyperledger/fabric-ca
    make docker

    echo
    echo
    echo
    echo "---- Mostrando imagenes de Hyperledger Fabric ----"
    docker images
}

# ----------------------------------------------------------------
# Show versions
# ----------------------------------------------------------------

showVersion() {
    echo "---- Mostrand versiones instaladas ----"
    curl --version
    echo
    git --version
    echo
    docker -v
    docker-compose -v
    echo
    go version
    echo
    echo "Node JS"
    node -v
    echo "npm"
    npm -v
    echo
    python --version
    pip3 --version
    echo
    echo $GOPATH
    echo $PATH
}

# ----------------------------------------------------------------
# Docker Pull
# ----------------------------------------------------------------

pullDockerImages() {
    echo "---- Pull Imagenes Hyperledger Fabric ----"
    docker pull thejokeri/fabric-baseos:arm64-0.4.18
    docker pull thejokeri/fabric-baseimage:arm64-0.4.18
    docker pull thejokeri/fabric-couchdb:arm64-0.4.18
    docker pull thejokeri/fabric-kafka:arm64-0.4.18
    docker pull thejokeri/fabric-zookeeper:arm64-0.4.18
    docker pull thejokeri/fabric-peer:arm64-1.4.4
    docker pull thejokeri/fabric-orderer:arm64-1.4.4
    docker pull thejokeri/fabric-ccenv:arm64-1.4.4
    docker pull thejokeri/fabric-buildenv:arm64-1.4.4
    docker pull thejokeri/fabric-tools:arm64-1.4.4
    docker pull thejokeri/fabric-ca:arm64-1.4.4
}

# ----------------------------------------------------------------
# Docker Swarm cluster
# ----------------------------------------------------------------

initDockerSwarm() {
    echo "Se va a iniciar el Docker Swarm, el nodo actual se va a convertir en Master."
    read -p "Continuar? [Y/n] " ans
    case "$ans" in
    y | Y | "")
        docker swarm init
        echo "Una vez asignado los nodos de trabajo, para mostrarlos lance:"
        echo ""
        echo "      docker node ls"
        echo ""
        ;;
    n | N)
        exit 1
        ;;
    *)
        echo "respuesta invalida"
        ;;
    esac
}


if [[ $# -eq 0 ]] ; then
    printHelp
    exit 0
fi

while getopts ":hpfsdv" opt; do
  case ${opt} in
    h|\? ) 
        printHelp
        exit 0
        ;;
    p ) installPrerequisites
        exit 0
        ;;
    f ) installHyperledgerFabric
        exit 0
        ;;
    s ) initDockerSwarm
        exit 0
        ;;
    d ) pullDockerImages
        exit 0
        ;;
    v ) 
        showVersion
        exit 0
        ;;
  esac
done