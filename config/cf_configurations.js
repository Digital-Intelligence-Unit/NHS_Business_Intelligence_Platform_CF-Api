// @ts-check

const convertCCGtoICS = (value) => {
  switch (value) {
    case "02M":
    case "00R":
      return "Fylde Coast";
    case "02G":
      return "West Lancs";
    case "00Q":
    case "01A":
      // "Blackburn with Darwen CCG" 00Q
      // "East Lancs CCG" 01A
      return "Pennine Lancashire";
    case "00X":
    case "01E":
      // "Chorley and South Ribble CCG" 00X
      // "Greater Preston CCG" 01E
      return "Central Lancashire";
    case "01K":
      // "Lancashire North CCG" 01K
      return "Morecambe Bay";
    default:
      return "Other";
  }
};

const convertSex = (value) => {
  return value === "M" ? "Male" : "Female";
};

const convertMosType = (value) => {
  return value === "undefined" ? "U99" : value;
};

module.exports.cfConfigurations = [
  {
    name: "covid_populations",
    dataQuery: "SELECT ccg, age, sex, rsk, w, m, d, l, gp, lcnt, fcnt, ltcs, flags, cr, cv FROM covid_populations;",
    selectedCounts: ["NoSelectedLtcs", "NoSelectedFlags"],
    dimensions: [
      { name: "LDimension", type: "string", functiontype: "dataMatches", tableCol: "l" },
      { name: "GPDimension", type: "string", functiontype: "dataMatches", tableCol: "gp" },
      { name: "LTCsDimension", type: "array", functiontype: "filterContains", tableCol: "ltcs", tableColArr: "LTCs" },
      { name: "LTCs2Dimension", type: "array", functiontype: "filterContains", tableCol: "ltcs", tableColArr: "LTCs" },
      { name: "CCGDimension", type: "string", functiontype: "dataMatches", tableCol: "ccg" },
      { name: "SexDimension", type: "stringConvert", functiontype: "dataMatches", tableCol: "sex", function: convertSex },
      { name: "MDimension", type: "stringConvert", functiontype: "dataMatches", tableCol: "m", function: convertMosType },
      { name: "ICPDimension", type: "stringConvert", functiontype: "dataMatches", tableCol: "ccg", function: convertCCGtoICS },
      { name: "LCntDimension", type: "string", functiontype: "dataMatchesFivePlus", tableCol: "lcnt" },
      { name: "AgeDimension", type: "string", functiontype: "dataWithinRange", tableCol: "age" },
      { name: "RskDimension", type: "string", functiontype: "dataWithinRange", tableCol: "rsk" },
      { name: "DDimension", type: "string", functiontype: "dataMatches", tableCol: "d" },
      { name: "WDimension", type: "string", functiontype: "dataMatches", tableCol: "w" },
      { countDim: true, name: "numberSelLtc", type: "string", functiontype: "dataMatches", tableCol: "NoSelectedLtcs", fieldtoCount: "LTCs2Dimension" },
      { name: "FlagsDimension", type: "array", functiontype: "filterContains", tableCol: "flags", tableColArr: "Flags" },
      { name: "Flags2Dimension", type: "array", functiontype: "filterContains", tableCol: "flags", tableColArr: "Flags" },
      { countDim: true, name: "numberSelFlag", type: "string", functiontype: "dataMatches", tableCol: "NoSelectedFlags", fieldtoCount: "Flags2Dimension" },
      { name: "FCntDimension", type: "string", functiontype: "dataMatchesFivePlus", tableCol: "fcnt" },
      { name: "MatrixDimension", type: "dualArray", functiontype: "arrayFilterContains", tableCol: "cr,cv" },
    ],
  },

  // TODO: Add configuration for Real Time Surveillance crossfilter
  // TODO: Add configuration for PHM crossfilter
  // TODO: Add configuration for mini-PHM crossfilter
];
