FROM node:16-alpine
WORKDIR /ui
COPY . .
RUN yarn install
COPY . .
EXPOSE 3000