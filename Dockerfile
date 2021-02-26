FROM node:lts-alpine
ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

WORKDIR /usr/local/spotistats-api
COPY package.json package-lock.json ./

COPY . ./

# Install dependenices
RUN npm install

# Generate Prisma typings
RUN npx prisma generate

# Compile everything
RUN node compile

EXPOSE 3000

CMD [ "node", "dist/" ]
