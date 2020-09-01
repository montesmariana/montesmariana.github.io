const URLUtils = {
    getUrlParameter: function (sLocation, sParam) {
        console.debug('getUrlParameter: ', { sLocation, sParam });
        var sPageURL = decodeURIComponent(sLocation.search.substring(1)),
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