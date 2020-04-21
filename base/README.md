# Montaje de la infraestructura

Para el montaje de la red Blockchain se ha utilizado 5 Raspberries Pi:

- 3 Raspberries Pi 4 Modelo B+ 2GB, que servirán como nodos principales para la red.
- Actuador (Raspberry Pi 2 Modelo B+) y sensor (Raspberry Pi 3 Modelo B+) para simular la red domótica.


## Instalación del SO

El sistema operativo utilizado es [Ubuntu Server 18.04](https://ubuntu.com/download/raspberry-pi/thank-you?version=18.04.4&architecture=arm64+raspi3) la versión de 64-bit, que se puede encontrar en la [página oficial de Raspberry](https://www.raspberrypi.org/downloads/).

Para la instalación seguimos los pasos aconsejados en la misma página de instalación de Ubuntu. Necesitaremos: 

- tarjeta microSD.
- Imagen de Ubuntu Server.

Una vez descargada la imagen de Ubuntu Server vamos a crear un punto de arranque en la tarjeta microSD.

Desde un terminal mostramos los dispositivos:

```bash
diskutil list
```

Desmontamos el dispositivo de la tarjeta microSD:

```bash
diskutil unmountDisk <dirección dispositivo>
```

Procedemos a copiar la imagen en la tarjeta microSD, utilizando el siguiente comando:

```bash
sudo sh -c 'gunzip -c ~/Downloads/<imagen> | sudo dd of=<dirección dispositivo> bs=32m'
```

## Configuración de las máquinas

Una vez instalado el sistema operativo, vamos a establecer la dirección estática a cada una de las Raspberries para evitar la asignación por DHCP, para ello módificamos el fichero `/etc/netplan/50-cloud-init.yaml` con la siguiente configuración:

```yaml
network:
    renderer: networkd
    ethernets:
        eth0:
            addresses: [<dirección>/<máscara>]
            gateway4: <default gateway>
            nameservers:
                addresses: [<dirección_dns>]
    version: 2
```

Y aplicamos los cambios con el siguiente comando:

```bash
sudo netplan apply
```

## Instalación de Hyperledger Fabric 1.4.4

Para la instalación de [Hyperledger Fabric (1.4.4)](https://hyperledger-fabric.readthedocs.io/en/release-1.4/) necesitaremos que cada nodo tengan los siguientes requisitos instalados:

- cURL.
- git.
- Docker version 17.06.2-ce o mayor.
- Docker Compose 1.14.0 o mayor.
- Go version 1.12.x
- Node.js
- npm version 5.6.0
- Python 2.7

Una vez instalado los requisitos procedemos a la creación de las imagenes de Hyperledger Fabric a partir de los binarios. Actualmente [no hay soporte](https://jira.hyperledger.org/browse/FAB-11117?jql=text%20~%20%22aarch64%22) para **arquitecturas ARM** ya que Hyperledger sólamente soporta las siguientes arquitecturas:

- amd64
- s390x
- ppc64le

Por tanto el principal objetivo y uno de los obstáculos importantes, es conseguir que Hyperledger Fabric corriera en Raspberry Pi.

Para ello, realice la construcción de mis propias imagenes de Docker que se pueden encontrar en mi [DockerHub](https://hub.docker.com/search?q=thejokeri&type=image&architecture=arm64). 

```bash
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
```


A continuación voy a explicar qué cambios he tenido que realizar para realizar la construcción de las imágenes.


En primer lugar, el código fuente de Hyperledger Fabric está distribuido en dos repositorios git: **fabric-baseimage** y **fabric**.

### fabric-baseimage

Para poder llevar acabo la construcción de las imágenes Docker, he forkeado el repositorio de [Hyperledger / fabric-baseimage](https://github.com/hyperledger/fabric-baseimage) desde la etiqueta *v0.4.18* y he realizado los siguientes [cambios](https://github.com/Thejokeri/fabric-baseimage/commit/f3dfc7bcbdbd62c0c391aa3ce7eeb594ed6a3309) para construir las imágenes con la última versión de **arm64v8**. Todos estos cambios se pueden encontrar en la rama *project*.

```bash
git clone -b project https://github.com/Thejokeri/fabric-baseimage.git
```

Con la siguiente orden del Makefile:

```bash
make docker couchdb kafka zookeeper
```

generamos las imágenes:

- fabric-baseos
- fabric-baseimage
- fabric-couchdb
- fabric-kafka
- fabric-zookeeper

### fabric

Desde el repositorio oficial, clonamos desde la rama *v1.4.4*:

```bash
git clone -b v1.4.4 https://github.com/hyperledger/fabric.git
```

Y lanzamos la siguiente orden Makefile, para generar las imágenes restantes de Hyperledger:

```bash
make native license spelling linter docker
```

- fabric-tools
- fabric-buildenv
- fabric-ccenv
- orderer
- peer

El resultado final es el siguiente:

```bash
ubuntu@ubuntu:~$ docker images
REPOSITORY                     TAG                              IMAGE ID            CREATED             SIZE
hyperledger/fabric-tools       arm64-1.4.4-snapshot-7917a40ff   c9704ea000a9        5 days ago          1.65GB
hyperledger/fabric-tools       arm64-latest                     c9704ea000a9        5 days ago          1.65GB
hyperledger/fabric-tools       latest                           c9704ea000a9        5 days ago          1.65GB
hyperledger/fabric-ccenv       arm64-1.4.4-snapshot-7917a40ff   2cb90301ea98        5 days ago          1.51GB
hyperledger/fabric-ccenv       arm64-latest                     2cb90301ea98        5 days ago          1.51GB
hyperledger/fabric-ccenv       latest                           2cb90301ea98        5 days ago          1.51GB
hyperledger/fabric-buildenv    arm64-1.4.4-snapshot-7917a40ff   92dd3b26051b        5 days ago          1.56GB
hyperledger/fabric-buildenv    arm64-latest                     92dd3b26051b        5 days ago          1.56GB
hyperledger/fabric-buildenv    latest                           92dd3b26051b        5 days ago          1.56GB
hyperledger/fabric-orderer     arm64-1.4.4-snapshot-7917a40ff   b221ec6cab07        5 days ago          114MB
hyperledger/fabric-orderer     arm64-latest                     b221ec6cab07        5 days ago          114MB
hyperledger/fabric-orderer     latest                           b221ec6cab07        5 days ago          114MB
hyperledger/fabric-peer        arm64-1.4.4-snapshot-7917a40ff   8a828c6b69c7        5 days ago          121MB
hyperledger/fabric-peer        arm64-latest                     8a828c6b69c7        5 days ago          121MB
hyperledger/fabric-peer        latest                           8a828c6b69c7        5 days ago          121MB
hyperledger/fabric-zookeeper   arm64-0.4.18                     77c8822313d8        5 days ago          362MB
hyperledger/fabric-zookeeper   latest                           77c8822313d8        5 days ago          362MB
hyperledger/fabric-kafka       arm64-0.4.18                     d153e494662e        5 days ago          355MB
hyperledger/fabric-kafka       latest                           d153e494662e        5 days ago          355MB
hyperledger/fabric-couchdb     arm64-0.4.18                     ac0765e291e2        5 days ago          357MB
hyperledger/fabric-couchdb     latest                           ac0765e291e2        5 days ago          357MB
hyperledger/fabric-baseimage   arm64-0.4.18                     b669e04bdf51        5 days ago          1.46GB
hyperledger/fabric-baseimage   latest                           b669e04bdf51        5 days ago          1.46GB
hyperledger/fabric-baseos      arm64-0.4.18                     45157e979a2f        5 days ago          73.4MB
hyperledger/fabric-baseos      latest                           45157e979a2f        5 days ago          73.4MB
arm64v8/ubuntu                 bionic                           428b2f74b0fb        3 weeks ago         57.7MB
arm64v8/ubuntu                 xenial                           11f8c8b83194        7 weeks ago         112MB
golang                         1.13.8-alpine                    b98704846f0c        8 weeks ago         353MB
adoptopenjdk/openjdk8          aarch64-ubuntu-jdk8u222-b10      4263f1002511        6 months ago        301MB

```