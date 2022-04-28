const request = require("supertest");
const { SecureEndpoints } = require("./endpoints");
const testapp = require("../testapp");
let app;
let nonToken;

describe("Test the Security of All Protected Endpoints", () => {
    SecureEndpoints.forEach((endpoint) => {
        if (endpoint.type !== null) {
            test(
                "Checking endpoint secured: " + endpoint.url,
                async (done) => {
                    if (endpoint.method === "get") {
                        const response = await request(app).get(encodeURI(endpoint.url));
                        expect(response.status).toBe(401);
                    } else if (endpoint.method === "post") {
                        const response = await request(app).post(encodeURI(endpoint.url));
                        expect(response.status).toBe(401);
                    } else if (endpoint.method === "put") {
                        const response = await request(app).put(encodeURI(endpoint.url));
                        expect(response.status).toBe(401);
                    }
                    done();
                },
                10000
            );

            if (endpoint.type === "API-Key") {
                test(
                    "Checking endpoint rejects invalid API Key: " + endpoint.url,
                    async (done) => {
                        if (endpoint.method === "get") {
                            const response = await request(app).get(encodeURI(endpoint.url)).set("Authorization", "notthesecret");
                            expect(response.status).toBe(401);
                        } else if (endpoint.method === "post") {
                            const response = await request(app).post(encodeURI(endpoint.url)).set("Authorization", "notthesecret");
                            expect(response.status).toBe(401);
                        } else if (endpoint.method === "put") {
                            const response = await request(app).put(encodeURI(endpoint.url)).set("Authorization", "notthesecret");
                            expect(response.status).toBe(401);
                        }
                        done();
                    },
                    10000
                );
            } else {
                test(
                    "Checking endpoint rejects forged JWT: " + endpoint.url,
                    async (done) => {
                        const fakeToken = nonToken("SecurityChecker", "notthesecret", null);
                        if (endpoint.method === "get") {
                            const response = await request(app)
                                .get(encodeURI(endpoint.url))
                                .set("Authorization", "JWT " + fakeToken);
                            expect(response.status).toBe(401);
                        } else if (endpoint.method === "post") {
                            const response = await request(app)
                                .post(encodeURI(endpoint.url))
                                .set("Authorization", "JWT " + fakeToken);
                            expect(response.status).toBe(401);
                        } else if (endpoint.method === "put") {
                            const response = await request(app)
                                .put(encodeURI(endpoint.url))
                                .set("Authorization", "JWT " + fakeToken);
                            expect(response.status).toBe(401);
                        }
                        done();
                    },
                    10000
                );

                test(
                    "Checking endpoint rejects expired JWT: " + endpoint.url,
                    async (done) => {
                        const expToken = nonToken("SecurityChecker", null, true);
                        if (endpoint.method === "get") {
                            const response = await request(app)
                                .get(encodeURI(endpoint.url))
                                .set("Authorization", "JWT " + expToken);
                            expect(response.status).toBe(401);
                        } else if (endpoint.method === "post") {
                            const response = await request(app)
                                .post(encodeURI(endpoint.url))
                                .set("Authorization", "JWT " + expToken);
                            expect(response.status).toBe(401);
                        } else if (endpoint.method === "put") {
                            const response = await request(app)
                                .put(encodeURI(endpoint.url))
                                .set("Authorization", "JWT " + expToken);
                            expect(response.status).toBe(401);
                        }
                        done();
                    },
                    10000
                );
            }
        }
    });
});

beforeAll(async (done) => {
    app = await testapp;
    const { generateInvalidToken } = require("../helpers/generateToken");
    nonToken = generateInvalidToken;
    done();
}, 10000);

afterAll((done) => {
    done();
});
