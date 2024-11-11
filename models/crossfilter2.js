const DataModel = require("./data");
const Filters = require("../lib/filters");
const Utils = require('../lib/utils');
const crossfilter = require("crossfilter2");

const configurations = require("../config/cf_configurations").cfConfigurations;
const tablename = process.env.TABLENAME || "realtime_surveillance";

class Crossfilter {
    config;

    model;
    dataset;
    groups = {};
    dimensions = {};
    filters = {};

    get all() {
        return this.model.groupAll();
    }

    build(callback) {
        // Get configuration
        const config = configurations.filter((x) => x.name === tablename);
        if (config.length === 0) {
            console.log("Unable to configure crossfilter for " + tablename);
            return;
        }
        this.config = config[0];

        // Get data
        DataModel.get(tablename, (errResponse, result) => {
            try {
                if (errResponse) {
                    throw new Error(errResponse);
                }

                this.dataset = result;
                console.log("Data extracted from DB");

                if (this.config.selectedCounts && this.config.selectedCounts.length > 0) {
                    this.dataset.forEach((item) => {
                        this.config.selectedCounts.forEach((count) => {
                            item[count] = 0;
                        });
                    });
                }

                console.log("Constructing CF...");
                this.model = crossfilter(this.dataset);
                this.model.groupAll();
                console.log("Building Dimensions...");

                this.config.dimensions.forEach((dim) => {
                    console.log("Building Dimension: " + dim.name);
                    let tableColSplit;
                    switch (dim.type) {
                        case "location":
                            this.dimensions[dim.name] = this.model.dimension((d) => {
                                return Utils.flattenLocation(d[dim.tableCol], d);
                            });
                            break;
                        case "number":
                            this.dimensions[dim.name] = this.model.dimension((d) => {
                                return +d[dim.tableCol];
                            });
                            break;
                        case "numberSimple":
                            this.dimensions[dim.name] = this.model.dimension((d) => {
                                if (d[dim.tableCol] === undefined || d[dim.tableCol] === null) return -1;
                                else return d[dim.tableCol];
                            });
                            break;
                        case "date_stringArray":
                            tableColSplit = dim.tableCol.split(",");
                            this.dimensions[dim.name] = this.model.dimension((d) => {
                                try {
                                    const date = new Date(d[tableColSplit[0]]).toISOString().substr(0, 10);
                                    return [date, d[tableColSplit[1]]];
                                } catch (ex) {
                                    return [d[tableColSplit[0]], d[tableColSplit[1]]];
                                }
                            });
                            break;
                        case "date":
                            this.dimensions[dim.name] = this.model.dimension((d) => {
                                return d[dim.tableCol] !== "null" && d[dim.tableCol] && Date.parse(d[dim.tableCol])
                                    ? new Date(d[dim.tableCol])
                                    : new Date("1900-01-01");
                            });
                            break;
                        case "array":
                            this.dimensions[dim.name] = this.model.dimension((d) => {
                                return d[dim.tableCol][dim.tableColArr || dim.tableCol];
                            }, !dim.name.includes("2Dimension"));
                            break;
                        case "arraySimple":
                            this.dimensions[dim.name] = this.model.dimension((d) => {
                                return d.medication || ["Unknown"];
                            }, true);
                            break;
                        case "stringConvert":
                            this.dimensions[dim.name] = this.model.dimension((d) => dim.function(d, dim.tableCol));
                            break;
                        case "dualArray":
                            tableColSplit = dim.tableCol.split(",");
                            this.dimensions[dim.name] = this.model.dimension((d) => [d[tableColSplit[0]], d[tableColSplit[1]]]);
                            break;
                        default:
                            this.dimensions[dim.name] = this.model.dimension((d) => {
                                return d[dim.tableCol];
                            });
                            break;
                    }
                    if (dim.groupFloor) this.groups[dim.name] = this.dimensions[dim.name].group((g) => Math.floor(g));
                    else {
                        if (tablename === "population_health_mini") {
                            this.groups[dim.name] = this.dimensions[dim.name].group().reduceSum((d) => {
                                return d.num;
                            });
                        } else {
                            this.groups[dim.name] = this.dimensions[dim.name].group();
                        }
                    }
                    this.filters[dim.name] = Filters[dim.functiontype];
                });
            } catch(e) {
                console.log(e);
                callback(e, null);
            }

            if (callback) {
                callback(null, "Build Finished");
            }

            return "Build Finished";
        });
    }

