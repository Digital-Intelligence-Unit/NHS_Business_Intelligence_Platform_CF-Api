// @ts-check
module.exports = function (req, res, next) {
    const origin = req.headers.referer;
    if (origin.includes("localhost") || origin.includes(process.env.SITE_URL || ".")) {
        next();
    } else {
        console.log("Unknown referer attempted to create a role: " + origin);
        res.status(400).json({
            success: false,
            msg: "Unknown referer",
        });
    }
};
