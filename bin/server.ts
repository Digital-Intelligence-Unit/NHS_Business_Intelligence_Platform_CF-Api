/*
|--------------------------------------------------------------------------
| HTTP server entrypoint
|--------------------------------------------------------------------------
|
| The "server.ts" file is the entrypoint for starting the AdonisJS HTTP
| server. Either you can run this file directly or use the "serve"
| command to run this file and monitor file changes
|
*/

import 'reflect-metadata'
import { Ignitor, prettyPrintError } from '@adonisjs/core'

/**
 * URL to the application root. AdonisJS need it to resolve
 * paths to file and directories for scaffolding commands
 */
const APP_ROOT = new URL('../', import.meta.url)

/**
 * The importer is used to import files in context of the
 * application.
 */
const IMPORTER = (filePath: string) => {
    if (filePath.startsWith('./') || filePath.startsWith('../')) {
        return import(new URL(filePath, APP_ROOT).href)
    }
    return import(filePath)
}

new Ignitor(APP_ROOT, { importer: IMPORTER })
    .tap((app) => {
        app.booting(async () => {
            // Get AWS secrets
            try{
                const awsSecrets = await import('#start/aws_secrets');
                await awsSecrets.configureHttpRuntime();
            } catch(e) {
                console.log(e)
            }
            
            // Default
            await import('#start/env')
        })
        app.listen('SIGTERM', () => app.terminate())
        app.listenIf(app.managedByPm2, 'SIGINT', () => app.terminate())
    })
    .httpServer()
    .start()
    .then(async (app) => {
        // Configure crossfilter
        const crossfilter = await import('../app/crossfilter/crossfilter.js');
        crossfilter.instance.build().then((status) => {
            if(status) {
                console.log('Crossfilter model built successfully!')
            } else {
                console.log('An error occurred whilst building crossfilter');
                process.exit();
            }
        });
    })
    .catch((error) => {
        process.exitCode = 1
        prettyPrintError(error)
    })
