FROM node:20.12.2-alpine3.18 as base

# Set environment variables
ARG AWSPROFILE
ENV AWSPROFILE ${AWSPROFILE}
ARG AWS_SECRETID
ENV AWS_ACCESS_KEY_ID ${AWS_SECRETID}
ARG AWS_SECRETKEY
ENV AWS_SECRET_ACCESS_KEY ${AWS_SECRETKEY}
ENV AWS_REGION "eu-west-2"

ARG PGDATABASE
ENV DB_HOST ${PGDATABASE}
ARG PGPORT
ENV DB_PORT ${PGPORT}
ARG POSTGRES_UN
ENV DB_USER ${POSTGRES_UN}
ARG POSTGRES_PW
ENV DB_PASSWORD ${POSTGRES_PW}

ARG SITE_URL
ENV DOMAIN ${SITE_URL}
ARG APP_KEY
ENV APP_KEY ${APP_KEY}
ARG ENV
ENV NODE_ENV ${ENV}
ENV PORT 8078
ENV HOST 0.0.0.0

# Production only deps stage
FROM base as production-deps
WORKDIR /app
ADD package.json package-lock.json ./
RUN npm ci --omit=dev

# Build stage
FROM base as build
WORKDIR /app
COPY --from=production-deps /app/node_modules /app/node_modules
ADD . .
RUN npm run build
RUN npm run docs:generate

# Production stage
FROM base
WORKDIR /app
COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app
COPY --from=build /app/swagger.yml /app/
COPY --from=build /app/swagger.json /app/
RUN mkdir /app/storage

EXPOSE 8078
CMD ["node", "./bin/server.js"]