// @ts-check
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const credentials = require("../_credentials/credentials");

module.exports = function (passport) {
    var opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
    opts.secretOrKey = credentials.secret;
    passport.use(
        new JwtStrategy(opts, (jwt_payload, done) => {
            if (jwt_payload.exp < Date.now() / 1000) {
                return done(null, false);
            }
            return done(null, jwt_payload);
        })
    );
};
