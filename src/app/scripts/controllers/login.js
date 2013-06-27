'use strict';

angular.module('msgr')
    .controller('LoginController', function ($scope, $location, superfeedrService) {
        $scope.getLog = function() {
            superfeedrService.login($scope.email, $scope.password)
            .success(function(data, status, headers, config) {
                superfeedrService.registerToken(data);
                $location.path('/stories/');
            })
            .error(function() {
                alert('Login failure!');
            });
        };
    });