"use strict";

var FeedParser = require("feedparser"), request = require("request"), deferred = require('deferred');

function get_meta(url) {
	var d = deferred();
	request(url)
	.pipe(new FeedParser())
	.on("error", function (error) {
		d.reject(error);
	})
	.on("meta", function (meta) {
		d.resolve({
			title: meta.title,
			description: meta.description,
			link: meta.link,
			xmlUrl: meta.xmlUrl
		});
	});
	return d.promise;
}

function get_stories(url) {
	var d = deferred(), stories = [];
	request(url)
	.pipe(new FeedParser())
	.on("error", function (error) {
		d.reject(error);
	})
	.on("readable", function() {
		var stream = this, item;
		while (item = stream.read()) {
			stories.push({
				title: item.title,
				description: item.description,
				link: item.link,
				pubdate: item.pubdate,
				guid: item.guid
			});

		}
	})
	.on("end", function() {
		d.resolve(stories);
	});
	return d.promise;
}

exports.get_meta = get_meta;
exports.get_stories = get_stories;

/* test */
/*get_meta("http://linuxfr.org/journaux.atom")
.then(
	function (meta) {
		console.log(meta);
	},
	function (error) {
		console.log(error.message);
	}
);

get_stories("http://linuxfr.org/journaux.atom")
.then(
	function (stories) {
		console.log(stories);
	},
	function (error) {
		console.log(error.message);
	}
);*/
