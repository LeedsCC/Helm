FROM node:13.14.0-alpine3.10

ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

COPY package.json package-lock.json ./

RUN yarn install --production

COPY . .

CMD ["npm", "start"]
