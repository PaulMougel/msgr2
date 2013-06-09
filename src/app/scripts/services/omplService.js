'use strict';

angular.module('msgr')
  .factory('omplService', function ($rootScope, $http, newsblurService) {
    // Service logic
    // ...

    // Public API here
    return {
      import: function () {
        return meaningOfLife;
      }
    };
  });
