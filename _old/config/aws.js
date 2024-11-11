const { fromSSO } = require("@aws-sdk/credential-provider-sso")
const { fromTemporaryCredentials } = require("@aws-sdk/credential-providers")

module.exports = {
    getCredentials: () => {
        return process.env.ENV == 'local' ? fromSSO() : fromTemporaryCredentials();   
    }
}