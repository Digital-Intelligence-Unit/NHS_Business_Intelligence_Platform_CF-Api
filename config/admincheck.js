// @ts-check
module.exports = function (req, res, next) {
    const user = req.user;
    if (req.body.username && user.username && req.body.username === user.username) {
        next();
    } else if (user.capabilities && user.capabilities.length > 0) {
        let flag = true;
        user.capabilities.forEach((element) => {
            if (Object.keys(element)[0] === "Admin") {
                if (element["Admin"] === "Role_Admin" || element["Admin"] === "Global_Admin") {
                    flag = false;
                    next();
                }
            }
        });
        if (flag) {
            res.status(401).json({
                success: false,
                msg: "Unable to process",
            });
        }
    } else {
        res.status(401).json({
            success: false,
            msg: "Unable to process",
        });
    }
};
