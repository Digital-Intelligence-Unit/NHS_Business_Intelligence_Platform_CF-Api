// @ts-check
const cf = require("./crossfilter");
const configurations = require("../config/cf_configurations").cfConfigurations;
const tablename = process.env.TABLENAME || "population_health_mini";

module.exports.NDX = class NDX {
    constructor() {
        this.groups = {};
        this.dimensions = {};
        this.filters = {};
    }

    init() {
        this.ndx = Object.assign(cf.getModel());
        this.all = this.ndx.groupAll();
        this.dimensions = Object.assign(cf.getDimensions());
        this.groups = Object.assign(cf.getGroups());
        this.filters = Object.assign(cf.getFilters());

        for (const [, value] of Object.entries(this.dimensions)) {
            value.filterAll();
        }

        const config = configurations.find((x) => x.name === tablename) || configurations[0];

        const counters = config.dimensions.filter((x) => x.countDim);
        counters.forEach((dim) => {
            this.dimensions[dim.name].dispose();
            this.groups[dim.name].dispose();
            this.dimensions[dim.name] = this.ndx.dimension((d) => d[dim.tableCol]);
            this.groups[dim.name] = this.dimensions[dim.name].group();
            this.filters[dim.name] = dataMatches;
        });
    }

    addCounts(filter) {
        const config = configurations.find((x) => x.name === tablename) || configurations[0];
        const counters = config.dimensions.filter((x) => x.countDim);

        try {
            const allFilts = [];
            counters.forEach((option) => {
                const filts = [];
                const arr = filter[option.fieldtoCount];
                if (arr && arr.length > 0) arr.forEach((x) => filts.push(x[0]));
                const relatedDim = config.dimensions.find((x) => x.name === option.fieldtoCount);
                allFilts.push({ filters: filts, dimension: option, relatedDim });
            });

            const items = cf.getDataset();
            items.forEach((item) => {
                allFilts.forEach((filt) => {
                    item[filt.dimension.tableCol] = 0;

                    const tableCol = filt.relatedDim.tableCol;
                    const tableColArr = filt.relatedDim.tableColArr;

                    filt.filters.forEach((f) => {
                        if (item[tableCol][tableColArr].indexOf(f) >= 0) item[filt.dimension.tableCol] += 1;
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
            this.filters[dim.name] = dataMatches;
        });
    }
};

const dataMatches = (data, filter) => {
    return filter.includes(data.toString());
};
