//sets up logging level to debug
process.env.LOG_LEVEL = 'debug';

// Importing required modules
const https = require('https');
const fs = require('fs');
const express = require('express');
const path = __dirname + '/views/';
const { auth } = require('express-openid-connect'); // Import Auth0 SDK
const crypto = require('crypto');
const sessionSecret = crypto.randomBytes(64).toString('hex');  
const session = require('express-session');
require('dotenv').config()

const port = process.env.PORT;
//console.log(sessionSecret);

// Configure Auth0 authentication middleware
const config = {
  authRequired: false,  // Whether authentication is required for the route
  auth0Logout: true,    // Enable logout support
  secret: sessionSecret,  // Secret for encrypting session cookies
  baseURL: `${process.env.BASEURL}:${process.env.PORT}`,  // Base URL of your application
  clientID: process.env.CLIENTID,
  clientSecret: process.env.CLIENTSECRET,
  issuerBaseURL: process.env.ISSUERURL,
};

const app = express();
app.set('views', 'views');
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path));
app.use(auth(config));

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }  //true for HTTPS, false for HTTP
}));

app.use(function(req, res, next) {
  //console.log('/' + req.method);
  next();
});

app.get('/', (req, res) => {
  console.log("Inside / route");

  if (!req.oidc.isAuthenticated()) {
      console.log("client not authenticated");
      return res.redirect('/login'); // Redirect to login page if not authenticated
      //res.oidc.login();
  }

  //tried to add a else case to see if this would help with the routing
  res.render("index", {
      title: "GOATH-DEMO-LOGGED-IN",
      isAuthenticated: req.oidc.isAuthenticated(),
      });
});
// Serve home.html
app.get('/home', function(req, res) {
  console.log(path + 'index.html');
  res.sendFile(path + 'index.html');
});

// Profile route (for logged-in users)
app.get('/profile', (req, res) => {
  console.log("Profile - page");
  if (!req.oidc.isAuthenticated()) {
    return res.redirect('/');
  }
  res.send(`Hello ${req.oidc.user.name}`);
});

// Auth0 login route
app.get('/login', (req, res) => {
  cconsole.log("Login - page");
  res.oidc.login();
});

// Auth0 logout route
app.get('/logout', (req, res) => {
  console.log("Logout - page");
  //res.oidc.logout({returnTo: 'https://localhost:3000/exit'});
  res.redirect('/exit'); //to test if it can go to /exit without going through Auth0
});

app.get('/exit', (req, res)=> {
  console.log("Exit - page");
  res.sendFile(path + 'logoutPage.html');
});

// Start the server and listen on port 3000
const options = {
  key: fs.readFileSync('server.key'), cert: fs.readFileSync('server.crt')
};

https.createServer(options, app).listen(port, function () {
  console.log(`Server is running on ${config.baseURL}`);
});