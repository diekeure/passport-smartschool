# passport-smartschool

[![Build](https://img.shields.io/travis/diekeure/passport-smartschool.svg)](https://travis-ci.org/diekeure/passport-smartschool)
[![Coverage](https://img.shields.io/coveralls/diekeure/passport-smartschool.svg)](https://coveralls.io/r/diekeure/passport-smartschool)
[![Quality](https://img.shields.io/codeclimate/github/diekeure/passport-smartschool.svg?label=quality)](https://codeclimate.com/github/diekeure/passport-smartschool)
[![Dependencies](https://img.shields.io/david/diekeure/passport-smartschool.svg)](https://david-dm.org/diekeure/passport-smartschool)


[Passport](http://passportjs.org/) strategy for authenticating with [Smartschool](http://www.smartschool.be/)
using the OAuth 2.0 API.

This module lets you authenticate using Smartschool in your Node.js applications.
By plugging into Passport, Smartschool authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Install

    $ npm install diekeure/passport-smartschool

## Usage

#### Create an Application

Before using `passport-smartschool`, you must register your application with
Smartschool, through [this form](http://www.smartschool.be/oauth/).
Smartschool will issue an app ID and app secret, which need to be provided to the strategy.
You will also need to configure a redirect URI which matches the route in your
application.

#### Configure Strategy

The Smartschool authentication strategy authenticates users using a Smartschool
account and OAuth 2.0 tokens.  The app ID and secret obtained when creating an
application are supplied as options when creating the strategy.  The strategy
also requires a `verify` callback, which receives the access token and optional
refresh token, as well as `profile` which contains the authenticated user's
Smartschool profile.  The `verify` callback must call `cb` providing a user to
complete authentication.

```js
passport.use(new SmartschoolStrategy({
    clientID: SMARTSCHOOL_APP_ID,
    clientSecret: SMARTSCHOOL_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/smartschool/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ smartschoolId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
```

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'smartschool'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

```js
app.get('/auth/smartschool',
  passport.authenticate('smartschool'));

app.get('/auth/smartschool/callback',
  passport.authenticate('smartschool', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });
```

## Contributing

#### Tests

The test suite is located in the `test/` directory.  All new features are
expected to have corresponding test cases.  Ensure that the complete test suite
passes by executing:

```bash
$ make test
```

#### Coverage

The test suite covers 100% of the code base.  All new feature development is
expected to maintain that level.  Coverage reports can be viewed by executing:

```bash
$ make test-cov
$ make view-cov
```

## Credits

This package was copied from [passport-facebook](https://github.com/jaredhanson/passport-facebook) by Jared Hanson, and adapted to the needs of smartschool

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2016 Diekeure NV <[http://www.diekeure.be/](http://www.diekeure.be/)>
