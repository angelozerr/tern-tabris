var util = require("./util");

var properties = [
  {name: "selection", type: "bool"}
];

var events = [{name: "change:selection"}, {name: "select"}];

module.exports = util.runCommonTests("Switch", {properties: properties, events: events});

if (module === require.main) require("test").run(module.exports);
