// @ts-check

// Self invocation to allow for top-level async
module.exports = (async () => {
    if (process.env.DEV && (process.env.JWT_SECRET === undefined || process.env.JWT_SECRET === null)) {
        require("dotenv").config();
        const AWSHelper = require("diu-data-functions").Helpers.Aws;
        try {
            // Configure postgres
            const postgresCredentials = JSON.parse(await AWSHelper.getSecrets("postgres"));
            process.env.POSTGRES_UN = postgresCredentials.username;
            process.env.POSTGRES_PW = postgresCredentials.password;

            // Configure app secrets
            const jwtCredentials = JSON.parse(await AWSHelper.getSecrets("jwt"));
            process.env.JWT_SECRET = jwtCredentials.secret;
            process.env.JWT_SECRETKEY = jwtCredentials.secretkey;

            // Configure AWS
            const awsCredentials = JSON.parse(await AWSHelper.getSecrets("awsdev"));
            process.env.AWS_SECRETID = awsCredentials.secretid;
            process.env.AWS_SECRETKEY = awsCredentials.secretkey;

            // Get api key
            const apiKey = JSON.parse(await AWSHelper.getSecrets("generic-api-key"));
            process.env.API_KEY = apiKey.key;
        } catch (error) {
            console.error(error);
        }
    }
    process.env.TZ = "Europe/London";
    return require("./app");
})();
