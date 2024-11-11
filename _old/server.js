const { fromSSO } = require("@aws-sdk/credential-providers");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

(async () => {
    if (process.env.ENV == 'local') {
        const client = new SecretsManagerClient({ credentials: fromSSO() });
        try {
            // Configure postgres
            const postgresCredentials = JSON.parse(
                (await client.send(new GetSecretValueCommand({ SecretId: 'postgres' }))).SecretString
            );
            process.env.POSTGRES_UN = postgresCredentials.username;
            process.env.POSTGRES_PW = postgresCredentials.password;
        } catch (error) {
            console.error(error);
        }
    }

    const app = require("./app");
    const port = process.env.PORT || 8079;

    process.env.TZ = "Europe/London";
    app.listen(port);
    console.log("Crossfilter API Live on Port: " + port);
})();
