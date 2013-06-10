'use strict';

angular.module('msgr')
  .controller('LoginController', function ($scope, superfeedrService) {
    $scope.getLog = function() {
		superfeedrService.login($scope.email, $scope.password)
		.success(function(data, status, headers, config) {
			superfeedrService.registerToken(data);
			superfeedrService.user()
			.success(function (data, status, headers, config) {
				console.log(data);
			})
			.then(function() {
				superfeedrService.subscriptions()
				.success(function (data, status, headers, config) {
					console.log(data);
				})
			});
		})
		.error(function() {
			alert('Login failure!');
		});
	};
  });
