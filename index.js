var flatten = require('flatten');

module.exports = function(/* pipelinesOrOperations... */) {
    // Turn all operations into flat pipelines (i.e. arrays)
    var pipelinesOrOperations = [].slice.call(arguments);
    var pipelines = pipelinesOrOperations.map(function(pipeOrOp) {
        return flatten([pipeOrOp], 1);
    });

    // FIXME: hacky!
    return pipelines;
};
