const MAX_QUERY_LIMIT = 5000;

const sanitiseQueryLimit = (reqQueryLimit) => {
    let limit = MAX_QUERY_LIMIT;
    const isQueryLimitPositiveInteger = /^\d+$/.test(reqQueryLimit);
    if (reqQueryLimit && isQueryLimitPositiveInteger) {
        if (reqQueryLimit <= MAX_QUERY_LIMIT) {
            limit = reqQueryLimit;
        }
    }

    return limit.toString();
};

module.exports = { MAX_QUERY_LIMIT, sanitiseQueryLimit };
