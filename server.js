/**
 * 
 */

var express = require('express'); // express framework for server
var handlebars = require('express-handlebars').create({defaultLayout:'main'}); // templating engine
var session = require('express-session'); // save user data across a session, realistically don't need cookies
var cors = require('cors'); // enable data from outside this domain
var env = require('dotenv').config(); // enable environment variables from process.env file
var axios = require('axios'); // enable POST requests using Axios library
const e = require('express');

var app = express(); // create express instance called app
app.use(express.json()); // set app to recognize incoming objects as JSON
app.use(express.urlencoded({extended: true})); // ##TODO - this might be default now... not entirely sure if necessary
app.use(cors()); // ##TODO
app.use('/public',express.static(__dirname + '/public')); // set public folder as the web root
console.log(__dirname + '/public');

app.set('port', process.env.PORT); // set app to run on port 4077
app.set('authClient', {
	  client_url: process.env.CLIENT_URL,
	  client_id: process.env.SPOTIFY_CLIENT_ID,
	  client_secret: process.env.SPOTIFY_CLIENT_SECRET,
	}
);

// set app to use sessions
app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: true,
	saveUninitialized: true
}));

//initialize and set app to use handlebars templating engine for views
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use('/login', require('./login.js'));
app.use('/profile', require('./profile.js'));
app.use('/playlist', require('./playlist.js'));

app.get('/', function(req, res){
	var context = {};
	if(req.session.profile) {
		res.redirect('/profile');
	}
	else {
		res.render('home', context);
	}
});

app.get('/home', function(req, res){
	var context = {};
	if(req.session.profile) {
		res.redirect('/profile');
	}
	else {
		res.render('home', context);
	}
});

app.use(function(req,res){
	res.status(404);
	res.render('404');
});

app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500);
	res.render('500');
});

// ##TODO
app.listen(app.get('port'), function(){
	//console.log(app);
	console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
