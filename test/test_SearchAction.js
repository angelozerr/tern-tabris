var util = require("./util");

var properties = [
  {name: "proposals", type: "array"},
  {name: "text", type: "string"}
];

var events = [{name: "accept"}, {name: "input"}];

module.exports = util.runCommonTests("SearchAction", {properties: properties, events: events});

if (module === require.main) require("test").run(exports);