FROM node:12-slim

WORKDIR /server/api

COPY package*.json /server/api/

RUN npm install

COPY . .

EXPOSE 8080
CMD npm run build && npm start