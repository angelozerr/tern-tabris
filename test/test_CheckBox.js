var util = require("./util");

var properties = [
  {name: "text", type: "string"},
  {name: "selection", type: "bool"}
];

var events = [{name: "change:selection"}];

module.exports = util.runCommonTests("CheckBox", {properties: properties, events: events});

if (module === require.main) require("test").run(module.exports);