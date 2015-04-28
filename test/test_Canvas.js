var util = require("./util");

var prototype = [
  {name: "getContext", type: "fn(contextType: string, width: number, height: number) -> types.CanvasContext"}
];

module.exports = util.runCommonTests("Canvas", {prototype: prototype});

if (module === require.main) require("test").run(exports);