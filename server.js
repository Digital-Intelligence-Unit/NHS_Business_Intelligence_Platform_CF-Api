// @ts-check
// Self invocation to allow for top-level async
(async () => {
    if (process.env.DEV) {
        require("dotenv").config();
        const { getSecrets } = require("./helpers/awsSecretsManager");
        try {
            const postgresCredentials = JSON.parse(await getSecrets("postgres"));
            const jwtCredentials = JSON.parse(await getSecrets("jwt"));
            const awsCredentials = JSON.parse(await getSecrets("awsdev"));
            process.env.POSTGRES_UN = postgresCredentials.username;
            process.env.POSTGRES_PW = postgresCredentials.password;
            process.env.JWT_SECRET = jwtCredentials.secret;
            process.env.JWT_SECRETKEY = jwtCredentials.secretkey;
            process.env.AWS_SECRETID = awsCredentials.secretid;
            process.env.AWS_SECRETKEY = awsCredentials.secretkey;
        } catch (error) {
            console.error(error);
        }
    }

    const app = require("./app");
    const port = process.env.PORT || 8079;

    process.env.TZ = "Europe/London";
    app.listen(port);
    console.log("RESTful API now Live on Port: " + port);
})();
