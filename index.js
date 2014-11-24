var assemble = require('plumber').assemble;
var Rx = require('plumber').Rx;


function all(/* operations... */) {
    var operations = [].slice.call(arguments);

    if (operations.length === 0) {
        throw new Error('All needs at least one operation');
    }

    return function(executions) {
        // Cache executions and resources so that the upstream
        // pipeline isn't re-fetched (and evaluated) for each
        // operation in this all().
        // TODO: can we limit history size to 1?
        var sharedExecutions = executions.map(function(resources){
            return resources.shareReplay();
        }).shareReplay();
        var pipelines = operations.map(function(op) {
            return assemble(op, sharedExecutions);
        });

        return Rx.Observable.zip.apply(this, pipelines.concat(Rx.Observable.concat))
    };
}

module.exports = all;
