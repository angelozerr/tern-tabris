$(function() {

  window.cmEditor = window.cmEditor || {};
  cmEditor.editor = CodeMirror.fromTextArea(document.getElementById("code"), {
    mode: 'application/javascript',
    theme: "eclipse",
    styleActiveLine: true,
    lineNumbers: true,
    lineWrapping: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    extraKeys: {
      "'.'": passAndHint,
      "Ctrl-Space": "contextAutocomplete",
      "Ctrl-I": function(cm) {
        CodeMirror.tern.showType(cm);
      },
      "Alt-.": function(cm) {
        CodeMirror.tern.jumpToDef(cm);
      },
      "Alt-,": function(cm) {
        CodeMirror.tern.jumpBack(cm);
      },
      "Ctrl-Q": function(cm) {
        CodeMirror.tern.rename(cm);
      }
    },
    gutters: ["CodeMirror-linenumbers"],
    textHover: {
      delay: 300
    },
    ternWith: {
      plugins: {
        "tabris": {},
        "guess-types": {}
      }
    }
  });

  function passAndHint(cm) {
    setTimeout(function() {
      CodeMirror.showHint(cm, CodeMirror.ternHint, {async: true});
    }, 100);
    return CodeMirror.Pass;
  }

});
