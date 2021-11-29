module.exports = function(){
    var express = require('express');
    var router = express.Router();
    var axios = require('axios');

    /**
     * Login Interface - Middleware for launching Spotify OAuth sequence
     */
    router.get('/', function(req, res, next) {
        res.redirect('/login/spotifyAuthLogin');
    }); 

    /**
     * Spotify OAuth Interface - initialize authorization request by sending user to Spotify's auth page
     * @params client ID, client URL - (stored in app object)
     * @returns redirect to /spotifyAuthCallback
     */
    router.get('/spotifyAuthLogin', function(req, res) {
        var params = new URLSearchParams();
        params.set('response_type', 'code');
        params.set('client_id', req.app.get('authClient').client_id);
        params.set('redirect_uri', req.app.get('authClient').client_url + '/login/spotifyAuthCallback');
        res.redirect('https://accounts.spotify.com/authorize?' + params.toString());
    });

    /**
     * Spotify OAuth Interface - obtain user's tokens from Spotify token API
     * @params req.query.code || req.query.error
     * @returns token as response & redirect to /fetchProfile
     */
    router.get('/spotifyAuthCallback', function(req, res) {
        // if user has accepted the request then autherization code should have been returned
        if (req.query.code) {
            var params = new URLSearchParams();
            params.set('code', req.query.code);
            params.set('redirect_uri', req.app.get('authClient').client_url + '/login/spotifyAuthCallback');
            params.set('grant_type', 'authorization_code');
            
            // set headers for requesting tokens per Spotify docs
            var headers = {
                headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(req.app.get('authClient').client_id + ':' + req.app.get('authClient').client_secret).toString('base64')
                },
            };
    
            // perform POST request to Spotify's token API and store in user's session
            axios.post('https://accounts.spotify.com/api/token', params.toString(), headers)
                .then(response => {
                    req.session.token_data = response.data;
                    res.redirect('/login/fetchProfile');
                })
                .catch(error => {
                    console.log(error);
                });
        }
        // if authentication sequence errors, log error if present and redirect user back to home to reinitiate login
        else {
            if (req.query.error) {
                console.log(req.query.error);
            }
            res.redirect('/home');
        }
    });

    /**
     * Spotify OAuth Interface - fetch user's profile data
     * @params session.token_data
     * @returns session.profile
     */
    router.get('/fetchProfile', function(req, res) {
        var headers = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Bearer ' + req.session.token_data.access_token,
            },
        };

        axios.get('https://api.spotify.com/v1/me', headers)
            .then(response => {
                req.session.profile = response.data;
                //console.log(req.session.profile);
                res.redirect('/login/fetchPlaylists');
            })
            .catch(error => {
                console.log(error);
            });
    });

    /**
     * Spotify OAuth Interface - fetch user's playlist data
     * @params session.token_data
     * @returns session.playlists
     */
    router.get('/fetchPlaylists', function(req, res) {
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
                            name: response.data.items[key].name, 
                            id: response.data.items[key].id, 
                            tracksAPI: response.data.items[key].tracks.href,
                            image: response.data.items[key].images[0].url,
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
    });

    return router;
}();