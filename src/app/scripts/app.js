'use strict';

angular.module('msgr', [])
.config(['$routeProvider', function ($routeProvider) {
	$routeProvider
	.when('/', {
		templateUrl: 'views/index.html',
		controller: 'IndexController'
	})
	.when('/login', {
		templateUrl: 'views/login.html',
		controller: 'LoginController'
	})
	.otherwise({
		templateUrl: 'views/404.html'
	});
}]);