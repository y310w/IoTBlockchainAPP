#!/bin/bash

rm -rf wallet/ config/crypto-config
cp -r ../../infrastructure/config-network/network/crypto-config ./config/crypto-config
npm install
node config/enrollAdmin.js && node config/registerUser.js
npm run build 
npm start