FROM node:14.21.3-alpine
RUN apk add g++ make python3

ARG PGDATABASE
ENV PGDATABASE ${PGDATABASE}
ARG PGPORT=5432
ENV PGPORT ${PGPORT}
ARG POSTGRES_UN
ENV POSTGRES_UN ${POSTGRES_UN}
ARG POSTGRES_PW
ENV POSTGRES_PW ${POSTGRES_PW}

ARG SITE_URL
ENV SITE_URL ${SITE_URL}

ARG TABLENAME
ENV TABLENAME ${TABLENAME}

ENV API_NAME=api-cfserver

WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .

EXPOSE 8079

CMD npm start