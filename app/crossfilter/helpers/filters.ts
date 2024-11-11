// @ts-nocheck (temporary)
const { normalise } = require("./utils");
class Filters {
    static filterContains(items, filter) {
        let flag = false;

        // Convert filters to array
        const filters = Array.isArray(filter) ? filter : [filter];

        // Loop through
        if (Array.isArray(items)) {
            if (items.filter(item => filters.includes(item)).length > 0) {
                flag = true;
            };
        } else {
            if (filters.includes(items)) {
                flag = true;
            }
        }

        return flag;
    }

    static matrixFilter(items, filter) {
        let flag = false;
        filter.forEach((filt) => {
            if (items[0] === filt[0] && items[1] === filt[1]) {
                flag = true;
            }
        });
        return flag;
    }

    static dataWithinRange(items, filter) {
        let flag = false;
        if (filter.length < 2) {
            filter = filter[0];
        }
        const valA = parseInt(filter[0]);
        const valB = parseInt(filter[1]);
        if (items >= valA && items <= valB) flag = true;
        return flag;
    }

    static dataWithinRangeDate(items, filter) {
        let flag = false;
        if (filter.length < 2) {
            filter = filter[0];
        }
        const valA = new Date(filter[0].substr(0, 10));
        const valB = new Date(filter[1].substr(0, 10));
        if (new Date(items) >= valA && new Date(items) <= valB) flag = true;
        return flag;
    }

    static agebandMatch(item, filter) {
        let flag = false;
        filter.forEach((elem) => {
            if (elem[0].toString() === item[0].toString() && elem[1] && item[1] && normalise(elem[1]) === normalise(item[1])) flag = true;
        });

        return flag;
    }

    static dataMatchesFivePlus(items, filter) {
        filter.forEach((elem) => {
            if (elem.toString().includes("5")) {
                filter.splice(filter.indexOf(elem), 1, "5");
            }
        });
        if (items.includes("5")) {
            items = "5";
        }
        return filter.includes(items);
    }

    static postcodeMatches(items, filter) {
        let flag = false;
        items.forEach((datum) => {
            if (datum !== "Unknown") {
                if (filter.includes(datum.split("|")[0])) {
                    flag = true;
                }
            }
        });
        return flag;
    }

    static dataMatches(items, filter) {
        return filter.includes(items);
    }
}

module.exports = Filters;
