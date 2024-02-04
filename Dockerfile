FROM node:21-alpine

LABEL author="Jørgen Pettersen"

WORKDIR /app

# Layer caching to avoid waiting forever to re-install dependencies.
COPY package*.json .

RUN npm install

COPY . .

#EXPOSE 3000

CMD ["npm", "run", "test"]