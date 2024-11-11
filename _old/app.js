const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const rateLimit = require("express-rate-limit");
const app = express();

// SWAGGER SETUP
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = swaggerJSDoc({
    swaggerDefinition: {
        basePath: "/",
        securityDefinitions: {
            JWT: {
                type: "apiKey",
                name: "Authorization",
                in: "header",
            },
        },
    },
    apis: ["./routes/*.js"],
});

app.get("/swaggerjson", (req, res) => {
    res.send(swaggerSpec);
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(rateLimit({
    windowMs: 60000, // 1 minute
    max: process.env.ENV == 'local' ? 500 : 250,
}));

// SETTINGS FOR OUR API
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
app.use(bodyParser.json());

// ROUTES
app.use("/dataset", require("./routes/dataset"));
app.get("/", (req, res) => {
    res.status(200).send((process.env.API_NAME || 'Unknown') + "Crossfilter API");
});

// BUILD CROSSFILTER OBJECT ON LOAD
require("./models/crossfilter2").instance.build((err) => {
    if(err) { 
        console.log(err); 
        console.log('Crossfilter intialisation failed'); 
    }
    console.log('Crossfilter intialised'); 
});;

// EXPORT APP
module.exports = app;