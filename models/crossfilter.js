// @ts-check

const data = require("./data");
const crossfilter = require("crossfilter2");
const ndx = require("./ndx");
const groups = {};
const dimensions = {};
const filters = {};
let model;
let dataset;
const configurations = require("../config/cf_configurations").cfConfigurations;
const tablename = process.env.TABLENAME || "realtime_surveillance";

module.exports.filterCF = function (filter, callback) {
    callback(getResults(filter), null);
};

module.exports.compareCF = function (filterA, filterB, callback) {
    const finalCompareTable = [];
    const BaselineCohortAggregatedData = JSON.parse(JSON.stringify(getData(filterA, getResults(filterA))));
    const ComparatorCohortAggregatedData = JSON.parse(JSON.stringify(getData(filterB, getResults(filterB))));
    BaselineCohortAggregatedData.data.forEach(function (baselineChart, ind) {
        const chartName = convertDimToChartName(baselineChart.Name);
        const baselineChartData = baselineChart.Data;
        const comparitorChartData = ComparatorCohortAggregatedData.data[ind].Data;
        let compTableItem;
        const allChartItems = [];
        if (chartName !== "NOTUSED") {
            Object.keys(baselineChartData).forEach(function (indbaseline) {
                const BaselineSpecItem = baselineChartData[ind];
                // finalCompareTable[chartName];
                compTableItem = {
                    chart: chartName,
                    key: BaselineSpecItem.key,
                    baselineValue: BaselineSpecItem.value,
                    baselineRate: BaselineSpecItem.rate,
                    compValue: comparitorChartData[indbaseline].value,
                    compRate: comparitorChartData[indbaseline].rate,
                    ratio: (comparitorChartData[indbaseline].rate / BaselineSpecItem.rate) * 100,
                };
                allChartItems.push(compTableItem);
            });
        }
        finalCompareTable.push({ chartname: chartName, chartdata: allChartItems });
    });
    const baseline = BaselineCohortAggregatedData.denominator;
    const comp = ComparatorCohortAggregatedData.denominator;
    callback(finalCompareTable, baseline, comp, null);
};

module.exports.buildCrossfilter = function (callback) {
    const config = configurations.filter((x) => x.name === tablename);
    if (config.length === 0) {
        console.log("Unable to configure crossfilter for " + tablename);
        return;
    }
    const thisConfig = config[0];
    data.getAll(function (errResponse, result) {
        if (errResponse) {
            console.log("Unable to build CF: " + errResponse);
            if (callback) {
                callback(errResponse, null);
                return;
            } else {
                throw new Error(errResponse);
            }
        } else {
            dataset = result;
            console.log("Data extracted from DB");
            result = null;

            if (thisConfig.selectedCounts && thisConfig.selectedCounts.length > 0) {
                dataset.forEach((item) => {
                    thisConfig.selectedCounts.forEach((count) => {
                        item[count] = 0;
                    });
                });
            }

            console.log("Constructing CF...");
            model = crossfilter(dataset);
            model.groupAll();
            console.log("Building Dimensions...");

            thisConfig.dimensions.forEach((dim) => {
                console.log("Building Dimension: " + dim.name);
                let tableColSplit;
                switch (dim.type) {
                    case "location":
                        dimensions[dim.name] = model.dimension((d) => {
                            return flattenLocation(d[dim.tableCol], d);
                        });
                        break;
                    case "number":
                        dimensions[dim.name] = model.dimension((d) => {
                            return +d[dim.tableCol];
                        });
                        break;
                    case "numberSimple":
                        dimensions[dim.name] = model.dimension((d) => {
                            if (d[dim.tableCol] === undefined || d[dim.tableCol] === null) return -1;
                            else return d[dim.tableCol];
                        });
                        break;
                    case "date_stringArray":
                        tableColSplit = dim.tableCol.split(",");
                        dimensions[dim.name] = model.dimension((d) => {
                            try {
                                const date = new Date(d[tableColSplit[0]]).toISOString().substr(0, 10);
                                return [date, d[tableColSplit[1]]];
                            } catch (ex) {
                                return [d[tableColSplit[0]], d[tableColSplit[1]]];
                            }
                        });
                        break;
                    case "date":
                        dimensions[dim.name] = model.dimension((d) => {
                            return d[dim.tableCol] !== "null" && d[dim.tableCol] && Date.parse(d[dim.tableCol])
                                ? new Date(d[dim.tableCol])
                                : new Date("1900-01-01");
                        });
                        break;
                    case "array":
                        dimensions[dim.name] = model.dimension((d) => {
                            return d[dim.tableCol][dim.tableColArr || dim.tableCol];
                        }, true);
                        break;
                    case "arraySimple":
                        dimensions[dim.name] = model.dimension((d) => {
                            return d.medication || ["Unknown"];
                        }, true);
                        break;
                    case "stringConvert":
                        dimensions[dim.name] = model.dimension((d) => dim.function(d, dim.tableCol));
                        break;
                    case "dualArray":
                        tableColSplit = dim.tableCol.split(",");
                        dimensions[dim.name] = model.dimension((d) => [d[tableColSplit[0]], d[tableColSplit[1]]]);
                        break;
                    default:
                        dimensions[dim.name] = model.dimension((d) => {
                            return d[dim.tableCol];
                        });
                        break;
                }
                if (dim.groupFloor) groups[dim.name] = dimensions[dim.name].group((g) => Math.floor(g));
                else groups[dim.name] = dimensions[dim.name].group();
                filters[dim.name] = dataFilterFunction(dim.functiontype);
            });
            console.log("Full Crossfilter Populated");
        }
        if (callback) {
            callback(null, "Build Finished");
        }
        return "Build Finished";
    });
};

