"use strict";

var FeedParser = require("feedparser"), request = require("request"), deferred = require('deferred');

function get_meta(url) {
	var d = deferred(), meta = {};
	request(url)
		.on('error', function (error) {
			d.reject(error);
		})
	.pipe(new FeedParser())
		.on('error', function (error) {
			d.reject(error);
		})
		.on('meta', function (data) {
			meta.title = data.title;
			meta.description = data.description;
			meta.link = data.link;
			meta.xmlUrl = data.xmlUrl;
		})
		.on('readable', function() {
			var stream = this, item;
			while (item = stream.read()) {
				// Do nothing, we don't actually care about
				// the articles in this particular function
			}
		})
		.on('end', function () {
			d.resolve(meta);
		});
	return d.promise;
}

function get_stories(url) {
	var d = deferred(), stories = [];
	request(url)
		.on('error', function (error) {
			d.reject(error);
		})
	.pipe(new FeedParser())
		.on('error', function (error) {
			d.reject(error);
		})
		.on('readable', function() {
			var stream = this, item;
			while (item = stream.read()) {
				stories.push({
					title: item.title,
					description: item.description,
					link: item.link,
					pubdate: item.pubdate,
					guid: item.guid,
					feed: item.meta.xmlUrl
				});

			}
		})
		.on('end', function() {
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
