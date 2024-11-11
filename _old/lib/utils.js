class Utils {
    static normalise(original) {
        return original.replace(/\D/g, "");
    }

    static isEmpty = (colData) => {
        if (colData === undefined || colData === "" || colData === null || colData === "null") {
            return true;
        }
        return false;
    }

    static flattenLocation(location, d) {
        if(location){
            if (Utils.isEmpty(location)) {
                return "Unknown";
            }
            try {
                const locationData = JSON.parse(location);
                if(locationData.postcode && locationData.latitude && locationData.longitude){
                    return locationData.postcode + "|" + locationData.latitude + "|" + locationData.longitude + "|" + d.method + "|" + d.type;
                }
                return "Uknown";
            } catch (error) {
                console.log(error);
            }
        }
        return "Unknown";
    }

    static dataMatches(data, filter) {
        return filter.includes(data.toString());
    }
}

module.exports = Utils;