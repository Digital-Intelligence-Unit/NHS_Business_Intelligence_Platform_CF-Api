/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['local', 'development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  DOMAIN: Env.schema.string.optional(),
  // LOG_LEVEL: Env.schema.string(),

  /*
|----------------------------------------------------------
| Variables for configuring database connection
|----------------------------------------------------------
*/
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  // DB_DATABASE: Env.schema.string(),

  /*
|----------------------------------------------------------
| Variables for configuring session package
|----------------------------------------------------------
*/
  // SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring the drive package
  |----------------------------------------------------------
  */
  AWS_ACCESS_KEY_ID: Env.schema.string.optional(), // For temp credentials
  AWS_SECRET_ACCESS_KEY: Env.schema.string.optional(), // For temp credentials
  AWS_REGION: Env.schema.string.optional(),
})
