'use strict';

angular.module('msgr')
.controller('SubscriptionsController', function ($scope, subscriptionsService) {
    var refreshSubscriptions = function() {
        subscriptionsService.getAll().success(function(data) {
            $scope.subscriptions = data;
        });
    };

    $scope.add = function() {
        var url = encodeURIComponent($scope.xmlUrl);
        subscriptionsService.add(url).success(refreshSubscriptions);
    };

    // Initialization
    refreshSubscriptions();
});