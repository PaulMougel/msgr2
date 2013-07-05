'use strict';

angular.module('msgr')
.factory('opmlService', function () {
    // Public API here
    return {
        import: function (opml) {
            // TODO: Manage folders properly instead of returning a flat list of feeds
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(opml, 'text/xml');
            var outlines = xmlDoc.getElementsByTagName('outline');
            var i;
            var feeds = []; 
            for (i = 0; i < outlines.length; i += 1) {
                if (outlines[i].attributes.xmlUrl && outlines[i].attributes.htmlUrl && outlines[i].attributes.type.nodeValue === "rss") { // is a feed
                    feeds.push({
                        title: outlines[i].attributes.title.nodeValue,
                        xmlUrl: outlines[i].attributes.xmlUrl.nodeValue
                    });
                } else { // is a folder
                    // Folder name : outlines[i].attributes.title.nodeValue;
                }
            }

            return feeds;
        }
    };
});