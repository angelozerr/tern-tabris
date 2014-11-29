var util = require("./util");

exports['test Action completion'] = function() {

  // get('text')  doesn't exists for Action
  util.assertCompletion("var action = tabris.create('Action', {});action.get('text').", {
  }, null, null, "get");

  util.assertCompletion("var action = tabris.create('Action', {});action.get('image').", {
    "name":"height",
    "type":"number",
    "origin":"tabris"
  }, null, null, "height");
  
}

if (module == require.main) require("test").run(exports);