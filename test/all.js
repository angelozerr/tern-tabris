exports['test tabris Tern completion'] = require('./test_completion');
exports['test tabris Action'] = require('./test_Action');
exports['test tabris Label'] = require('./test_Label');

if (require.main === module) require("test").run(exports);