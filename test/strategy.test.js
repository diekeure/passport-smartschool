/* global describe, it, expect */
/* jshint expr: true */

var SmartschoolStrategy = require('../lib/strategy');
describe('Strategy', function() {
    
  describe('constructed', function() {
    var strategy = new SmartschoolStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});
    
    it('should be named smartschool', function() {
      expect(strategy.name).to.equal('smartschool');
    });
  });
  
  describe('constructed with undefined options', function() {
    it('should throw', function() {
      expect(function() {
        /*jshint nonew: false */
        new SmartschoolStrategy(undefined, function(){});
      }).to.throw(Error);
    });
  });
});
