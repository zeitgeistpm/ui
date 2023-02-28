FROM node:16-alpine
WORKDIR /ui
COPY . .
RUN yarn install
RUN yarn build
EXPOSE 3000