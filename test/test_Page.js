var util = require("./util");

var properties = [
  {name: "image", type: "Image"},
  {name: "title", type: "string"},
  {name: "topLevel", type: "bool"}
];

var prototype = [
  {name: "close", type: "fn()"},
  {name: "open", type: "fn()"}
];

var events = [{name: "appear"}, {name: "resize"}, {name: "disappear"}];

module.exports = util.runCommonTests("Page", {properties: properties, events: events, prototype: prototype});

if (module === require.main) require("test").run(exports);