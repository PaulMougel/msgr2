'use strict';

angular.module('msgr')
    .controller('LoginController', function ($scope, $location, authService) {
        $scope.foundation();

        $scope.signin = function() {
            var user = { login: $scope.email, password: $scope.password };
            
            authService.signin(user)
            .success(function() {
                $location.path('/stories/');
            })
            .error(function() {
                alert('Signin failure!');
            });
        };

        $scope.signup = function() {
            var user = { login: $scope.email, password: $scope.password };
            
            authService.signup(user)
            .success(function() {
                $location.path('/stories/');
            })
            .error(function() {
                alert('Signup failure!');
            });
        };
    });