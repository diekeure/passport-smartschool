// Load modules.
var OAuth2Strategy = require('passport-oauth2')
  , util = require('util');

/**
 * `Strategy` constructor.
 *
 * The Smartschool authentication strategy authenticates requests by delegating to
 * Smartschool using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `cb`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your Smartschool application's App ID
 *   - `clientSecret`  your Smartschool application's App Secret
 *   - `callbackURL`   URL to which Smartschool will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new SmartschoolStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/smartschool/callback'
 *       },
 *       function(accessToken, refreshToken, profile, cb) {
 *         User.findOrCreate(..., function (err, user) {
 *           cb(err, user);
 *         });
 *       }
 *     ));
 *
 * @constructor
 * @param {object} options
 * @param {function} verify
 * @access public
 */
function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://oauth.smartschool.be/OAuth';
  options.tokenURL = options.tokenURL || 'https://oauth.smartschool.be/OAuth/index/token';
  options.apiURL = options.apiURL || 'https://oauth.smartschool.be/Api/V1';
  options.scopeSeparator = options.scopeSeparator || ' ';

  OAuth2Strategy.call(this, options, verify);
  this.name = 'smartschool';
  this._apiURL = options.apiURL;
}

// Inherit from `OAuth2Strategy`.
util.inherits(Strategy, OAuth2Strategy);

/**
 * Retrieve user profile from Smartschool.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `smartschool`
 *   - `id`               the user's Smartschool ID
 *   - `username`         the user's Smartschool username
 *   - `displayName`      the user's full name
 *   - `name.familyName`  the user's last name
 *   - `name.givenName`   the user's first name
 *   - `platform`         the user's Smartschool platform
 *
 * @param {string} accessToken
 * @param {function} done
 * @access protected
 */
Strategy.prototype.userProfile = function(accessToken, done) {
  this._oauth2.get(this._apiURL + '/userinfo', accessToken, function (err, body) {
    if(err) {
      return done(err);
    }
    
    var data;
    try {
      data = JSON.parse(body);
    } catch (ex) {
      return done(new Error('Failed to parse user profile'));
    }

    var profile = {
      'provider': 'smartschool',
      'id': data.userID,
      'username': data.username,
      'displayName': data.fullname,
      'name': {
        'familyName': data.name,
        'givenName': data.surname
      },
      'platform': data.platform
    };

    profile._raw = body;
    profile._json = data;

    return done(null, profile);
  });
};


// Expose constructor.
module.exports = Strategy;