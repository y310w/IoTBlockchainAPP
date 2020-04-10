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
