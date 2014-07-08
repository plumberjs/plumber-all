var chai = require('chai');
chai.should();

var sinon = require("sinon");
var sinonChai = require("sinon-chai");
chai.use(sinonChai);

var Resource = require('plumber').Resource;
var Rx = require('plumber').Rx;

var runOperation = require('plumber-util-test').runOperation;
var completeWithResources = require('plumber-util-test').completeWithResources;


var all = require('..');

// A factory for mock operations, so that we can spy on what it
// receives and make it return custom resources.
function createMockOperation(mappers) {
    mappers = mappers || {};

    // Note: noop mock operation - return the resource unchanged
    var op = function(executions) {
        return executions.map(executionMapper);
    };
    var executionMapper = mappers.executions || sinon.spy(function(resources) {
        return resources.map(resourceMapper);
    });
    var resourceMapper = mappers.resources || sinon.spy(function(resource) {
        return resource;
    });

    op.executions = executionMapper;
    op.resources  = resourceMapper;

    return op;
}

function resourcesError() {
  chai.assert(false, "error in resources observable");
}


describe('all', function(){
    it('should be a function', function(){
        all.should.be.a('function');
    });

    it('should throw an exception when passed no operation', function(){
        (function() {
            all();
        }).should.throw('All needs at least one operation');
    });


    describe('when operations are provided', function(done){
        var op1, op2;

        beforeEach(function() {
            op1 = createMockOperation();
            op2 = createMockOperation();
        });

        it('should call the operations even with no input resources', function(done){
            var result = runOperation(all(op1, op2), []).resources;
            completeWithResources(result, function(resources) {
                op1.executions.should.have.callCount(1);
                op1.resources.should.have.callCount(0);
                op2.executions.should.have.callCount(1);
                op2.resources.should.have.callCount(0);
            }, resourcesError, done);
        });

        it('should call the operations with all input resources', function(done){
            var resource1 = new Resource({path: 'file-1.js'});
            var resource2 = new Resource({path: 'file-2.js'});
            var result = runOperation(all(op1, op2), [resource1, resource2]).resources;
            completeWithResources(result, function(resources) {
                [op1, op2].forEach(function(op) {
                    op.executions.should.have.callCount(1);
                    op.resources.should.have.callCount(2);
                    op.resources.should.have.been.calledWith(resource1);
                    op.resources.should.have.been.calledWith(resource2);
                });
            }, resourcesError, done);
        });


        it('should read only once from the input resources', function(done) {
            var resource1 = new Resource({path: 'file-1.js'});
            var resources = [resource1];

            // Spy on reads from the underlying resources
            var resourcesSpy = sinon.spy();
            // TODO: extend runOperation to allow instrumenting,
            // rather than copying it here.
            var resourcesStream = Rx.Observable.fromArray(resources).do(resourcesSpy);
            var executions = Rx.Observable.return(resourcesStream);
            var operation = all(op1, op2);
            var output = operation(executions);
            var result = output.concatAll();

            completeWithResources(result, function() {
                resourcesSpy.should.have.callCount(resources.length);
            }, resourcesError, done);
        });


        it('should read only once from each operation', function(done) {
            var resource1 = new Resource({path: 'file-1.js'});
            var resource2 = new Resource({path: 'file-2.js'});
            var result = runOperation(all(op1, op2), [resource1]).resources;

            completeWithResources(result, function() {
                [op1, op2].forEach(function(op) {
                    op.executions.should.have.callCount(1);
                    op.resources.should.have.callCount(1);
                    op.resources.should.have.been.calledWith(resource1);
                });
            }, resourcesError, done);
        });

    });


    describe('when a single operation returns resources', function() {
        var result;

        it('should return no resources if the operation returned no resources', function(done){
            var op = createMockOperation({
                executions: function() {
                    return Rx.Observable.empty();
                }
            });

            result = runOperation(all(op), []).resources;

            completeWithResources(result, function(resources) {
                resources.length.should.equal(0);
            }, resourcesError, done);
        });

        it('should return all the resources the operation returned', function(done){
            var resource1 = new Resource({path: 'file-1.js'});
            var resource2 = new Resource({path: 'file-2.js'});

            var op = createMockOperation({
                executions: function() {
                    return Rx.Observable.fromArray([resource1, resource2]);
                }
            });

            result = runOperation(all(op), []).resources;

            completeWithResources(result, function(resources) {
                resources.length.should.equal(2);
                resources[0].should.equal(resource1);
                resources[1].should.equal(resource2);
            }, resourcesError, done);
        });
    });


    describe('when multiple operations return resources', function() {
        var result;

        it('should return all resources in the sequence the operations returned them', function(done){
            var resource1 = new Resource({path: 'file-1.js'});
            var resource2 = new Resource({path: 'file-2.js'});
            var resource3 = new Resource({path: 'file-3.js'});

            var op1 = createMockOperation({
                executions: function() {
                    return Rx.Observable.merge(
                        Rx.Observable.return(resource1),
                        Rx.Observable.return(resource3).delay(200)
                    );
                }
            });

            var op2 = createMockOperation({
                executions: function() {
                    return Rx.Observable.return(resource2).delay(100);
                }
            });

            result = runOperation(all(op1, op2), []).resources;

            completeWithResources(result, function(resources) {
                resources.length.should.equal(3);
                resources[0].should.equal(resource1);
                resources[1].should.equal(resource2);
                resources[2].should.equal(resource3);
            }, resourcesError, done);
        });
    });

});
