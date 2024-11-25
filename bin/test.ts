/*
|--------------------------------------------------------------------------
| Test runner entrypoint
|--------------------------------------------------------------------------
|
| The "test.ts" file is the entrypoint for running tests using Japa.
|
| Either you can run this file directly or use the "test"
| command to run this file and monitor file changes.
|
*/

process.env.NODE_ENV = 'test'

import 'reflect-metadata'
import { Ignitor, prettyPrintError } from '@adonisjs/core'
import { configure, processCLIArgs, run } from '@japa/runner'

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
      const awsSecrets = await import('#start/aws_secrets');
      await awsSecrets.configureHttpRuntime();

      // Default
      await import('#start/env')

      // Configure crossfilter
      const crossfilter = await import('../app/crossfilter/crossfilter.js');
      crossfilter.instance.build().then((status) => {
          if(status) {
              console.log('Crossfilter model built successfully!')
          } else {
              console.log('An error occurred whilst building crossfilter');
              app.terminate();
          }
      });
    })
    app.listen('SIGTERM', () => app.terminate())
    app.listenIf(app.managedByPm2, 'SIGINT', () => app.terminate())
  })
  .testRunner()
  .configure(async (app) => {
    const { runnerHooks, ...config } = await import('../tests/bootstrap.js')

    processCLIArgs(process.argv.splice(2))
    configure({
      ...app.rcFile.tests,
      ...config,
      ...{
        setup: runnerHooks.setup,
        teardown: runnerHooks.teardown.concat([() => app.terminate()]),
      },
    })
  })
  .run(() => run())
  .catch((error) => {
    process.exitCode = 1
    prettyPrintError(error)
  })