module.exports.updateCrossfilter = function (newItem) {
    model.add(newItem);
};

module.exports.getModel = function () {
    return model;
};
module.exports.getGroups = function () {
    return groups;
};
module.exports.getFilters = function () {
    return filters;
};
module.exports.getDimensions = function () {
    return dimensions;
};
module.exports.getDataset = function () {
    return dataset;
};

const dataFilterFunction = function (functiontype) {
    switch (functiontype) {
        case "matches":
            return dataMatches;
        case "arrayFilterContains":
            return arrayFilterContains;
        case "filterContains":
            return filterContains;
        case "dataWithinRange":
            return dataWithinRange;
        case "dataWithinRangeDate":
            return dataWithinRangeDate;
        case "agebandMatch":
            return agebandMatch;
        case "dataMatchesFivePlus":
            return dataMatchesFivePlus;
        case "postcodeMatches":
            return postcodeMatches;
        default:
            return dataMatches;
    }
};

const postcodeMatches = function (items, filter) {
    let flag = false;
    items.forEach((datum) => {
        if (datum !== "Unknown") {
            if (filter.includes(datum.split("|")[0])) {
                flag = true;
            }
        }
    });
    return flag;
};

const dataMatches = function (items, filter) {
    return filter.includes(items);
};

const filterContains = function (items, filter) {
    let flag = false;
    if (Array.isArray(items)) {
        items.forEach((filt) => {
            if (filter[0].includes(filt)) {
                flag = true;
            }
        });
    } else {
        if (items.includes(filter)) {
            flag = true;
        }
    }
    return flag;
};

const arrayFilterContains = function (items, filter) {
    let flag = false;
    filter.forEach((filt) => {
        if (items[0] === filt[0] && items[1] === filt[1]) {
            flag = true;
        }
    });
    return flag;
};

const dataMatchesFivePlus = function (items, filter) {
    filter.forEach((elem) => {
        if (elem.toString().includes("5")) {
            filter.splice(filter.indexOf(elem), 1, "5");
        }
    });
    if (items.includes("5")) {
        items = "5";
    }
    return filter.includes(items);
};

const dataWithinRange = function (items, filter) {
    let flag = false;
    if (filter.length < 2) {
        filter = filter[0];
    }
    const valA = parseInt(filter[0]);
    const valB = parseInt(filter[1]);
    if (items >= valA && items <= valB) flag = true;
    return flag;
};

// @ts-ignore
const dataWithinRangeDate = function (items, filter) {
    let flag = false;
    if (filter.length < 2) {
        filter = filter[0];
    }
    const valA = new Date(filter[0].substr(0, 10));
    const valB = new Date(filter[1].substr(0, 10));
    if (new Date(items) >= valA && new Date(items) <= valB) flag = true;
    return flag;
};

const agebandMatch = function (item, filter) {
    let flag = false;
    filter.forEach((elem) => {
        if (elem[0].toString() === item[0].toString() && elem[1] && item[1] && normalise(elem[1]) === normalise(item[1])) flag = true;
    });

    return flag;
};

function normalise(original) {
    return original.replace(/\D/g, "");
}

