FROM node:7

EXPOSE 8080
RUN mkdir /app
WORKDIR /app

COPY . /app

RUN rm -fr node_modules && find ./apps -maxdepth 2 -type d -name 'node_modules' -exec rm -fr {} \;
RUN npm install && find ./apps -maxdepth 2 -type f -name 'package.json' -exec bash -c 'cd $(dirname {}) && npm install' \;

CMD ["npm", "start"]
