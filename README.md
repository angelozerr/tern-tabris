# tern-tabris

[![Build Status](https://secure.travis-ci.org/angelozerr/tern-tabris.png)](http://travis-ci.org/angelozerr/tern-tabris)

[tern-tabris](https://github.com/angelozerr/tern-tabris) is a plugin which adds support for [tabris.js](https://github.com/eclipsesource/tabris-js) to the JavaSript code intelligence system [Tern](http://ternjs.net/).

[tern-tabris](https://github.com/angelozerr/tern-tabris) provides :

 * the tern tabris plugin [tabris.js](https://github.com/angelozerr/tern-tabris/blob/master/tabris.js)
 * the CodeMirror template lint addon [tabris-templates.js](https://github.com/angelozerr/tern-tabris/blob/master/codemirror/addon/hint/javascript/tabris-templates.js) for CodeMirror tabris completion templates.
 * the CodeMirror context autocomplete addon [context-autocomplete-hint.js](https://github.com/angelozerr/tern-tabris/blob/master/codemirror/addon/hint/context-autocomplete-hint.js) for expansion of placeholder variables to strings and triggering autocompletion for functions with string arguments.
 
## Demo

You can play with [online demo](https://tabrisjs.com/downloads/editor.html) which uses CodeMirror ((inside Web Browser).

You can see `Tabris.js Scratchpad - Native Mobile Apps in JavaScript` demo at [youtube](https://www.youtube.com/watch?v=zwk9KTq8RU4).

You can see demos in this git project with CodeMirror in  [demos/tabris.html](https://github.com/angelozerr/tern-tabris/blob/master/demos/tabris.html) :

Here a screenshot with completion with CodeMorror tabris completion :
 
![CodeMirror & TernTabris](https://github.com/angelozerr/tern-tabris/wiki/images/TernTabrisWithCodeMirror.png)

Here a screenshot with completion with Eclipse IDE tabris completion :

![Eclipse & TernTabris](https://github.com/angelozerr/tern-tabris/wiki/images/TernTabrisWithEclipse.png)

If you wish to use Eclipse as IDE, see Eclipse support for [tabris](https://github.com/angelozerr/tern.java/wiki/Tern-&-tabris-support).

## Installation

tern-tabris works with the NodeJS [Tern Server][tern-server], and within a browser.

The easiest way to install tern-tabris is to use a recent version of
[npm][npm]. In the directory where you installed the [tern package][tern-npm],
simply run

```
$ npm install tern-tabris
```

## Configuration

`tabris` support tabris.

### With Node.js

In order for Tern to load the tern-tabris plugin once it is installed, you must
include `tabris` in the `plugins` section of your [Tern configuration
file][tern-config].

Here is a minimal example `.tern-project` configuration file:

```json
{
  "libs":["ecma5"],
  "plugins": {
    "tabris": {}
  }
}
```

### With WebBrowser (CodeMirror)

See [demos/tabris.html](https://github.com/angelozerr/tern-tabris/blob/master/demos/tabris.html)

## Structure

The basic structure of the project is given in the following way:

* `tabris.js` the tern plugin.
* `demos/` demos with tabris tern plugin which use CodeMirror.
* `test` test of the tern plugin.