const getResults = function (filter) {
    const results = {};
    const thisNDX = new ndx.NDX();
    thisNDX.init();
    if (filter) {
        thisNDX.addCounts(filter);
        if (thisNDX.dimensions["numberSelLtc"]) thisNDX.dimensions["numberSelLtc"].filterAll();
        if (thisNDX.dimensions["numberSelFlag"]) thisNDX.dimensions["numberSelFlag"].filterAll();
    }
    const dims = Object.keys(thisNDX.dimensions);
    dims.forEach((dim) => {
        thisNDX.dimensions[dim].filterAll();
    });

    for (const dimension in thisNDX.dimensions) {
        const group = thisNDX.groups[dimension];
        if (filter[dimension]) {
            let filterObj = filter[dimension];
            if (dimension === "LTCs2Dimension") {
                const filts = [];
                filterObj.forEach((x) => filts.push(x[0]));
                thisNDX.dimensions.LTCsDimension.filterFunction((d) => thisNDX.filters.LTCsDimension(d, filts));
            } else if (dimension === "Flags2Dimension") {
                const filts = [];
                filterObj.forEach((x) => filts.push(x[0]));
                thisNDX.dimensions.Flags2Dimension.filterFunction((d) => thisNDX.filters.Flags2Dimension(d, filts));
            } else if (dimension === "AgeDimension" && tablename === "population_health_mini") {
                filterObj = filter[dimension][0];
                const lower = parseInt(filterObj.split("-")[0].trim());
                const upper = parseInt(filterObj.split("-")[1].trim());
                thisNDX.dimensions.AgeDimension.filterFunction((d) => {
                    const age = parseInt(d.split(":")[1]);
                    if (age >= lower && age <= upper) {
                        return true;
                    }
                    return false;
                });
            } else {
                thisNDX.dimensions[dimension].filterFunction((d) => thisNDX.filters[dimension](d, filterObj));
            }
        } else {
            thisNDX.dimensions[dimension].filter(null);
        }

        let topValue = 0;
        if (group.top(1)[0]) {
            topValue = group.top(1)[0].value;
        }
        results[dimension] = {
            values: group.all(),
            top: topValue,
            filts: filter[dimension],
        };
    }
    results["all"] = {
        values: thisNDX.all.value(),
    };
    return results;
};

