// @ts-nocheck (temporary)
const capitalizeFirstLetter = (passedString) => {
    if(passedString && passedString.length > 0){
        return passedString[0].toUpperCase() + passedString.slice(1);
    }
    return passedString;
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
    return dim[col] ? capitalizeFirstLetter(dim[col]) : "Unknown";
};

const getFullWardName = (dim, col) => {
    return dim["wardcode"] ? dim["wardcode"] + " : " + capitalizeFirstLetter(dim["wardname"]) + ", " + capitalizeFirstLetter(dim["laname"]) : "";
};

const getFullWardNameLocation = (dim, col) => {
    return dim["location_wardcode"] ? dim["location_wardcode"] + " : " + capitalizeFirstLetter(dim["location_wardname"]) + ", " + capitalizeFirstLetter(dim["location_laname"]) : "";
};

const convertMosType = (dim, col) => {
    return dim[col] === undefined || dim[col] === "null" ? "U99" : dim[col];
};

const combineAgeAndSex = (dim, col) => {
    return (dim.sex + ":" + dim.ageband).toString();
};

const convertValueOrUnknown = (dim, col) => {
    return dim[col] || "Unknown";
};

const convertDateToDayOfTheWeek = (dim, col) => {
    const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dateData = new Date(dim[col]);
    const day = weekday[dateData.getDay()];
    return day || "Unknown";
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

const convertValueOrUnknownType = (dim, col) => {
    if (!dim[col]) {
        return "Unknown";
    } else {
        if (dim[col].toLowerCase() === "drug related") {
            return "Drug related";
        } else {
            return "Suicide";
        }
    }
};

const imdDecileToString = (dim, col) => {
    switch (dim[col]) {
        case "Not stated":
        case "N/A":
        case "?":
        case null:
            return "Unknown";
    }
    return dim[col] ? dim[col].toString() : "Unknown";
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
    return month || "Unknown";
};

const convertDateToYear = (dim, col) => {
    const dateData = new Date(dim[col]);
    const year = dateData.getFullYear();
    return year;
};

const convertDateAndGender = (dim, col) => {
    const dateData = new Date(dim[col]);
    const year = dateData.getFullYear();
    const gender = dim.gender;
    return year + " " + gender;
};

export const cfConfigurations = [
    {
        name: "population_health_mini",
        capability: null,
        dataQuery: `with initial_table as (
            SELECT gh1.code as c1, gh1.area as a1, gh1.parent_code as pc1, gh1.parent as pa1, 
               gh2.code as c2, gh2.area as a2, gh2.parent_code as pc2, gh2.parent as pa2,
               gh3.code as c3, gh3.area as a3, gh3.parent_code as pc3, gh3.parent as pa3
            FROM public.geography_hierarchy gh1
            LEFT JOIN public.geography_hierarchy gh2 ON gh1.parent_code = gh2.code
            LEFT JOIN public.geography_hierarchy gh3 ON gh2.parent_code = gh3.code
        ),
        union_table as (
            SELECT c1 as code, a1 as area, pc1 as parent_code, pa1 as parent_area
            FROM initial_table
            WHERE pc1 IS NOT NULL
           UNION ALL       
           SELECT c1 as code, a1 as area, pc2 as parent_code, pa2 as parent_area
            FROM initial_table
            WHERE pc2 IS NOT NULL
           UNION ALL
           SELECT c1 as code, a1 as area, pc3 as parent_code, pa3 as parent_area
            FROM initial_table
            WHERE pc3 IS NOT NULL
        ),
        json_lookup as (
            SELECT code, json_build_object('areas', jsonb_agg(parent_code)) as all_areas_lookup 
            FROM union_table
            GROUP BY code
        ),
        agg_output as (
            SELECT CONCAT(floor(age/5) * 5, ' - ', floor(age/5) * 5 + 4) ageband, w, d, sex, count(*) as num
            FROM public.covid_populations cpop
            GROUP BY age, w, d, sex                             
        )
        SELECT ageband, w, d, sex, num, all_areas_lookup as lu
        FROM agg_output cpop
        INNER JOIN json_lookup jlu ON cpop.w = jlu.code`,
        selectedCounts: [],
        dimensions: [
            { name: "DDimension", type: "string", functiontype: "dataMatches", tableCol: "d" },
            { name: "AgeDimension", type: "stringConvert", functiontype: "dataMatches", tableCol: "age", function: combineAgeAndSex },
            { name: "WDimension", type: "string", functiontype: "dataMatches", tableCol: "w" },
            {
                name: "AreaLookup",
                type: "array",
                functiontype: "filterContains",
                tableCol: "lu",
                tableColArr: "areas",
            },
        ],
    },
    {
        name: "realtime_surveillance",
        capability: 'Suicide_Prevention_Intelligence',
        type: "dynamodb",
        dataQuery: "suicidepreventionindex",
        selectedCounts: [],
        dimensions: [
            { name: "ics", type: "stringConvert", functiontype: "dataMatches", tableCol: "ics", function: convertValueOrUnknown },
            { name: "type", type: "stringConvert", functiontype: "dataMatches", tableCol: "type", function: convertValueOrUnknownType },
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
                tableCol: "lancs_12",
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
            {
                name: "local_authority",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "local_authority",
                function: convertValueOrUnknown
            },
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
            {
                name: "year",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "date",
                function: convertDateToYear,
            },
            {
                name: "year_gender",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "date",
                function: convertDateAndGender,
            },
            {
                name: "rts_year",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "rts_year",
                function: convertValueOrUnknown,
            },
            {
                name: "ward",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "ward",
                function: getFullWardName,
            },
            {
                name: "location_ward",
                type: "stringConvert",
                functiontype: "dataMatches",
                tableCol: "ward",
                function: getFullWardNameLocation,
            }
        ],
    },
];
