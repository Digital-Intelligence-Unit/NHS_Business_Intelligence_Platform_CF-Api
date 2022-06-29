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

const capitalizeFirstLetter = (passedString) => {
    return passedString[0].toUpperCase() + passedString.slice(1);
};

const convertStringToYesNo = (dim, col) => {
    if (dim[col]) {
        switch (dim[col].toLowerCase()) {
            case "yes":
            case "y":
            case "true":
                return "Yes";
            case "no":
            case "n":
            case "false":
                return "No";
            default:
                return dim[col];
        }
    }
    return "Unknown";
};

const convertValueOrUnknownUppercase = (dim, col) => {
    if (dim[col]) {
        return capitalizeFirstLetter(dim[col]);
    }
    return "Unknown";
};

const convertSex = (dim, col) => {
    return dim[col] === "M" ? "Male" : "Female";
};

const convertMosType = (dim, col) => {
    return dim[col] === undefined || dim[col] === "null" ? "U99" : dim[col];
};

const combineAgeAndSex = (dim, col) => {
    // console.log(dim);
    // console.log(col);
    // console.log((dim.sex + ":" + dim.age).toString());
    return (dim.sex + ":" + dim.age).toString();
};

const convertValueOrUnknown = (dim, col) => {
    return dim[col] || "Unknown";
};

const convertDateToDayOfTheWeek = (dim, col) => {
    const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dateData = new Date(dim[col]);
    const day = weekday[dateData.getDay()];
    if (day) {
        return day;
    } else {
        return "Unknown";
    }
};

const convertValueOrUnknownLancs12 = (dim, col) => {
    if (!dim[col]) {
        return "Unknown";
    } else {
        if (dim[col].toUpperCase() === "Y") {
            return "Yes";
        } else {
            return "No";
        }
    }
};

const imdDecileToString = (dim, col) => {
    switch (dim[col]) {
        case "Not stated":
        case "N/A":
        case "?":
            return "Unknown";
    }
    return dim[col].toString() || "Unknown";
};