    filter(filter, excludeFilter) {
        const results = {};
        if (filter) {
            this.addCounts(filter);
            if (this.dimensions["numberSelLtc"]) this.dimensions["numberSelLtc"].filterAll();
            if (this.dimensions["numberSelFlag"]) this.dimensions["numberSelFlag"].filterAll();
        }
        const dims = Object.keys(this.dimensions);
        dims.forEach((dim) => {
            this.dimensions[dim].filterAll();
        });

        for (const dimension in this.dimensions) {
            const group = this.groups[dimension];
            if (filter[dimension] || excludeFilter[dimension]) {
                let filterObj = filter[dimension];
                const excludeObj = excludeFilter[dimension];
                if (dimension === "AgeDimension" && tablename === "population_health_mini") {
                    filterObj = filter[dimension][0];
                    const lower = parseInt(filterObj.split("-")[0].trim());
                    const upper = parseInt(filterObj.split("-")[1].trim());
                    this.dimensions.AgeDimension.filterFunction((d) => {
                        const age = parseInt(d.split(":")[1]);
                        if (age >= lower && age <= upper) {
                            return true;
                        }
                        return false;
                    });
                } else {
                    if (filterObj && excludeObj) {
                        this.dimensions[dimension].filterFunction((d) => {
                            if (this.filters[dimension](d, filterObj)) {
                                return !this.filters[dimension](d, excludeObj);
                            } else {
                                return false;
                            }
                        });
                    } else if (!filterObj && excludeObj) {
                        this.dimensions[dimension].filterFunction((d) => {
                            return !this.filters[dimension](d, excludeObj);
                        });
                    } else {
                        this.dimensions[dimension].filterFunction((d) => {
                            return this.filters[dimension](d, filterObj);
                        });
                    }
                }
            } else {
                this.dimensions[dimension].filter(null);
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
            values: this.all.value(),
        };
        return results;
    }

    compare(filterA, filterB, callback) {
        const finalCompareTable = [];
        const BaselineCohortAggregatedData = JSON.parse(JSON.stringify(this.data(filterA, this.filter(filterA))));
        const ComparatorCohortAggregatedData = JSON.parse(JSON.stringify(this.data(filterB, this.filter(filterB))));
        BaselineCohortAggregatedData.data.forEach(function (baselineChart, ind) {
            const chartName = convertDimToChartName(baselineChart.Name);
            const baselineChartData = baselineChart.Data;
            const comparitorChartData = ComparatorCohortAggregatedData.data[ind].Data;
            let compTableItem;
            const allChartItems = [];
            if (chartName !== "NOTUSED") {
                Object.keys(baselineChartData).forEach(function (indbaseline) {
                    const BaselineSpecItem = baselineChartData[indbaseline];
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
    }

    data(filter, group) {
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
    }

    clone() {
        try {
            const clone = new Crossfilter();
            clone.dataset = Object.assign(this.dataset);
            clone.model = Object.assign(this.model);
            clone.dimensions = Object.assign(this.dimensions);
            clone.groups = Object.assign(this.groups);
            clone.filters = Object.assign(this.filters);
            
            for (const [, value] of Object.entries(clone.dimensions)) {
                value.filterAll();
            }

            const config = configurations.find((x) => x.name === tablename) || configurations[0];
            const counters = config.dimensions.filter((x) => x.countDim);
            counters.forEach((dim) => {
                clone.dimensions[dim.name].dispose();
                clone.groups[dim.name].dispose();
                clone.dimensions[dim.name] = clone.model.dimension((d) => d[dim.tableCol]);
                clone.groups[dim.name] = clone.dimensions[dim.name].group();
                clone.filters[dim.name] = Utils.dataMatches;
            });
            
            return clone;
        } catch(e) {
            console.log(e);
            return null;
        }
    }

    addCounts(filter) {
        const config = configurations.find((x) => x.name === tablename) || configurations[0];
        const counters = config.dimensions.filter((x) => x.countDim);

        try {
            const allFilts = [];
            counters.forEach((option) => {
                const filts = [];
                const arr = filter[option.fieldtoCount];
                if (arr && arr.length > 0) arr.forEach((x) => filts.push(x));
                const relatedDim = config.dimensions.find((x) => x.name === option.fieldtoCount);
                allFilts.push({ filters: filts, dimension: option, relatedDim });
            });

            const items = this.dataset;
            items.forEach((item) => {
                allFilts.forEach((filt) => {
                    item[filt.dimension.tableCol] = 0;

                    const tableCol = filt.relatedDim.tableCol;
                    const tableColArr = filt.relatedDim.tableColArr;
                    filt.filters.forEach((f) => {
                        if (item[tableCol][tableColArr].indexOf(f) >= 0) {
                            item[filt.dimension.tableCol] += 1;
                        }
                    });
                });
            });
        } catch (error) {
            console.log("Unable to carry out addCounts: " + error);
        }

        counters.forEach((dim) => {
            this.dimensions[dim.name].dispose();
            this.groups[dim.name].dispose();
            this.dimensions[dim.name] = this.ndx.dimension((d) => {
                return d[dim.tableCol] || 0;
            });
            this.groups[dim.name] = this.dimensions[dim.name].group();
            this.filters[dim.name] = Utils.dataMatches;
        });
    }

    addItem(item, callback) {
        this.model.add(item);
        callback(null, item);
    }

    updateItem(item, callback) {
        this.build();
        callback(null, item);
    }

    removeItem(item, callback) {
        this.build();
        callback(null, item);
    }
}

// Create class
module.exports.Crossfilter = Crossfilter;

// Create instance
module.exports.instance = new Crossfilter();