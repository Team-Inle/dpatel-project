/**
 * 
 */

// Frameworks
var express = require('express'); // Use: server framework
var handlebars = require('express-handlebars').create({defaultLayout:'main'}); // Use: templating engine
var session = require('express-session'); // Use: save user data across a session, realistically don't need cookies
var cors = require('cors'); // Use: enable data from outside this domain
var env = require('dotenv').config(); // Use: enable environment variables from process.env file
var axios = require('axios'); // Use: enable POST requests using Axios library


// Setup Framework
var app = express();
app.use(express.json()); // set app to recognize incoming objects as JSON
app.use(express.urlencoded({extended: true}));

app.use(cors());

app.use('/public',express.static(__dirname + '/public'));

app.set('port', process.env.PORT);
app.set('authClient', {
	  client_url: process.env.CLIENT_URL,
	  client_id: process.env.SPOTIFY_CLIENT_ID,
	  client_secret: process.env.SPOTIFY_CLIENT_SECRET,
	}
);

app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: true,
	saveUninitialized: true
}));

// initialize and set app to use handlebars templating engine for views
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

/**
 * Page Specific Module Imports
 */
app.use('/login', require('./login.js'));
app.use('/profile', require('./profile.js'));
app.use('/playlist', require('./playlist.js'));
app.use('/about', require('./about.js'));

/**
 * Home Page
 * Render login page or redirect to profile if already logged in (via session check)
 */
app.get(['/', '/home'], function(req, res){
	var context = {};
	if(req.session.profile) {
		res.redirect('/profile');
	}
	else {
		res.render('home', context);
	}
});

/**
 * 404 Error Page
 */
app.use(function(req,res){
	res.status(404);
	res.render('404');
});

/**
 * 500 Error Page
 */
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500);
	res.render('500');
});

/**
 * Launch Server on 
 */
app.listen(app.get('port'), function(){
	console.log('Express started on ' + app.get('authClient').CLIENT_URL + ':' + app.get('port') + '; press Ctrl-C to terminate.');
});
