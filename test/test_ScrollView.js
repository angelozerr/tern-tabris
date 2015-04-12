var util = require("./util");

var properties = [
  {name: "direction", type: "string"}
];

var events = [{name: "scroll"}];

module.exports = util.runCommonTests("ScrollView", {properties: properties, events: events});

if (module === require.main) require("test").run(exports);