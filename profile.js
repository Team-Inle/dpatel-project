module.exports = function(){
    var express = require('express');
    var router = express.Router();
    var shared = require('./shared.js');

    /**
     * Profile Page - Render user's profile and playlist info as Profile page
     * @params req.session.profile, req.session.playlists
     * @returns /profile (view)
     */
    router.get('/', function(req, res, next) {
        var context = {};
        shared.userNavBarContext(context, req);
        
        context.active_profile = true;
        res.render('profile', context);
    }); 

     /**
     * Logout Interface - Delete user's session and redirect back home
     * @params req.session
     * @returns /home (view)
     */
     router.get('/logout', function(req, res, next) {
        var context = {};
        req.session.destroy();
        res.redirect('/home');
    }); 

    return router;
}();