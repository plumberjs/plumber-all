var flatten = require('flatten');

module.exports = function(/* pipelinesOrOperations... */) {
    // Turn all operations into pipelines (i.e. arrays)
    var pipelinesOrOperations = [].slice.call(arguments);
    var pipelines = pipelinesOrOperations.map(function(pipeOrOp) {
        return flatten([pipeOrOp]);
    });

    // FIXME: hacky!
    return pipelines;
};
