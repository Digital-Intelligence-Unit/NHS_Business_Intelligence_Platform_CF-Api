module.exports = {
    secret: process.env.JWT_SECRET,
    secretkey: process.env.JWT_SECRETKEY,
    postgres_un: process.env.POSTGRES_UN,
    postgres_pw: process.env.POSTGRES_PW,
    aws_secret_id: process.env.AWS_SECRETID,
    aws_secret_key: process.env.AWS_SECRETKEY,
};
