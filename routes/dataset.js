// @ts-check
const express = require("express");
const router = express.Router();
const passport = require("passport");
const NDXfilter = require("../models/crossfilter").filterCF;
const CF = require("../models/crossfilter");
const Changes = require("../models/changes");
const DIULibrary = require("diu-data-functions");
const MiddlewareHelper = DIULibrary.Helpers.Middleware;
const credentials = require("../_credentials/credentials");

/**
 * @swagger
 * tags:
 *   name: Dataset
 *   description: Stats for the Dataset
 */

/**
 * @swagger
 * /dataset/getCrossfilter:
 *   get:
 *     security:
 *      - JWT: []
 *     description: Queries the Server Side Crossfilter Object
 *     tags:
 *      - Dataset
 *     produces:
 *      - application/json
 *     parameters:
 *       - name: filter
 *         description: Filter to apply to the Crossfilter
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: Full List
 */
router.get(
    "/getCrossfilter",
    passport.authenticate("jwt", {
        session: false,
    }),
    (req, res, next) => {
        // @ts-ignore
        const filter = req.query["filter"] ? JSON.parse(req.query["filter"]) : {};
        NDXfilter(filter, (cf, err) => {
            if (err) {
                console.error(err);
                res.status(500).send(err);
            } else {
                res.status(200).send(cf);
            }
        });
    }
);

/**
 * @swagger
 * /dataset/rebuildCrossfilter:
 *   get:
 *     security:
 *      - JWT: []
 *     description: Builds the Server Side Crossfilter Object
 *     tags:
 *      - Dataset
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: Full List
 */
router.get(
    "/rebuildCrossfilter",
    (req, res, next) => {
        if (req.headers.authorization && req.headers.authorization.substring(0, 3) === "JWT") {
            passport.authenticate("jwt", {
                session: false,
            })(req, res, next);
        } else {
            MiddlewareHelper.authenticateWithKey(credentials.api_key)(req, res, next);
        }
    },
    (req, res, next) => {
        CF.buildCrossfilter((err, result) => {
            if (err) {
                res.status(400).json({
                    success: false,
                    msg: err,
                });
            } else {
                res.status(200).json({
                    success: true,
                    msg: result,
                });
            }
        });
    }
);

/**
 * @swagger
 * /dataset/getComparison:
 *   post:
 *     consumes:
 *      - application/json
 *     security:
 *      - JWT: []
 *     tags:
 *      - Dataset
 *     parameters:
 *       - name: cohorts
 *         description: Cohort A and Cohort B
 *         in: body
 *         required: true
 *         schema:
 *          type: object
 *          properties:
 *             cohorta:
 *                type: object
 *                properties:
 *                  username:
 *                    type: string
 *                  cohortName:
 *                    type: string
 *                  cohorturl:
 *                    type: string
 *                  createdDT:
 *                    type: string
 *             cohortb:
 *                type: object
 *                properties:
 *                  username:
 *                    type: string
 *                  cohortName:
 *                    type: string
 *                  cohorturl:
 *                    type: string
 *                  createdDT:
 *                    type: string
 *     description: Builds the comparison table
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: Full List
 */
router.post(
    "/getComparison",
    passport.authenticate("jwt", {
        session: false,
    }),
    (req, res, next) => {
        const cohortBaselineFilter = req.body.cohorta;
        const cohortComparatorFilter = req.body.cohortb;
        if (cohortBaselineFilter.cohorturl && cohortComparatorFilter.cohorturl) {
            const a = JSON.parse(cohortBaselineFilter.cohorturl);
            const b = JSON.parse(cohortComparatorFilter.cohorturl);
            CF.compareCF(a, b, function (cf, baseline, comp, err) {
                if (err) {
                    console.error(err);
                    res.status(500).send({ err: "Problem calculating comparison: " + err });
                } else {
                    res.status(200).send({
                        details: cf,
                        baselinePop: baseline,
                        comparisonPop: comp,
                    });
                }
            });
        } else {
            res.status(400).send({
                err: "No cohorts provided",
            });
        }
    }
);

/**
 * @swagger
 * /dataset/remove:
 *   delete:
 *     security:
 *      - JWT: []
 *     description: Removes the Item from the crossfilter object
 *     tags:
 *      - Dataset
 *     produces:
 *      - application/json
 *     parameters:
 *         - in: body
 *           name: item
 *           description: Item to remove
 *           schema:
 *                type: object
 *     responses:
 *       200:
 *         description: Full List
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.delete(
    "/delete",
    passport.authenticate("jwt", {
        session: false,
    }),
    (req, res, next) => {
        const item = req.body;
        Changes.removeItem(item, (err, result) => {
            if (err) {
                res.json({
                    success: false,
                    msg: "Failed to remove: " + err,
                });
            } else {
                res.json({
                    success: true,
                    msg: "Item removed",
                    data: item,
                });
            }
        });
    }
);

/**
 * @swagger
 * /dataset/update:
 *   put:
 *     security:
 *      - JWT: []
 *     description: Updates an Item in the crossfilter object
 *     tags:
 *      - Dataset
 *     produces:
 *      - application/json
 *     parameters:
 *         - in: body
 *           name: item
 *           description: Item to remove
 *           schema:
 *                type: object
 *     responses:
 *       200:
 *         description: Full List
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.put(
    "/update",
    passport.authenticate("jwt", {
        session: false,
    }),
    (req, res, next) => {
        const item = req.body;
        Changes.updateItem(item, (err, result) => {
            if (err) {
                res.json({
                    success: false,
                    msg: "Failed to update: " + err,
                });
            } else {
                if (result) {
                    res.json({
                        success: true,
                        msg: "Item updated",
                        data: item,
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        msg: "Item not found",
                    });
                }
            }
        });
    }
);

/**
 * @swagger
 * /dataset/register:
 *   post:
 *     security:
 *      - JWT: []
 *     description: Adds an Item in the crossfilter object
 *     tags:
 *      - Dataset
 *     produces:
 *      - application/json
 *     parameters:
 *         - in: body
 *           name: item
 *           description: Item to remove
 *           schema:
 *                type: object
 *     responses:
 *       200:
 *         description: Full List
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.post(
    "/register",
    passport.authenticate("jwt", {
        session: false,
    }),
    (req, res, next) => {
        const item = req.body;
        Changes.addItem(item, (err, result) => {
            if (err) {
                res.json({
                    success: false,
                    msg: "Failed to added: " + err,
                });
            } else {
                res.json({
                    success: true,
                    msg: "Item added",
                    data: item,
                });
            }
        });
    }
);

module.exports = router;
