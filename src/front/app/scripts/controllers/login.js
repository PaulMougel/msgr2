'use strict';

angular.module('msgr')
    .controller('LoginController', function ($scope, $location, authService) {
        var signin = function(user) {
            authService.signin(user)
            .success(function() {
                $location.path('/subscriptions/');
            })
            .error(function() {
                alert('Signin failure!');
            });
        };

        $scope.signin = function() {
            signin({ login: $scope.login, password: $scope.password });
        };

        $scope.signup = function() {
            var user = { login: $scope.login, password: $scope.password };
            
            authService.signup(user)
            .success(function() {
                return signin(user);
            })
            .error(function() {
                alert('Signup failure!');
            });
        };
    });