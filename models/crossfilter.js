// @ts-check

const data = require("./data");
const crossfilter = require("crossfilter2");
const ndx = require("./ndx");
let groups = {};
let dimensions = {};
let filters = {};
let model;
let dataset;
const configurations = require("../config/cf_configurations").cfConfigurations;
const tablename = process.env.TABLENAME || "covid_populations";

module.exports.filterCF = function (filter, callback) {
  callback(getResults(filter), null);
};

module.exports.compareCF = function (filterA, filterB, callback) {
  var finalCompareTable = [];
  var BaselineCohortAggregatedData = JSON.parse(JSON.stringify(getData(filterA, getResults(filterA))));
  var ComparatorCohortAggregatedData = JSON.parse(JSON.stringify(getData(filterB, getResults(filterB))));
  BaselineCohortAggregatedData.data.forEach(function (baselineChart, ind) {
    var chartName = convertDimToChartName(baselineChart.Name);
    var baselineChartData = baselineChart.Data;
    var comparitorChartData = ComparatorCohortAggregatedData.data[ind].Data;
    var compTableItem;
    var allChartItems = [];
    if (chartName != "NOTUSED") {
      Object.keys(baselineChartData).forEach(function (ind) {
        var BaselineSpecItem = baselineChartData[ind];
        finalCompareTable[chartName];
        compTableItem = {
          chart: chartName,
          key: BaselineSpecItem.key,
          baselineValue: BaselineSpecItem.value,
          baselineRate: BaselineSpecItem.rate,
          compValue: comparitorChartData[ind].value,
          compRate: comparitorChartData[ind].rate,
          ratio: (comparitorChartData[ind].rate / BaselineSpecItem.rate) * 100,
        };
        allChartItems.push(compTableItem);
      });
    }
    finalCompareTable.push({ chartname: chartName, chartdata: allChartItems });
  });
  var baseline = BaselineCohortAggregatedData.denominator;
  var comp = ComparatorCohortAggregatedData.denominator;
  callback(finalCompareTable, baseline, comp, null);
};

