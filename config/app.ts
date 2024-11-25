import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { Secret } from '@adonisjs/core/helpers'
import { defineConfig } from '@adonisjs/core/http'

/**
 * Set timezone for luxon
 */
import { Settings } from "luxon";
Settings.defaultZone = "Europe/London";

/**
 * Get site url for shared cookies
 */
const domain = env.get('DOMAIN') || undefined;

/**
 * The app key is used for encrypting cookies, generating signed URLs,
 * and by the "encryption" module.
 *
 * The encryption module will fail to decrypt data if the key is lost or
 * changed. Therefore it is recommended to keep the app key secure.
 */
export const appKey = new Secret(env.get('APP_KEY'))

/**
 * The configuration settings used by the HTTP server
 */
export const http = defineConfig({
    generateRequestId: true,
    allowMethodSpoofing: false,

    /**
     * Enabling async local storage will let you access HTTP context
     * from anywhere inside your application.
     */
    useAsyncLocalStorage: false,

    /**
     * Manage cookies configuration. The settings for the session id cookie are
     * defined inside the "config/session.ts" file.
     */
    cookie: {
        path: '/',
        maxAge: '2h',
        httpOnly: true,
        domain: domain ? ('.' + domain) : domain,
        secure: app.inProduction,
        sameSite: 'lax',
    },

    qs: {
        parse: {
          depth: 5,
          parameterLimit: 1000,
          allowSparse: false,
          arrayLimit: 20,
          comma: false,
        },
        stringify: {
          encode: true,
          encodeValuesOnly: false,
          arrayFormat: 'indices' as const,
          skipNulls: false,
        },
      },
})
