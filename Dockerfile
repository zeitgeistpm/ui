FROM node:16-alpine
WORKDIR /ui
COPY . .
RUN yarn install
EXPOSE 3000