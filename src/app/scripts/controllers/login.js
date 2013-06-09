'use strict';

angular.module('msgr')
  .controller('LoginController', function ($scope, newsblurService) {
    $scope.getLog = function() {
		newsblurService.login($scope.username, $scope.password)
		.success(function() {
			alert('Login ok');
		})
		.error(function() {
			alert('Login failure!');
		});
	};
  });
