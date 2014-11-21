"use strict";

var fs = require("fs"), path = require("path"), tern = require("tern"), assert = require('assert');
require("../tabris.js");

var projectDir = path.resolve(__dirname, "..");
var resolve = function(pth) {
	return path.resolve(projectDir, pth);
};
var browser = JSON.parse(fs
		.readFileSync(resolve("node_modules/tern/defs/browser.json")), "utf8");
var ecma5 = JSON.parse(fs
		.readFileSync(resolve("node_modules/tern/defs/ecma5.json")), "utf8");
       
var allDefs = {
	browser : browser,
	ecma5 : ecma5
};

var defaultQueryOptions = {
  types: true,
  docs: false,
  urls: false,
  origins: true
}

function createServer(defs, options) {
	var plugins = {};
	if (options) plugins['tabris'] = options; else plugins['tabris'] = {};
	var server = new tern.Server({
		plugins : plugins,
		defs : defs
	});
	return server;
}

exports.assertCompletion = function(text, expected, queryOptions, pluginOptions, name) {
	var defs = [];
	var defNames = ["ecma5", "browser"]; 
	if (defNames) {
		for (var i = 0; i < defNames.length; i++) {
			var def = allDefs[defNames[i]];
			defs.push(def);
		}
	}
	if (!queryOptions) queryOptions = defaultQueryOptions;

	var server = createServer(defs, pluginOptions);
	server.addFile("test1.js", text);
	server.request({
		query : {
			type: "completions",
			file: "test1.js",
			end: text.length,
			types: queryOptions.types,
			docs: queryOptions.docs,
			urls: queryOptions.urls,
			origins: queryOptions.origins,
			caseInsensitive: true,
			lineCharPositions: true,
			expandWordForward: false
		}
	}, function(err, resp) {
		if (err)
			throw err;
		var actualMessages = resp.messages;
		var expectedMessages = expected.messages;
		
		if(name) {
		  var actualItem = {};
		  var completions = resp["completions"];
		  if (completions) {
			  completions.forEach(function(item) {
			    if (item['name'] === name) actualItem = item;
			  });
		  }
		  assert.equal(JSON.stringify(actualItem), JSON.stringify(expected));				
		} else {
		  assert.equal(JSON.stringify(resp), JSON.stringify(expected));	
		}
	});
}
