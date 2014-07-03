var assemble = require('plumber').assemble;
var Rx = require('plumber').Rx;

var flatten = require('flatten');

function all(/* operations... */) {
    var operations = [].slice.call(arguments);

    if (operations.length === 0) {
        throw new Error('All needs at least one operation');
    }

    return function(executions) {
        var pipelines = operations.map(function(op) {
            return assemble(op, executions);
        });
        return Rx.Observable.zipArray(pipelines).map(function(zipped) {
            return Rx.Observable.fromArray(zipped).mergeAll();
        });
    };
}

module.exports = all;
