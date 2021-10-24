const { ENETUNREACH } = require('constants');

module.exports = function(){
    var express = require('express');
    var router = express.Router();
    var axios = require('axios');

    // Render /profile on page visit
    router.get('/', function(req, res, next) {
        var context = {};
        // if user has logged in, redirect them to the profile page
        if(req.session.profile) {
            res.redirect('/profile')
        }
        // if user has not logged in, begin Spotify OAuth sequence
        else {
            res.redirect('/login/spotifyAuthLogin');
        }
    }); 

    /**
     * Spotify OAuth Interface - authorization
     */
    router.get('/spotifyAuthLogin', function(req, res) {
        var params = new URLSearchParams();
        params.set('response_type', 'code');
        params.set('client_id', req.app.get('authClient').client_id);
        params.set('redirect_uri', req.app.get('authClient').client_url + '/login/spotifyAuthCallback');
        console.log(req.app.get('authClient').client_url + '/login/spotifyAuthCallback');
        res.redirect('https://accounts.spotify.com/authorize?' + params.toString());
    });

    /**
     * Spotify OAuth Interface - tokens
     */
    router.get('/spotifyAuthCallback', function(req, res) {
        // if user has accepted the request then autherization code should have been returned
        if (req.query.code) {
            var params = new URLSearchParams();
            params.set('code', req.query.code);
            params.set('redirect_uri', req.app.get('authClient').client_url + '/login/spotifyAuthCallback');
            params.set('grant_type', 'authorization_code');
            
            // headers for requesting tokens per Spotify docs
            var headers = {
                headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(req.app.get('authClient').client_id + ':' + req.app.get('authClient').client_secret).toString('base64')
                },
            };
    
            // perform POST request to token API with params and headers
            axios.post('https://accounts.spotify.com/api/token', params.toString(), headers)
                .then(response => {
                    // store token data in session
                    req.session.token_data = response.data;
                    res.redirect('/login/fetchProfile');
                })
                .catch(error => {
                    console.log(error);
                });
            }
            // otherwise some error should be sent back
            else if (req.query.error) {
            // ##TODO
            }
            // this should never happen, but if it does - do something
            else {
            // ##TODO
        }
    });

    /**
     * Spotify OAuth Interface - fetch user's profile data
     */
    router.get('/fetchProfile', function(req, res) {
         // if app has user's auth token, then fetch their profile data
        if(req.session.token_data) {
            var headers = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Bearer ' + req.session.token_data.access_token,
                },
            };
            axios.get('https://api.spotify.com/v1/me', headers)
                .then(response => {
                    req.session.profile = response.data;
                    console.log(req.session.profile);
                    res.redirect('/login/fetchPlaylists');
                })
                .catch(error => {
                    console.log(error);
                });
        }
        // otherwise re-initiate login & authorization
        else {
            res.redirect('/login');
        }
    });

    /**
     * Spotify OAuth Interface - fetch user's playlist data
     */
    router.get('/fetchPlaylists', function(req, res) {
        if(req.session.token_data) {
            var params = new URLSearchParams();
            params.set('limit', 50);

            var headers = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + req.session.token_data.access_token,
                },
            };

            axios.get('https://api.spotify.com/v1/me/playlists?' + params.toString(), headers)
                .then(response => {
                    // store playlist IDs in session
                    var playlists = [];
                    for (var key in response.data.items) {
                        if (response.data.items.hasOwnProperty(key)) {
                            playlists.push({
                                id: response.data.items[key].id, 
                                tracksAPI: response.data.items[key].tracks.href,
                                image: response.data.items[key].images[0],
                                link: response.data.items[key].external_urls.spotify,
                                tracks: [],
                            });
                        }
                    }
                    req.session.playlists = playlists;

                    res.redirect('/profile');
                })
                .catch(error => {
                    console.log(error);
                });
        }
        // otherwise initiate login & authorization
        else {
            res.redirect('/login');
        }
    });

    return router;
}();