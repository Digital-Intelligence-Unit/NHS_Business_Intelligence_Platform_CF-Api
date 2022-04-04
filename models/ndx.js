// @ts-check
const cf = require("./crossfilter");

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

    for (let [key, value] of Object.entries(this.dimensions)) {
      value.filterAll();
    }

    this.dimensions.numberSelLtc.dispose();
    this.groups.numberSelLtc.dispose();
    this.dimensions.numberSelLtc = this.ndx.dimension((d) => d.NoSelectedLtcs);
    this.groups.numberSelLtc = this.dimensions.numberSelLtc.group();
    this.filters.numberSelLtc = dataMatches;

    this.dimensions.numberSelFlag.dispose();
    this.groups.numberSelFlag.dispose();
    this.dimensions.numberSelFlag = this.ndx.dimension((d) => d.NoSelectedFlags);
    this.groups.numberSelFlag = this.dimensions.numberSelFlag.group();
    this.filters.numberSelFlag = dataMatches;
  }

  addCounts(filter) {
    const people = cf.getDataset();
    people.forEach((people_d) => {
      people_d.NoSelectedLtcs = 0;
      people_d.NoSelectedFlags = 0;
    });
    const LTCs = filter["LTCs2Dimension"];
    const Flags = filter["Flags2Dimension"];
    var filts = [];
    if (LTCs && LTCs.length > 0) {
      LTCs.forEach((x) => filts.push(x[0]));
      filts.forEach((filt_d) => {
        people.forEach((people_d) => {
          if (people_d.ltcs["LTCs"].indexOf(filt_d) >= 0) {
            people_d.NoSelectedLtcs = people_d.NoSelectedLtcs + 1;
          }
        });
      });
    }
    if (Flags && Flags.length > 0) {
      var flagfilts = [];
      Flags.forEach((x) => flagfilts.push(x[0]));
      flagfilts.forEach((filt_d) => {
        people.forEach((people_d) => {
          if (people_d.flags["Flags"].indexOf(filt_d) >= 0) {
            people_d.NoSelectedFlags = people_d.NoSelectedFlags + 1;
          }
        });
      });
    }

    this.dimensions.numberSelLtc.dispose();
    this.groups.numberSelLtc.dispose();
    this.dimensions.numberSelLtc = this.ndx.dimension((d) => {
      return d.NoSelectedLtcs || 0;
    });
    this.groups.numberSelLtc = this.dimensions.numberSelLtc.group();
    this.filters.numberSelLtc = dataMatches;
    this.dimensions.numberSelFlag.dispose();
    this.groups.numberSelFlag.dispose();
    this.dimensions.numberSelFlag = this.ndx.dimension((d) => {
      return d.NoSelectedFlags || 0;
    });
    this.groups.numberSelFlag = this.dimensions.numberSelFlag.group();
    this.filters.numberSelFlag = dataMatches;
  }
};

const dataMatches = function (data, filter) {
  return filter.includes(data.toString());
};
