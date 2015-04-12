var util = require("./util");

exports['test tabris completion'] = function() {
  util.assertCompletion("ta", {
    "start":{"line":0,"ch":0},
    "end":{"line":0,"ch":2},
    "isProperty":false,
    "isObjectKey": false,
    "completions":[{"name":"tabris","type":"tabris","origin":"tabris"}]
  });
};

exports['test tabris.create undefined completion'] = function() {
  util.assertCompletion("var button = tabris.create('Undefined', {});button.", {
    "start":{"line":0,"ch":51},
    "end":{"line":0,"ch":51},
    "isProperty":true,
    "isObjectKey": false,
    "completions":[]
  });
};

if (module === require.main) require("test").run(exports);