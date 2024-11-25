import { EnvHelper } from 'diu-data-functions/helpers'

export const configureHttpRuntime = async () => {
    try {
        // Config for running locally
        if (!process.env.NODE_ENV || ['local', 'test'].includes(process.env.NODE_ENV)) {
            await EnvHelper.setPrimarySecrets();
        }
    } catch (error) {
        console.log('An error occurred configuring environment variables')
        console.error(error)
    }
}