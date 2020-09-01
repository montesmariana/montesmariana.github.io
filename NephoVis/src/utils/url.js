const URLUtils = {
    getUrlParameter: function (sLocation, sParam) {
        console.debug('getUrlParameter: ', { sLocation, sParam });
        return getQueryStringParameter(sLocation.search, sPageURL);
    },
    
    getQueryStringParameter: function (querystring, sParam) {
        console.debug('getQueryStringParameter: ', { querystring, sParam });
        var sPageURL = decodeURIComponent(querystring.substring(1)),
            sURLVariables = sPageURL.split("&"),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split("=");
            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    }

    
}

exports.getUrlParameter = URLUtils.getUrlParameter;
exports.getQueryStringParameter = URLUtils.getQueryStringParameter;