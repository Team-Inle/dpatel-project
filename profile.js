module.exports = function(){
    var express = require('express');
    var router = express.Router();
    var axios = require('axios');

    // Render /profile on page visit
    router.get('/', function(req, res, next) {
        var context = {};
        context.user = req.session.profile.display_name;
        context.user_url = req.session.profile.external_urls.spotify;
        if(req.session.profile.images[0]) {
            context.user_image = req.session.profile.images[0].url;
        }
        // if user has playlists, then get saved playlists from session
        else {
            context.user_image = '/public/img/nopic.png';
        }
        if(req.session.playlists) {
            context.playlists = req.session.playlists;
            context.playlists_length = context.playlists.length;
        }

        context.active_profile = true;
        res.render('profile', context);
    }); 

     // Destroy session and return to home page
     router.get('/logout', function(req, res, next) {
        var context = {};
        req.session.destroy();
        res.redirect('/home');
    }); 

    return router;
}();