const convertDateToMonth = (dim, col) => {
    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    const dateData = new Date(dim[col]);
    const month = months[dateData.getMonth()];
    if (month) {
        return month;
    } else {
        return "Unknown";
    }
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
            { name: "AgeDimension", type: "string", functiontype: "dataWithinRange", tableCol: "age", groupFloor: true },
            { name: "RskDimension", type: "string", functiontype: "dataWithinRange", tableCol: "rsk", groupFloor: true },
            { name: "DDimension", type: "string", functiontype: "dataMatches", tableCol: "d" },
            { name: "WDimension", type: "string", functiontype: "dataMatches", tableCol: "w" },
            {
                countDim: true,
                name: "numberSelLtc",
                type: "string",
                functiontype: "dataMatches",
                tableCol: "NoSelectedLtcs",
                fieldtoCount: "LTCs2Dimension",
            },
            { name: "FlagsDimension", type: "array", functiontype: "filterContains", tableCol: "flags", tableColArr: "Flags" },
            { name: "Flags2Dimension", type: "array", functiontype: "filterContains", tableCol: "flags", tableColArr: "Flags" },
            {
                countDim: true,
                name: "numberSelFlag",
                type: "string",
                functiontype: "dataMatches",
                tableCol: "NoSelectedFlags",
                fieldtoCount: "Flags2Dimension",
            },
            { name: "FCntDimension", type: "string", functiontype: "dataMatchesFivePlus", tableCol: "fcnt" },
            { name: "MatrixDimension", type: "dualArray", functiontype: "arrayFilterContains", tableCol: "cr,cv" },
        ],
    },
    {
        name: "population_health",
        dataQuery: "SELECT ccg, age, sex, rsk, w, t, m, d, l, gp, u, cst, lcnt, ltcs FROM public.populations;",
        selectedCounts: ["NoSelectedLtcs"],
        dimensions: [
            { name: "LDimension", type: "string", functiontype: "dataMatches", tableCol: "l" },
            { name: "GPDimension", type: "string", functiontype: "dataMatches", tableCol: "gp" },
            { name: "TDimension", type: "string", functiontype: "dataMatches", tableCol: "t" },
            { name: "LTCsDimension", type: "array", functiontype: "filterContains", tableCol: "ltcs", tableColArr: "LTCs" },
            { name: "LTCs2Dimension", type: "array", functiontype: "filterContains", tableCol: "ltcs", tableColArr: "LTCs" },
            { name: "CCGDimension", type: "string", functiontype: "dataMatches", tableCol: "ccg" },
            { name: "SexDimension", type: "stringConvert", functiontype: "dataMatches", tableCol: "sex", function: convertSex },
            { name: "MDimension", type: "stringConvert", functiontype: "dataMatches", tableCol: "m", function: convertMosType },
            { name: "ICPDimension", type: "stringConvert", functiontype: "dataMatches", tableCol: "ccg", function: convertCCGtoICS },
            { name: "LCntDimension", type: "string", functiontype: "dataMatchesFivePlus", tableCol: "lcnt" },
            { name: "AgeDimension", type: "string", functiontype: "dataWithinRange", tableCol: "age", groupFloor: true },
            { name: "RskDimension", type: "string", functiontype: "dataWithinRange", tableCol: "rsk", groupFloor: true },
            { name: "DDimension", type: "string", functiontype: "dataMatches", tableCol: "d" },
            { name: "WDimension", type: "string", functiontype: "dataMatches", tableCol: "w" },
            {
                countDim: true,
                name: "numberSelLtc",
                type: "string",
                functiontype: "dataMatches",
                tableCol: "NoSelectedLtcs",
                fieldtoCount: "LTCs2Dimension",
            },
            { name: "UDimension", type: "string", functiontype: "dataMatches", tableCol: "u" },
            { name: "CstDimension", type: "string", functiontype: "dataMatches", tableCol: "cst" },
        ],
    },
    {
        name: "population_health_mini",
        dataQuery: "SELECT age, w, d, sex FROM public.covid_populations;",
        selectedCounts: [],
        dimensions: [
            { name: "DDimension", type: "string", functiontype: "dataMatches", tableCol: "d" },
            { name: "AgeDimension", type: "stringConvert", functiontype: "dataMatches", tableCol: "age", function: combineAgeAndSex },
            { name: "WDimension", type: "string", functiontype: "dataMatches", tableCol: "w" },
        ],
    },
    {
        name: "outbreakmap",
        dataQuery: `SELECT postcodenowhite as code, patient_sex, age_in_years as age, age_band,
        specimen_date as date, utla, pillar, ethnicity, patient_occupation, x, y, isoids, CASE
          WHEN linked_to_care_home = 'Y' THEN 'Linked To Care Home' ELSE 'Not Linked To Care Home'
        END AS care_home FROM public.covid19_cases_p1p2_isoid;`,
        selectedCounts: [],
        dimensions: [
            { name: "date", type: "date", functiontype: "dataWithinRangeDate", tableCol: "date" },
            { name: "age", type: "string", functiontype: "dataWithinRange", tableCol: "age" },
            { name: "age_band", type: "dualArray", functiontype: "agebandMatch", tableCol: "date,age_band" },
            { name: "code", type: "string", functiontype: "dataMatches", tableCol: "code" },
            { name: "utla", type: "string", functiontype: "dataMatches", tableCol: "utla" },
            { name: "patient_sex", type: "string", functiontype: "dataMatches", tableCol: "patient_sex" },
            { name: "pillar", type: "string", functiontype: "dataMatches", tableCol: "pillar" },
            { name: "ethnicity", type: "string", functiontype: "dataMatches", tableCol: "ethnicity" },
            { name: "patient_occupation", type: "string", functiontype: "dataMatches", tableCol: "patient_occupation" },
            { name: "care_home", type: "string", functiontype: "dataMatches", tableCol: "care_home" },
            { name: "isoids", type: "string", functiontype: "dataMatches", tableCol: "isoids" },
        ],
    },
    {
        name: "realtime_surveillance",
        type: "dynamodb",
        dataQuery: "suicidepreventionindex",
        selectedCounts: [],
        dimensions: [
            { name: "ics", type: "string", functiontype: "dataMatches", tableCol: "ics" },
            { name: "type", type: "stringConvert", functiontype: "dataMatches", tableCol: "type", function: convertValueOrUnknown },
            { name: "method", type: "stringConvert", functiontype: "dataMatches", tableCol: "method", function: convertValueOrUnknown },
            { name: "bcu", type: "stringConvert", functiontype: "dataMatches", tableCol: "bcu", function: convertValueOrUnknown },
            {
                name: "coroner_area",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "coroner_area",
                function: convertValueOrUnknown,
            },
            {
                name: "csp_district",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "csp_district",
                function: convertValueOrUnknown,
            },
            { name: "ccg", type: "stringConvert", functiontype: "dataMatches", tableCol: "ccg", function: convertValueOrUnknown },
            {
                name: "lancs12",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "lancs12",
                function: convertValueOrUnknownLancs12,
            },
            {
                name: "reported_by",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "reported_by",
                function: convertValueOrUnknown,
            },
            { name: "date", type: "date", functiontype: "dataWithinRangeDate", tableCol: "date" },
            { name: "inquest_date", type: "date", functiontype: "dataWithinRangeDate", tableCol: "inquest_date" },
            { name: "local_authority", type: "string", functiontype: "dataMatches", tableCol: "local_authority" },
            { name: "residence_location", type: "location", functiontype: "postcodeMatches", tableCol: "postcode_data" },
            { name: "incident_location", type: "location", functiontype: "postcodeMatches", tableCol: "location_postcode_data" },
            { name: "gender", type: "stringConvert", functiontype: "dataMatches", tableCol: "gender", function: convertValueOrUnknown },
            { name: "age", type: "numberSimple", functiontype: "dataWithinRange", tableCol: "age", function: convertValueOrUnknown },
            {
                name: "occupation",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "occupation",
                function: convertValueOrUnknown,
            },
            {
                name: "type_of_job",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "type_of_job",
                function: convertValueOrUnknown,
            },
            {
                name: "employment",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "employment",
                function: convertValueOrUnknown,
            },
            {
                name: "imd_decile",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "imd_decile",
                function: imdDecileToString,
            },
            {
                name: "bereavement_offered",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "bereavement_offered",
                function: convertValueOrUnknown,
            },
            {
                name: "inquest_conclusion",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "inquest_conclusion",
                function: convertValueOrUnknown,
            },
            {
                name: "rts_accurate",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "rts_accurate",
                function: convertValueOrUnknownUppercase,
            },
            { name: "medication", type: "arraySimple", functiontype: "filterContains", tableCol: "medication" },
            {
                name: "age_group",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "age_group",
                function: convertValueOrUnknown,
            },
            {
                name: "asc_lcc_update",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "asc_lcc_update",
                function: convertValueOrUnknown,
            },
            {
                name: "cgl_update",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "cgl_update",
                function: convertValueOrUnknown,
            },
            {
                name: "csp_resident",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "csp_resident",
                function: convertValueOrUnknown,
            },
            { name: "da", type: "stringConvert", functiontype: "dataMatches", tableCol: "da", function: convertStringToYesNo },
            {
                name: "delphi_update",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "delphi_update",
                function: convertValueOrUnknown,
            },
            { name: "drd_s", type: "stringConvert", functiontype: "dataMatches", tableCol: "drd_s", function: convertValueOrUnknown },
            {
                name: "ethnicity",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "ethnicity",
                function: convertValueOrUnknown,
            },
            {
                name: "registered_gp_practise",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "registered_gp_practise",
                function: convertValueOrUnknown,
            },
            {
                name: "location_postcode_mosaic",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "location_postcode_mosaic",
                function: convertMosType,
            },
            {
                name: "postcode_mosaic",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "postcode_mosaic",
                function: convertMosType,
            },
            {
                name: "mh_services_lscft_update",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "mh_services_lscft_update",
                function: convertValueOrUnknown,
            },
            {
                name: "day_of_the_week",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "date",
                function: convertDateToDayOfTheWeek,
            },
            {
                name: "month",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "date",
                function: convertDateToMonth,
            },
            {
                name: "type_of_location",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "type_of_location",
                function: convertValueOrUnknown,
            },
        ],
    },
];
