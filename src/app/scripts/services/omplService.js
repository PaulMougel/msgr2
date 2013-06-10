'use strict';

angular.module('msgr')
  .factory('omplService', function ($rootScope, $http, newsblurService) {
    // Public API here
    return {
      import: function (opml) {
        parser = new DOMParser();
        xmlDoc = parser.parseFromString(opml,"text/xml");
        outlines = xmlDoc.getElementsByTagName("outline");
        var feeds, i;
        for (i = 0; i < outlines.length; i += 1) {
          if (outlines[i].attributes.xmlUrl && outlines[i].attributes.htmlUrl && outlines[i].attributes.type.nodeValue === "rss") { // is a feed
              console.log(">>> [" + outlines[i].attributes.title.nodeValue + "](" + outlines[i].attributes.xmlUrl.nodeValue + ")");
          } else { // is a folder
              console.log(outlines[i].attributes.title.nodeValue);
          }
        }
      }
    };
  });
