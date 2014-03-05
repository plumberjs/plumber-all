var assemble = require('plumber').assemble;

var highland = require('highland');
var flatten = require('flatten');

// TODO: submit to Highland?
function zipAll(streams) {
    return streams.reduce(highland.zip).map(function(pairs) {
        return flatten([pairs]);
    });
}

function all(/* operations... */) {
    var operations = [].slice.call(arguments);
    return function(executions) {
        var pipelines = operations.map(function(op) {
            // ensure streams are forked for each listener
            return assemble(op, executions.fork().invoke('fork'));
        });
        return zipAll(pipelines).map(highland.merge);
        // TODO: or should we use parallel?
        // return zipAll(operators).map(function(allExecutions) {
        //   return highland(allExecutions).parallel(allExecutions.length);
        // });
    };
}

module.exports = all;
