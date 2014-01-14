var flatten = require('flatten');

function asArray(valOrArray) {
    if (Array.isArray(valOrArray)) {
        return valOrArray;
    } else {
        return [valOrArray];
    }
}

module.exports = function(/* pipelinesOrOperations... */) {
    // Turn all operations into pipelines (i.e. arrays)
    var pipelinesOrOperations = [].slice.call(arguments);
    return pipelinesOrOperations.map(asArray);
};
