var util = require("./util");

var properties = [
  {name: "items", type: "array"},
  {name: "selectionIndex", type: "number"},
  {name: "text", type: "string"}
];

var events = [{name: "change:selection"}];

module.exports = util.runCommonTests("Picker", {properties: properties, events: events});

if (module === require.main) require("test").run(exports);