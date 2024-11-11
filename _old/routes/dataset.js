// @ts-check
const express = require("express");
const { instance } = require("../models/crossfilter2");
const router = express.Router();
const crossfilter = require("../models/crossfilter2").instance;

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
 *       - name: excludeFilter
 *         description: Filter to exclude from the Crossfilter
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: Full List
 */
router.get(
    "/getCrossfilter",
    (req, res, next) => {
        // @ts-ignore
        const filter = req.query["filter"] ? JSON.parse(req.query["filter"]) : {};
        const excludeFilter = req.query["excludeFilter"] ? JSON.parse(req.query["excludeFilter"]) : {};
        
        // Clone crossfilter
        const crossfilterInstance = crossfilter.clone();
        if(!crossfilterInstance) { return res.status(500).send('Filter failed'); }

        // Filter instance
        const data = crossfilterInstance.filter(filter, excludeFilter)
        if (data) {
            res.status(200).send(data);
        } else {
            res.status(500).send({ error: 'An error occurred, please try again' });
        }
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
    // (req, res, next) => {
    //     if (req.headers && req.headers.authorization && req.headers.authorization.substring(0, 3) === "JWT") {
    //         passport.authenticate("jwt", {
    //             session: false,
    //         })(req, res, next);
    //     } else {
    //         MiddlewareHelper.authenticateWithKey(credentials.api_key)(req, res, next);
    //     }
    // },
    (req, res, next) => {
        instance.build((err, result) => {
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
 *                  data:
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
 *                  data:
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
    (req, res, next) => {
        const cohortBaselineFilter = req.body.cohorta;
        const cohortComparatorFilter = req.body.cohortb;
        if (cohortBaselineFilter.data && cohortComparatorFilter.data) {
            const a = JSON.parse(cohortBaselineFilter.data);
            const b = JSON.parse(cohortComparatorFilter.data);
            crossfilter.compare(a, b, function (cf, baseline, comp, err) {
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

module.exports = router;
