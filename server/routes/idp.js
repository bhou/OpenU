/**
 * Created by BHOU on 6/20/14.
 */
var samlp = require('samlp');
var xtend = require('xtend');
var fs = require('fs');
var passport = require('passport');
var db = require('../lib/db');
var querystring = require('querystring');

// credential used for saml provider
var credential = {
  cert: fs.readFileSync('./resources/cert.pem'),
  key: fs.readFileSync('./resources/key.pem')
}

var issuer = 'OpenU';
var redirectEndpointPath = '/samlp';
var postEndpointPath = '/samlp';

/**
 * the redirect end point
 * @param req
 * @param res
 * @param next
 */
function redirectEndPoint(req, res, next) {
  options = {
  };
  samlp.auth(xtend({}, {
    issuer: issuer,
    getPostURL: getPostURL,
    cert: credential.cert,
    key: credential.key
  }, options))(req, res);
}

/**
 * the post end point
 * @param req
 * @param res
 */
function postEndPoint(req, res, next) {
  options = {
  };
  samlp.auth(xtend({}, {
    issuer: issuer,
    getPostURL: getPostURL,
    cert: credential.cert,
    key: credential.key
  }, options))(req, res);
}

/**
 * get the metadata of the identity provider
 * @param req
 * @param res
 */
function idpMetadata(req, res) {
  samlp.metadata({
    issuer: issuer,
    cert: credential.cert,
    redirectEndpointPath: redirectEndpointPath,
    postEndpointPath: postEndpointPath
  })(req, res);
}

/**
 * retrieve the POST URL
 */
var postURLs = {  /*issuer: url pair*/
  'https://auth0-dev-ed.my.salesforce.com' : 'http://office.google.com'
}
function getPostURL(wtrealm, wreply, req, callback) {
  callback(null, 'http://office.google.com');
}

/**
 * login page for idp
 * @param req
 * @param res
 */
function login(req, res) {
  res.render('login');
}

function doLogin(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err) }

    if (!user) {
      var errCode = "invalid_user";
      if (info!=null && info.message != null) {
        req.session.messages = [info.message];
      }else{
        req.session.messages = "Incorrect user name / password"
      }
      return res.redirect('/login?error='+errCode);
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
        if (req.session.samlquery!=null){
          return res.redirect('/samlp?' + req.session.samlquery);
        }else {
          return res.end('login!');
        }
    });
  })(req, res, next);
}

function register(req, res) {
  res.render('register');
}

function doRegister(req, res, next) {
  var name = req.param('name');
  var email = req.param('email');
  var password = req.param('password');

  var errors = [];
  if (name == null || name.length < 2) {
    errors.push('please enter your user name, length > 2');
    if (name == ""){
      name = null;
    }
  }
  if (email == null || email.indexOf("@") == -1) {
    errors.push('please enter a valid e-mail address');
    if (email == "") {
      email = null;
    }
  }
  if (password == null || password.length < 6) {
    errors.push('password must be at least 6 letters/digitals');
  }

  if ( errors.length > 0 ) {
    res.render('register', {
        name: name,
        email: email
      }
    );
  } else {
    db.saveUser({
      name: req.param('name'),
      email: req.param('email'),
      password: req.param('password')
    }, function (err, docs) {
      if (err) {
        if (err.message.substring(0, 6)=='E11000') {
          req.session.messages = '该用户名或邮箱已经注册';
        }
        req.session.email = email;
        req.session.name = name;


        res.redirect('/register');
        return;
      }

//      sendWelcomeMail(req.param('email'), function(error, response){
//        if(error){
//          console.log(error);
//        }else{
//          console.log("Message sent: " + response.message);
//        }
//      });
      req.session.messages = null;
      return res.redirect('/login');
    });
  }
}


function updateUserAttr(req, res) {
  var name = req.params.name;
  db.updateUserAttr('53a4672455bd142c3051fdb1', 'surname', 'John', function(err, user, attr) {
    if (err) {
      console.error('update user attr error');
      return res.end(err);
    }

    return res.end('Done!')
  });
}


module.exports = {
  redirectEndPoint: redirectEndPoint,
  postEndpoint: postEndPoint,
  idpMetadata: idpMetadata,
  login: login,
  doLogin: doLogin,
  register: register,
  doRegister: doRegister,
  updateUserAttr: updateUserAttr
}