const getData = function (filter, group) {
    const allChartData = [];
    const fullPop = group.all.values;
    let totalCohortPop = 0;
    Object.keys(group).forEach(function (dimensionName) {
        if (dimensionName !== "LTCs2Dimension" && dimensionName !== "Flags2Dimension") {
            if (dimensionName === "SexDimension") {
                group[dimensionName].values.forEach((val) => {
                    totalCohortPop += val.value;
                });
                totalCohortPop = JSON.parse(JSON.stringify(totalCohortPop));
            }
            const filterObj = filter;
            const chartFilters = filterObj[dimensionName];
            let usedData = [];

            let initialData = JSON.parse(JSON.stringify(group[dimensionName]["values"]));

            if (chartFilters !== undefined) {
                if (typeof chartFilters[0] == "object") {
                    const lowVal = chartFilters[0][0];
                    const highVal = chartFilters[0][1];

                    initialData.forEach(function (e) {
                        if (e.key <= lowVal || e.key > highVal) {
                            e.value = 0;
                        }
                    });
                }
                if (
                    (typeof chartFilters[0] === "string" || typeof chartFilters[0] === "number") &&
                    dimensionName !== "LTCsDimension" &&
                    dimensionName !== "FlagsDimension"
                ) {
                    const filterCats = chartFilters;

                    initialData.forEach(function (e) {
                        if (!(filterCats.indexOf(e.key) >= 0)) {
                            e.value = 0;
                        }
                    });
                }
            }

            let agebandVal = {};
            let riskbandVal = {};
            const ageBandSize = 5;
            let agebandLab;
            let cumuPop;
            let cutOffs = [3, 4, 5, 10, 20];
            let lastCutoffNo = 0;
            let filteredCutoffs;
            let cutoffNo;

            switch (dimensionName) {
                case "LTCsDimension":
                    initialData = JSON.parse(JSON.stringify(group["LTCs2Dimension"]["values"]));
                    initialData.forEach((keyvaluePair) => {
                        const keyarray = keyvaluePair.key;
                        keyarray.forEach((ltc) => {
                            const check = usedData.filter((x) => x.key.includes(ltc));
                            if (check.length > 0) {
                                check[0].value = check[0].value + keyvaluePair.value;
                            } else {
                                usedData.push({
                                    key: [ltc],
                                    value: keyvaluePair.value,
                                });
                            }
                        });
                    });
                    break;
                case "FlagsDimension":
                    initialData = JSON.parse(JSON.stringify(group["Flags2Dimension"]["values"]));
                    initialData.forEach((keyvaluePair) => {
                        const keyarray = keyvaluePair.key;
                        keyarray.forEach((flag) => {
                            const check = usedData.filter((x) => x.key.includes(flag));
                            if (check.length > 0) {
                                check[0].value = check[0].value + keyvaluePair.value;
                            } else {
                                usedData.push({
                                    key: [flag],
                                    value: keyvaluePair.value,
                                });
                            }
                        });
                    });
                    break;
                case "AgeDimension":
                    agebandVal = {};
                    riskbandVal = {};
                    cumuPop = 0;

                    initialData.forEach(function (e, idx, array) {
                        cumuPop = cumuPop + e.value;

                        if (e.key % ageBandSize === ageBandSize - 1) {
                            agebandLab = (e.key - (ageBandSize - 1)).toString().concat(" - ", e.key);

                            agebandVal = {
                                key: agebandLab,
                                value: cumuPop,
                            };
                            usedData.push(agebandVal);
                            cumuPop = 0;
                        } else {
                        }

                        if (idx === array.length - 1) {
                            agebandVal = {
                                key: e.key.toString().concat(" + "),
                                value: cumuPop,
                            };
                            usedData.push(agebandVal);
                        }
                    });

                    break;
                case "RskDimension":
                    cutOffs = [3, 4, 5, 10, 20];
                    cumuPop = 0;
                    lastCutoffNo = 0;

                    initialData.forEach(function (e, idx, array) {
                        filteredCutoffs = cutOffs.filter(function (x) {
                            return x <= e.key;
                        });
                        cutoffNo = filteredCutoffs.length;

                        if (cutoffNo > lastCutoffNo) {
                            riskbandVal = {
                                // @ts-ignore
                                key: "<= ".concat(cutOffs[cutoffNo - 1]),
                                value: cumuPop,
                            };
                            usedData.push(riskbandVal);
                            cumuPop = e.value;
                        } else {
                            cumuPop = cumuPop + e.value;
                        }

                        if (idx === array.length - 1) {
                            cumuPop = cumuPop + e.value;

                            riskbandVal = {
                                // @ts-ignore
                                key: "> ".concat(cutOffs[cutoffNo - 1]),
                                value: cumuPop,
                            };
                            usedData.push(riskbandVal);
                        }
                        lastCutoffNo = cutoffNo;
                    });
                    break;
                default:
                    usedData = initialData;
            }
            if (dimensionName !== "all") {
                usedData.forEach(function (e) {
                    e.rate = e.value / fullPop;
                });
                if (dimensionName !== "AgeDimension") {
                    usedData = usedData.reverse();
                }
            }

            const pushObject = {};
            pushObject["Name"] = dimensionName;
            pushObject["Data"] = usedData;
            allChartData.push(pushObject);
        }
    });

    return {
        denominator: totalCohortPop,
        data: allChartData,
    };
};

const convertDimToChartName = function (dimName) {
    switch (dimName) {
        case "LDimension":
            return "neighbourhood-select-comp";
        case "GPDimension":
            return "gp-map-leaflet-comp";
        case "TDimension":
            return "taxonomy-chart-comp";
        case "LTCsDimension":
            return "ltc-chart-comp";
        case "FlagsDimension":
            return "flags-chart-comp";
        case "SexDimension":
            return "sex-chart-comp";
        case "MDimension":
            return "mosaic-chart-comp";
        case "CCGDimension":
            return "ccg-select-comp";
        case "LCntDimension":
            return "ltc-count-chart-comp";
        case "AgeDimension":
            return "age-chart-comp";
        case "RskDimension":
            return "risk-chart-comp";
        case "DDimension":
            return "imd-chart-comp";
        case "WDimension":
            return "ward-map-leaflet-comp";
        case "UDimension":
            return "cost-group-chart-comp";
        case "MatrixDimension":
            return "matrix-chart-comp";
        case "CstDimension":
            return "total-cost-chart-comp";
        default:
            return "NOTUSED";
    }
};

const flattenLocation = (location, d) => {
    if (location === undefined) {
        return "Unknown";
    } else {
        return location.postcode + "|" + location.latitude + "|" + location.longitude + "|" + d.method + "|" + d.type;
    }
};