module.exports.buildCrossfilter = function (callback) {
  const config = configurations.filter((x) => x.name === tablename);
  if (config.length === 0) {
    console.log("Unable to configure crossfilter for " + tablename);
    return;
  }
  const thisConfig = config[0];
  data.getAll(function (err, result) {
    if (err) {
      console.log("Unable to build CF: " + err.toString());
      if (callback) {
        callback("Unable to build CF: " + err.toString(), null);
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
      // @ts-ignore
      const all = model.groupAll();
      console.log("Building Dimensions...");

      thisConfig.dimensions.forEach((dim) => {
        switch (dim.type) {
          case "number":
            dimensions[dim.name] = model.dimension((d) => {
              return +d[dim.tableCol];
            });
            break;
          case "date":
            dimensions[dim.name] = model.dimension((d) => {
              return new Date(d[dim.tableCol]);
            });
            break;
          case "array":
            dimensions[dim.name] = model.dimension((d) => {
              return d[dim.tableCol][dim.tableColArr || dim.tableCol];
            }, true);
            break;
          case "stringConvert":
            dimensions[dim.name] = model.dimension((d) => dim.function(d[dim.tableCol]));
            break;
          case "dualArray":
            const tableColSplit = dim.tableCol.split(",");
            dimensions[dim.name] = model.dimension((d) => [d[tableColSplit[0]], d[tableColSplit[1]]]);
            break;
          default:
            dimensions[dim.name] = model.dimension((d) => {
              return d[dim.tableCol];
            });
            break;
        }
        if (dim.functiontype === "dataWithinRange") groups[dim.name] = dimensions[dim.name].group((g) => Math.floor(g));
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
    case "dataMatchesFivePlus":
      return dataMatchesFivePlus;
    default:
      return dataMatches;
  }
};

const dataMatches = function (data, filter) {
  return filter.includes(data);
};

const filterContains = function (data, filter) {
  let flag = false;
  data.forEach((filt) => {
    if (filter[0].includes(filt)) {
      flag = true;
    }
  });
  return flag;
};

const arrayFilterContains = function (data, filter) {
  let flag = false;
  filter.forEach((filt) => {
    if (data[0] === filt[0] && data[1] === filt[1]) {
      flag = true;
    }
  });
  return flag;
};

const dataMatchesFivePlus = function (data, filter) {
  filter.forEach((elem) => {
    if (elem.toString().includes("5")) {
      filter.splice(filter.indexOf(elem), 1, "5");
    }
  });
  if (data.includes("5")) {
    data = "5";
  }
  return filter.includes(data);
};

const dataWithinRange = function (data, filter) {
  let flag = false;
  if (filter.length < 2) {
    filter = filter[0];
  }
  const valA = parseInt(filter[0]);
  const valB = parseInt(filter[1]);
  if (data >= valA && data <= valB) flag = true;
  return flag;
};

// @ts-ignore
const dataWithinRangeDate = function (data, filter) {
  let flag = false;
  if (filter.length < 2) {
    filter = filter[0];
  }
  const valA = new Date(filter[0].substr(0, 10));
  const valB = new Date(filter[1].substr(0, 10));
  if (new Date(data) >= valA && new Date(data) <= valB) flag = true;
  return flag;
};

const getResults = function (filter) {
  var results = {};
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
  for (let dimension in thisNDX.dimensions) {
    var group = thisNDX.groups[dimension];
    if (filter[dimension]) {
      var filterObj = filter[dimension];
      if (dimension === "LTCs2Dimension") {
        var filterObj = filter[dimension];
        var filts = [];
        filterObj.forEach((x) => filts.push(x[0]));
        thisNDX.dimensions.LTCsDimension.filterFunction((d) => thisNDX.filters.LTCsDimension(d, filts));
      } else if (dimension === "Flags2Dimension") {
        var filterObj = filter[dimension];
        var filts = [];
        filterObj.forEach((x) => filts.push(x[0]));
        thisNDX.dimensions.Flags2Dimension.filterFunction((d) => thisNDX.filters.Flags2Dimension(d, filts));
      } else {
        thisNDX.dimensions[dimension].filterFunction((d) => thisNDX.filters[dimension](d, filterObj));
      }
    } else {
      thisNDX.dimensions[dimension].filter(null);
    }
    results[dimension] = {
      values: group.all(),
      top: group.top(1)[0].value,
      filts: filter[dimension],
    };
  }
  results["all"] = {
    values: thisNDX.all.value(),
  };
  return results;
};

const getData = function (filter, group) {
  var allChartData = [];
  var fullPop = group.all.values;
  var totalCohortPop = 0;
  Object.keys(group).forEach(function (dimensionName) {
    if (dimensionName !== "LTCs2Dimension" && dimensionName !== "Flags2Dimension") {
      if (dimensionName === "SexDimension") {
        group[dimensionName].values.forEach((val) => {
          totalCohortPop += val.value;
        });
        totalCohortPop = JSON.parse(JSON.stringify(totalCohortPop));
      }
      var filterObj = filter;
      var chartFilters = filterObj[dimensionName];
      var usedData = [];

      var initialData = JSON.parse(JSON.stringify(group[dimensionName]["values"]));

      if (chartFilters != undefined) {
        if (typeof chartFilters[0] == "object") {
          var lowVal = chartFilters[0][0];
          var highVal = chartFilters[0][1];

          initialData.forEach(function (e) {
            if (e.key <= lowVal || e.key > highVal) {
              e.value = 0;
            }
          });
        }
        if ((typeof chartFilters[0] === "string" || typeof chartFilters[0] === "number") && dimensionName !== "LTCsDimension" && dimensionName !== "FlagsDimension") {
          var filterCats = chartFilters;

          initialData.forEach(function (e) {
            if (!(filterCats.indexOf(e.key) >= 0)) {
              e.value = 0;
            }
          });
        }
      }

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
          var agebandVal = {};
          var riskbandVal = {};
          var ageBandSize = 5;
          var agebandLab;

          var cumuPop = 0;

          initialData.forEach(function (e, idx, array) {
            cumuPop = cumuPop + e.value;

            if (e.key % ageBandSize == ageBandSize - 1) {
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
          var cutOffs = [3, 4, 5, 10, 20];

          var cumuPop = 0;
          var lastCutoffNo = 0;
          var filteredCutoffs;
          var cutoffNo;

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
        if (dimensionName != "AgeDimension") {
          usedData = usedData.reverse();
        }
      }

      var pushObject = {};
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
      break;
    case "GPDimension":
      return "gp-map-leaflet-comp";
      break;
    case "TDimension":
      return "taxonomy-chart-comp";
      break;
    case "LTCsDimension":
      return "ltc-chart-comp";
      break;
    case "FlagsDimension":
      return "flags-chart-comp";
      break;
    case "SexDimension":
      return "sex-chart-comp";
      break;
    case "MDimension":
      return "mosaic-chart-comp";
      break;
    case "CCGDimension":
      return "ccg-select-comp";
      break;
    case "LCntDimension":
      return "ltc-count-chart-comp";
      break;
    case "AgeDimension":
      return "age-chart-comp";
      break;
    case "RskDimension":
      return "risk-chart-comp";
      break;
    case "DDimension":
      return "imd-chart-comp";
      break;
    case "WDimension":
      return "ward-map-leaflet-comp";
      break;
    case "UDimension":
      return "cost-group-chart-comp";
      break;
    case "MatrixDimension":
      return "matrix-chart-comp";
      break;
    default:
      return "NOTUSED";
  }
};
