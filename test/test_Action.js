var util = require("./util");

var inheriting = ["SearchAction"];

var properties = [
  {name: "enabled", type: "bool"},
  {name: "textColor", type: "Color"},
  {name: "image", type: "Image"},
  {name: "placementPriority", type: "string"},
  {name: "title", type: "string"},
  {name: "visible", type: "bool"}
];

var events = [{name: "select", origin: "Action"}];

var functions = [{name: "on", type: "fn(type: string, listener: fn())", returnType: "Action"}];

module.exports = util.runCommonTests("Action", {
  properties: properties,
  events: events,
  functions: functions,
  inheriting: inheriting
});

if (module === require.main) require("test").run(exports);