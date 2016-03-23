/* global describe, it, before, expect */
/* jshint expr: true */

var SmartschoolStrategy = require('../lib/strategy');


describe('Strategy#userProfile', function() {
    
  describe('fetched from default endpoint', function() {
    var strategy = new SmartschoolStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});
  
    strategy._oauth2.get = function(url, accessToken, callback) {
      if (url != 'https://oauth.smartschool.be/Api/V1/userinfo') { return callback(new Error('incorrect url argument')); }
      if (accessToken != 'token') { return callback(new Error('incorrect token argument')); }    
      var body =  '{"userID":"lalalala","name":"Uitgeverij","surname":"Die Keure","fullname":"Die Keure Uitgeverij","username":"diekeure","platform":"https:\/\/platform1.smartschool.be"}';
      callback(null, body, undefined);
    };
    
    
    var profile;
    
    before(function(done) {
      strategy.userProfile('token', function(err, p) {
        if (err) { return done(err); }
        profile = p;
        done();
      });
    });
    
    it('should parse profile', function() {
      expect(profile.provider).to.equal('smartschool');
      expect(profile.id).to.equal('lalalala');
      expect(profile.username).to.equal('diekeure');
      expect(profile.displayName).to.equal('Die Keure Uitgeverij');
      expect(profile.name.familyName).to.equal('Uitgeverij');
      expect(profile.name.givenName).to.equal('Die Keure');
      expect(profile.platform).to.equal('https:\/\/platform1.smartschool.be');
    });
    
    it('should set raw property', function() {
      expect(profile._raw).to.be.a('string');
    });
    
    it('should set json property', function() {
      expect(profile._json).to.be.an('object');
    });
  }); // fetched from default endpoint
  
  describe('error caused by malformed response', function() {
    var strategy =  new SmartschoolStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});
  
    strategy._oauth2.get = function(url, accessToken, callback) {
      var body = 'Hello, world.';
      callback(null, body, undefined);
    };
    
      
    var err, profile;
    
    before(function(done) {
      strategy.userProfile('token', function(e, p) {
        err = e;
        profile = p;
        done();
      });
    });
  
    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('Failed to parse user profile');
    });
  }); // error caused by malformed response

  describe('error caused internally', function() {
    var strategy =  new SmartschoolStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});
  
    strategy._oauth2.get = function(url, accessToken, callback) {
      var e = new Error("InternalServerError");
      callback(e, undefined, undefined);
    };
    
      
    var err, profile;
    
    before(function(done) {
      strategy.userProfile('token', function(e, p) {
        err = e;
        profile = p;
        done();
      });
    });
  
    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('InternalServerError');
    });
  }); // error caused by malformed response
  
});