FROM node:14.15.3-alpine
RUN apk add g++ make python
ARG PGDATABASE
ENV PGDATABASE ${PGDATABASE}
ARG PGPORT=5432
ENV PGPORT ${PGPORT}
ARG AWSPROFILE
ENV AWSPROFILE ${AWSPROFILE}
ARG JWT_SECRET
ENV JWT_SECRET ${JWT_SECRET}
ARG JWT_SECRETKEY
ENV JWT_SECRETKEY ${JWT_SECRETKEY}
ARG POSTGRES_UN
ENV POSTGRES_UN ${POSTGRES_UN}
ARG POSTGRES_PW
ENV POSTGRES_PW ${POSTGRES_PW}
ARG AWS_SECRETID
ENV AWS_SECRETID ${AWS_SECRETID}
ARG AWS_SECRETKEY
ENV AWS_SECRETKEY ${AWS_SECRETKEY}
ARG SITE_URL
ENV SITE_URL ${SITE_URL}
ARG TABLENAME
ENV TABLENAME ${TABLENAME}
ARG API_KEY
ENV API_KEY ${API_KEY}
ENV API_NAME=api-cfserver, AWSREGION=eu-west-2
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
EXPOSE 8079
CMD npm start