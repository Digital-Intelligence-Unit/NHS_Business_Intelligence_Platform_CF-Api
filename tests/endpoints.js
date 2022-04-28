module.exports.SecureEndpoints = [
    {
        url: "/dataset/getCrossfilter",
        method: "get",
        type: "JWT",
    },
    {
        url: "/dataset/rebuildCrossfilter",
        method: "get",
        type: "JWT",
    },
    {
        url: "/dataset/getComparison",
        method: "post",
        type: "JWT",
    },
];
