FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 5001

CMD ["npx", "nodemon", "src/index.js"]
