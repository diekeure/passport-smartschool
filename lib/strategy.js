// Load modules.
var OAuth2Strategy = require('passport-oauth2')
  , url = require('url')
  , merge = require('utils-merge')
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
  this._userInfoURL = options.userInfoURL || '/userinfo';
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
  this._oauth2.get(this._apiURL + this._userInfoURL, accessToken, function (err, body) {
        if (err) {
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
            'name': {
                'familyName': data.surname,
                'givenName': data.name
            },
            'platform': data.platform
        };

        if(data.username) profile.username = data.username;
        if(data.fullname) profile.displayName = data.fullname;
        if(data.birthday) profile.dateOfBirth = data.birthday;
        if(data.email) profile.emails = [{value: data.email}];

        profile._json = data;

        return done(null, profile);
    });
};

/**
 * Replace oauth path to platform if provided in querystring
 * Adjusted copy of OAuth2Strategy.prototype.authenticate from passport-oauth2 lib
 * (https://github.com/jaredhanson/passport-oauth2/blob/master/lib/strategy.js)
 */
Strategy.prototype.authenticate = function (req, options) {
  options = options || {};
  var self = this;

  if (req.query && req.query.error) {
    if (req.query.error == 'access_denied') {
      return this.fail({ message: req.query.error_description });
    } else {
      return this.error(new AuthorizationError(req.query.error_description, req.query.error, req.query.error_uri));
    }
  }

  var callbackURL = options.callbackURL || this._callbackURL;
  /* removed because don't want to copy and include utils from oauth2 package, nor does it matter with current config */
  // if (callbackURL) {
  //   var parsed = url.parse(callbackURL);
  //   if (!parsed.protocol) {
  //     // The callback URL is relative, resolve a fully qualified URL from the
  //     // URL of the originating request.
  //     callbackURL = url.resolve(utils.originalURL(req, { proxy: this._trustProxy }), callbackURL);
  //   }
  // }

  var authorizationURL = getAuthorizeUrl.call(this); /* EDIT */
  var meta = {
    authorizationURL: authorizationURL, /* EDIT */
    tokenURL: this._oauth2._accessTokenUrl,
    clientID: this._oauth2._clientId
  }

  if (req.query && req.query.code) {
    function loaded(err, ok, state) {
      if (err) { return self.error(err); }
      if (!ok) {
        return self.fail(state, 403);
      }

      var code = req.query.code;

      var params = self.tokenParams(options);
      params.grant_type = 'authorization_code';
      if (callbackURL) { params.redirect_uri = callbackURL; }

      self._oauth2.getOAuthAccessToken(code, params,
        function (err, accessToken, refreshToken, params) {
          if (err) { return self.error(self._createOAuthError('Failed to obtain access token', err)); }

          self._loadUserProfile(accessToken, function (err, profile) {
            if (err) { return self.error(err); }

            function verified(err, user, info) {
              if (err) { return self.error(err); }
              if (!user) { return self.fail(info); }

              info = info || {};
              if (state) { info.state = state; }
              self.success(user, info);
            }

            try {
              if (self._passReqToCallback) {
                var arity = self._verify.length;
                if (arity == 6) {
                  self._verify(req, accessToken, refreshToken, params, profile, verified);
                } else { // arity == 5
                  self._verify(req, accessToken, refreshToken, profile, verified);
                }
              } else {
                var arity = self._verify.length;
                if (arity == 5) {
                  self._verify(accessToken, refreshToken, params, profile, verified);
                } else { // arity == 4
                  self._verify(accessToken, refreshToken, profile, verified);
                }
              }
            } catch (ex) {
              return self.error(ex);
            }
          });
        }
      );
    }

    var state = req.query.state;
    try {
      var arity = this._stateStore.verify.length;
      if (arity == 4) {
        this._stateStore.verify(req, state, meta, loaded);
      } else { // arity == 3
        this._stateStore.verify(req, state, loaded);
      }
    } catch (ex) {
      return this.error(ex);
    }
  } else {
    var params = this.authorizationParams(options);
    params.response_type = 'code';
    if (callbackURL) { params.redirect_uri = callbackURL; }
    var scope = options.scope || this._scope;
    if (scope) {
      if (Array.isArray(scope)) { scope = scope.join(this._scopeSeparator); }
      params.scope = scope;
    }

    var state = options.state;
    if (state) {
      params.state = state;

      var parsed = url.parse(authorizationURL, true); /* EDIT */
      merge(parsed.query, params); /* EDIT */
      parsed.query['client_id'] = this._oauth2._clientId;
      delete parsed.search;
      var location = url.format(parsed);
      this.redirect(location);
    } else {
      function stored(err, state) {
        if (err) { return self.error(err); }

        if (state) { params.state = state; }
        var parsed = url.parse(authorizationURL, true); /* EDIT */
        merge(parsed.query, params); /* EDIT */
        parsed.query['client_id'] = self._oauth2._clientId;
        delete parsed.search;
        var location = url.format(parsed);
        self.redirect(location);
      }

      try {
        var arity = this._stateStore.store.length;
        if (arity == 3) {
          this._stateStore.store(req, meta, stored);
        } else { // arity == 2
          this._stateStore.store(req, stored);
        }
      } catch (ex) {
        return this.error(ex);
      }
    }
  }

  /**
   * Return oauth2 authorizeUrl for specific platform, or default when not added to querystring
   */
  function getAuthorizeUrl() {
    if (req.query.platform) {
      // replace first occurence of oauth in url with platform name
      return this._oauth2._authorizeUrl.replace('oauth', req.query.platform);
    }
    return this._oauth2._authorizeUrl;
  }
};
   
// Expose constructor.
module.exports = Strategy;