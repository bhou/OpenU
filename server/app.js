
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var idp = require('./routes/idp');
var api = require('./routes/api');
var MongoStore = require('connect-mongo')(express);
var passport = require('passport');
var config = require('./config');
var db = require('./lib/db');
var User = require('./lib/dao').User;


var app = express();

// connect the database
var conn = "mongodb://" + config.mongostore.username + ":" + config.mongostore.password + "@"
  + config.mongostore.host + ":" + config.mongostore.port + "/" + config.mongostore.db;
db.startup(conn);


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('2014OpenUCookieParser2014'));
app.use(express.session({store: new MongoStore(config.mongostore)}));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

/**
 * web interface
 */
app.get('/register', idp.register);
app.post('/doRegister', idp.doRegister);

app.get('/login', idp.login);
app.post('/doLogin', idp.doLogin);

/**
 * API
 * this is used by the application / client
 */
// api for admin
app.post('/api/app', api.newApplication); // create a new application

// api for application
app.post('/api/login', api.ensureAppAuthenticated, api.login);   // get the login token
app.get('/api/user/:id', api.ensureAppAuthenticated, api.getUserInfo);    // get user information
app.post('/api/user', api.ensureAppAuthenticated, api.createUser);    // create user information
app.put('/api/user/:id', api.ensureAppAuthenticated, api.setUserAttr);   // update user information


/**
 * saml provider
 */
//configure samlp middleware
app.get('/samlp', idp.redirectEndPoint);
app.post('/samlp', idp.postEndpoint);
app.get('/samlp/metadata.xml', idp.idpMetadata);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
