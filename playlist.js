const { ENETUNREACH } = require('constants');
const { link } = require('fs');

module.exports = function(){
    var express = require('express');
    var router = express.Router();
    var axios = require('axios');

    // Render /profile on page visit
    router.get('/', function(req, res, next) {
        var context = {};
        // if user has logged in, then get user data from session
        if(req.session.profile) {
            context.user = req.session.profile.display_name;
            context.user_url = req.session.profile.external_urls.spotify;
            if(req.session.profile.images[0]) {
                context.user_image = req.session.profile.images[0].url;
            }
            else {
                context.user_image = '/public/img/nopic.png';
            }
            // if user has playlists, then get saved playlists from session
            if(req.session.playlists) {
                context.playlists = req.session.playlists;
                context.playlists_length = context.playlists.length;
                context.playlist_name = context.playlists[req.query.ind].name;
                context.playlist_image = context.playlists[req.query.ind].image;
                context.playlist_url = context.playlists[req.query.ind].link;
            }

            // if track data has not yet been saved for this playlistm, fetch it
            if(req.session.playlists[req.query.ind].tracks.length < 1) {
                var headers = {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + req.session.token_data.access_token,
                    },
                };
                var offset = 0;
                var params = new URLSearchParams();
                params.set('offset', offset);

                var tracks = [];
                // get first 50 tracks of each playlist
                axios.get('https://api.spotify.com/v1/playlists/' + req.query.playlistId + '/tracks?' + params.toString(), headers)
                    .then(response => {
                        // right now I only support up to 50 tracks, if more than 50 then ignore the rest
                        var trackCount = response.data.total;
                        if(response.data.total > 50) {
                            trackCount = 50;
                        }
                        
                        var ids = [];
                        var names = [];
                        var artists = [];
                        var links = [];
                        var images = [];
                        var requests = [];
                        // for each track, get audio features and save to playlists
                        for(let j = 0; j < trackCount; j++) {
                            ids.push(response.data.items[j].track.id);
                            names.push(response.data.items[j].track.name);
                            artists.push(response.data.items[j].track.artists[0].name);
                            links.push(response.data.items[j].track.external_urls.spotify);
                            images.push(response.data.items[j].track.album.images[0].url);

                            let newGet = axios.get('https://api.spotify.com/v1/audio-features/' + response.data.items[j].track.id, headers);
                            requests.push(newGet);
                        }

                        axios.all(requests)
                            .then(axios.spread((...responses) => {
                                for (let j = 0; j < responses.length; j++) {
                                    tracks.push({
                                        id: ids[j],
                                        name: names[j],
                                        artist: artists[j],
                                        link: links[j],
                                        image: images[j],
                                        danceability: responses[j].data.danceability,
                                        energy: responses[j].data.energy,
                                        loudness: responses[j].data.loudness,
                                        speechiness: responses[j].data.speechiness,
                                        acousticness: responses[j].data.acousticness,
                                        instrumentalness: responses[j].data.instrumentalness,
                                        liveness: responses[j].data.liveness,
                                        valence: responses[j].data.valence,
                                    });
                                }

                                context.tracks = tracks;
                                req.session.playlists[req.query.ind].tracks = tracks;
                                // pass user and playlist to page
                                context.active_playlist = true;
                                res.render('playlist', context);
                            }))
                            .catch(error => {
                                console.log(error);
                            })
                    })
                    .catch(error => {
                        console.log(error);
                    });
            }
            else {
                context.tracks = req.session.playlists[req.query.ind].tracks;
                // pass user and playlist to page
                context.active_playlist = true;
                res.render('playlist', context);
            }
        }
        // if user has not logged in, redirect to home page
        else {
            res.redirect('/home');
        }
    }); 

    return router;
}();