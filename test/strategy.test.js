/* global describe, it, expect, before */
/* jshint expr: true */

var chai = require('chai')
  , SmartschoolStrategy = require('../lib/strategy');


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
  })
  
  describe('constructed with undefined options', function() {
    it('should throw', function() {
      expect(function() {
        var strategy = new SmartschoolStrategy(undefined, function(){});
      }).to.throw(Error);
    });
  })
});
