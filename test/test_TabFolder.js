var util = require("./util");

var properties = [
  {name: "tabBarLocation", type: "string"},
  {name: "paging", type: "bool"},
  {name: "selection", type: "Tab"}
];

var events = [
  {name: "change:selection"},
  {name: "select"}
];

module.exports = util.runCommonTests("TabFolder", {properties: properties, events: events});

if (module === require.main) require("test").run(exports);