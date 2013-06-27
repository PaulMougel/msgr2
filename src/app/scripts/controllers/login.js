'use strict';

angular.module('msgr')
    .controller('LoginController', function ($scope, $location, superfeedrService, databaseService) {
        $scope.getLog = function() {
            var login = $scope.email;
            var password = $scope.password;

            superfeedrService.login(login, password)
            .success(function(data, status, headers, config) {
                superfeedrService.registerToken(data);
                databaseService.init(login);
                $location.path('/stories/');
            })
            .error(function() {
                alert('Login failure!');
            });
        };
    });