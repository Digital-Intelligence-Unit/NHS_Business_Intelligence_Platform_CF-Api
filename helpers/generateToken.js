// @ts-check
const credentials = require("../_credentials/credentials");
const jwt = require("jsonwebtoken");

module.exports.generateToken = function (username) {
    const returnUser = {
        _id: username,
        name: null,
        username: username,
        email: null,
        organisation: "Testing",
        authentication: "citizen",
    };
    return jwt.sign(returnUser, credentials.secret, {
        expiresIn: 60, // 1 minutes
    });
};

module.exports.generateInvalidToken = function (username, newsecret, expired) {
    const returnUser = {
        _id: username,
        name: null,
        username: username,
        email: null,
        organisation: "Testing",
        authentication: "citizen",
    };
    let time = 60;
    let secret = credentials.secret;
    if (expired) {
        time = -1;
    }
    if (newsecret !== null) {
        secret = newsecret;
    }
    return jwt.sign(returnUser, secret, {
        expiresIn: time,
    });
};
