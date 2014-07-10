var assemble = require('plumber').assemble;
var Rx = require('plumber').Rx;

var flatten = require('flatten');


// FIXME: Copied from the RxJS source
//   https://github.com/Reactive-Extensions/RxJS/blob/master/src/core/linq/observable/sharereplay.js
// because it's mistakenly not packaged in Rx. This can go once the
// related PR has been merged:
//   https://github.com/Reactive-Extensions/RxJS/pull/196
function shareReplay(observable, bufferSize, window, scheduler) {
    return observable.replay(null, bufferSize, window, scheduler).refCount();
}

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
        var sharedExecutions = shareReplay(executions.map(function(resources){
            return shareReplay(resources);
        }));
        var pipelines = operations.map(function(op) {
            return assemble(op, sharedExecutions);
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
