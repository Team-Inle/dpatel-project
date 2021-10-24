const { ENETUNREACH } = require('constants');

module.exports = function(){
    var express = require('express');
    var router = express.Router();
    var axios = require('axios');

    // Render /profile on page visit
    router.get('/', function(req, res, next) {
        var context = {};
        // if user has logged in, then get user data saved in session and render page
        if(req.session.profile) {
            context.user = req.session.profile.display_name;
            context.user_url = req.session.profile.external_urls.spotify;
            if(req.session.profile.images[0]) {
                context.user_image = req.session.profile.images[0].url;
            }
            else {
                context.user_image = '/public/img/nopic.png';
            }
            if(req.session.playlists) {
                context.playlists = req.session.playlists;
                context.playlists_length = context.playlists.length;
            }
            res.render('profile', context);
        }
        // if user has not logged in, redirect to home page
        else {
            res.redirect('/home');
        }
    }); 

    return router;
}();