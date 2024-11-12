// @ts-nocheck (temporary)
export const normalise = (original) => {
    return original.replace(/\D/g, "");
}

export const isEmpty = (colData) => {
    if (colData === undefined || colData === "" || colData === null || colData === "null") {
        return true;
    }
    return false;
}

export const flattenLocation = (location, d) => {
    if(location){
        if (isEmpty(location)) {
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

export const dataMatches = (data, filter) => {
    return filter.includes(data.toString());
}