import env from '#start/env'
import { defineConfig } from '@adonisjs/auth'
import { InferAuthEvents, Authenticators } from '@adonisjs/auth/types'
import { sessionGuard } from '@adonisjs/auth/session'

import app from '@adonisjs/core/services/app';
import { JwtGuard } from 'diu-data-functions/guards/jwt';
import { dynamoSessionUserProvider } from 'diu-data-functions/providers/session_dynamo'

const authConfig = defineConfig({
    default: 'web',
    guards: {
        web: sessionGuard({
            useRememberMeTokens: false,
            provider: dynamoSessionUserProvider(),
        }),
        jwt: {
            resolver: async () => {
                // Load provider
                const provider = await dynamoSessionUserProvider().resolver(app);

                // Return guard
                return (ctx) => new JwtGuard(ctx, provider, {
                    secret: env.get('APP_KEY'),
                })
            }
        }
    },
})

export default authConfig

/**
 * Inferring types from the configured auth
 * guards.
 */
declare module '@adonisjs/auth/types' {
    interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}
declare module '@adonisjs/core/types' {
    interface EventsList extends InferAuthEvents<Authenticators> {}
}
