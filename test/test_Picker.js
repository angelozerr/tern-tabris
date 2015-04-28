var util = require("./util");

var properties = [
  {name: "items", type: "array"},
  {name: "selectionIndex", type: "number"},
  {name: "selection", type: "string"}
];

var events = [
  {name: "change:selectionIndex"},
  {name: "change:selection"},
  {name: "select"}
];

module.exports = util.runCommonTests("Picker", {properties: properties, events: events});

if (module === require.main) require("test").run(exports);