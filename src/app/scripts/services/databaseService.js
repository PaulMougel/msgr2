'use strict';

angular.module('msgr')
.factory('databaseService', function() {
    return {
        db: undefined,
        init: function(login) {
            // Create of fetch the user associated database
            this.db = new Pouch('msgr-' + login);
        }
    };
});