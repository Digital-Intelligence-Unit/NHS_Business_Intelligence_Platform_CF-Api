# Configuration Options for the Crossfilter Server

To re-use the codebase for the Crossfilter Server, you can pass a configuration option at build time, via this variable:

Dockerfile:

```dockerfile
ARG TABLENAME
ENV TABLENAME ${TABLENAME}
```

Or by setting the following environment variable:

```bash
process.env.TABLENAME = 'MY_SELECTED_CONFIGURATION_NAME'
```

The configuration options are available in the file `config/cf_configuration.js` in the array `cfConfigurations`.

## Example Configuration

The below example shows the dimensions, groups and filters required for our Covid-19 Population Health Management Dashboard.

```javascript
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
  }
```

## List of Configuration Options

- covid_populations
- realtime_surveillance
- population_health
- population_health_mini
- outbreakmap
