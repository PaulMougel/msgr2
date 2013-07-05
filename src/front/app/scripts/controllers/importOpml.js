'use strict';

angular.module('msgr')
    .controller('ImportOpmlController', function ($scope, $q, $location, authService, opmlService, subscriptionsService) {
        // HACK: File upload not implemented yet in angular.js
        // https://groups.google.com/forum/?fromgroups#!topic/angular/-OpgmLjFR_U
        $scope.opmlContent = undefined;
        $scope.upload = function(element) {
            var file = element.files[0];
            var reader = new FileReader();
            reader.onloadend = function(e) {
                $scope.opmlContent = e.target.result;
                $scope.$apply();
            };
            reader.readAsBinaryString(file);
        };

        $scope.import = function() {
            if (! $scope.opmlContent) return;

            var subscriptions = opmlService.import($scope.opmlContent);
            var p = _.map(subscriptions, function (feed) {
                return subscriptionsService.add(feed.xmlUrl);
            });
            $q.all(p).then(function() {
                $location.path('/subscriptions');
            });
        };

        authService.ensureLogin();
    });