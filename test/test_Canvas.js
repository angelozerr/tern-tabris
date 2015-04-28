var util = require("./util");

var functions = [
  {name: "getContext", type: "fn(contextType: string, width: number, height: number) -> types.CanvasContext"}
];

module.exports = util.runCommonTests("Canvas", {functions: functions});

if (module === require.main) require("test").run(exports);