var util = require("./util");

var inheriting = ["PageSelector"];

var prototype = [
  {name: "insert", type: "fn(items: [?], index?: number)"},
  {name: "remove", type: "fn(index: number, count?: number)"},
  {name: "refresh", type: "fn(index?: number)"},
  {name: "reveal", type: "fn(index: number)"}
];

var properties = [
  {name: "initializeCell", type: "fn"},
  {name: "itemHeight", type: "number"},
  {name: "items", type: "array"},
  {name: "refreshMessage", type: "string"},
];

var events = [{name: "refresh", origin: "CollectionView"}, {name: "select", origin: "CollectionView"}];

module.exports = util.runCommonTests("CollectionView", {
  properties: properties,
  prototype: prototype,
  events: events,
  inheriting: inheriting
});

if (module === require.main) require("test").run(module.exports);