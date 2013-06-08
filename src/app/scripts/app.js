'use strict';

angular.module('msgr', [])
.config(['$routeProvider', function ($routeProvider) {
	$routeProvider
	.when('/', {
		templateUrl: 'views/index.html',
		controller: 'IndexController'
	})
	.otherwise({
		templateUrl: 'views/404.html'
	});
}]);