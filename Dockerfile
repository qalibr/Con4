FROM node:21-alpine

WORKDIR /app

# Layer caching to avoid waiting forever to re-install dependencies.
COPY package*.json .

RUN npm install

COPY . .

CMD ["npm", "run", "dev"]