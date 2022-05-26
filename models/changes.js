// @ts-check
const crossfilter = require("./crossfilter");

module.exports.addItem = function (newItem, callback) {
    crossfilter.updateCrossfilter(newItem);
    callback(null, newItem);
};

module.exports.removeItem = function (item, callback) {
    crossfilter.buildCrossfilter(); // can be simplified to just remove individual item
    callback(null, item);
};

module.exports.updateItem = function (updatedItem, callback) {
    crossfilter.buildCrossfilter(); // can be simplified to just update individual item
    callback(null, updatedItem);
};
