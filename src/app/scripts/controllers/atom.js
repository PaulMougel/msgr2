'use strict';

angular.module('msgr')
  .controller('AtomController', function ($scope, superfeedrService) {
	$scope.stories = [];
	superfeedrService.atom().then(function (response) {
		var stories = [], els = response.xml.find('entry'), story, i;

        for (i = 0; i < els.length; i += 1) {
            story = angular.element(els[i]);
            stories.push({
              title: story.find('title').text(),
              content: story.find('summary').text()
            });
        }
        $scope.stories = stories;
	});
  });