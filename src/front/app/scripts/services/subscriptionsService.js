'use strict';

angular.module('msgr')
.factory('subscriptionsService', function($http, apiBaseUrl, authService) {
    return {
        getSubscriptions: function() {
            return $http({
                method: 'GET',
                url: apiBaseUrl + '/user/feeds',
                withCredentials: true
            });
        }
    };
});