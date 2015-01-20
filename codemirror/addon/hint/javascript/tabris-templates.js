(function() {
  var templates = {
    "name": "javascript",
    "context": "javascript",
    "templates": [{
      "name": "properties",
      "description": "With LayoutData containing `left`, `top` and `right` arguments.",
      "template": "{layoutData: {left: 0, top: 0, right: 0}"
    }, {
      "name": "properties",
      "description": "With Text, Font and LayoutData containing `left`, `top` and `right` arguments.",
      "template": "{text: ${text}, font: \"14px\", layoutData: {left: 0, top: 0, right: 0}"
    }]
  };
  CodeMirror.templatesHint.addTemplates(templates);
})();