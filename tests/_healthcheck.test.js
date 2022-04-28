// //@ts-check

const request = require("supertest");
const testapp = require("../testapp");
var app;

describe("Test the root path", () => {
    test("It should check the invalid endpoint as a standard Health Check", async (done) => {
        const response = await request(app).get("/");
        expect(response.status).toBe(200);
        done();
    }, 10000);
});

beforeAll(async (done) => {
    app = await testapp;
    done();
}, 10000);

afterAll((done) => {
    done();
});
