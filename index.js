var assemble = require('plumber').assemble;
var Rx = require('plumber').Rx;

var flatten = require('flatten');


function splatArguments() {
    return [].slice.call(arguments);
}

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
            // Cache operation output so that it can be re-read by the
            // combineLatest if another operation fires
            return assemble(op, sharedExecutions).shareReplay();
        });

        // Combine all pipelines into an Observable of Observable executions
        return Rx.Observable.combineLatest(pipelines, splatArguments).
            // Required to merge duplicates (one for each op)...
            throttle(0).
            // Flatten to executions as an Observable
            map(Rx.Observable.merge);
    };
}

module.exports = all;
