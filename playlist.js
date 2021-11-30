module.exports = function(){
    var express = require('express');
    var router = express.Router();
    var axios = require('axios');
    var shared = require('./shared.js');

    /**
     * setPlayListInfo - set playlist info in context
     * @param context
     * @param req - request body with selected playlist index
     * @returns updates context
     */
    var setPlaylistInfo = function(context, req) {
        context.playlist_name = context.playlists[req.query.ind].name;
        context.playlist_image = context.playlists[req.query.ind].image;
        context.playlist_url = context.playlists[req.query.ind].link;
        context.playlist_id = context.playlists[req.query.ind].id;
    }

    /**
     * getTracks - get track info for given playlistID via Spotify API
     * @param req - request body for OAuth token stored in session
     * @returns response
     */
    const getTracks = async (req) => {
        try {
            var params = new URLSearchParams();
            params.set('offset', 0);

            var headers = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + req.session.token_data.access_token,
                },
            };
            var response = await axios.get('https://api.spotify.com/v1/playlists/' + req.query.playlistId + '/tracks?' + params.toString(), headers);

            return response;
        } catch (err) {
            console.error(err);
        }
    };

    /**
     * setTracks - update tracks array with received data from getTracks
     * @param tracks 
     * @param response 
     */
    const setTracks = function(tracks, response) {
        var trackCount = response.data.total;
        if(response.data.total > 50) {
            trackCount = 50;
        }

        for(let j = 0; j < trackCount; j++) {
            tracks.push(
                {
                    id: response.data.items[j].track.id,
                    name: response.data.items[j].track.name,
                    artist: response.data.items[j].track.artists[0].name,
                    link: response.data.items[j].track.external_urls.spotify,
                    image: response.data.items[j].track.album.images[0].url,

                    danceability: 0,
                    energy: 0,
                    loudness: 0,
                    speechiness: 0,
                    acousticness: 0,
                    instrumentalness: 0,
                    liveness: 0,
                    valence: 0,
                });
        };
    };

    /**
     * getTrackData - get audio features data for tracks received from getTracks
     * @param tracks 
     * @param response 
     */
    const getTrackData = async (req, tracks) => {
        try {
            var trackIds = '';
            tracks.forEach(function (track) {
                trackIds += track.id + ',';
            });

            trackIds = trackIds.slice(0, -1) // remove trailing comma

            var headers = {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + req.session.token_data.access_token,
                },
            };
            var response = await axios.get('https://api.spotify.com/v1/audio-features?ids=' + trackIds, headers);
            return response;
        } catch (err) {
            console.error(err);
        }
    };

    /**
     * setTrackData - update tracks array with data received from getTrackData
     * @param tracks 
     * @param response 
     */
    const setTrackData = function(tracks, response) {
        for(let j = 0; j < tracks.length; j++) {
            tracks[j].danceability = Math.round(response.data.audio_features[j].danceability*10000)/100;
            tracks[j].energy = Math.round(response.data.audio_features[j].energy*10000)/100;
            tracks[j].loudness = Math.round((response.data.audio_features[j].loudness/-60)*10000)/100;
            tracks[j].speechiness = Math.round(response.data.audio_features[j].speechiness*10000)/100;
            tracks[j].acousticness = Math.round(response.data.audio_features[j].acousticness*10000)/100;
            tracks[j].instrumentalness = Math.round(response.data.audio_features[j].instrumentalness*10000)/100;
            tracks[j].liveness = Math.round(response.data.audio_features[j].liveness*10000)/100;
            tracks[j].valence = Math.round(response.data.audio_features[j].valence*10000)/100;
        }

        req.session.playlists[req.query.ind].tracks = tracks;
    };

    /**
     * getTracksAverage - calculate average of audio features data in tracks array and store in session
     * @param tracks 
     * @param req - for updating session
     */
    const getTracksAverage = function(tracks, req) {
        var daAverage = 0;
        var enAverage = 0;
        var loAverage = 0;
        var spAverage = 0;
        var acAverage = 0;
        var inAverage = 0;
        var liAverage = 0;
        var vaAverage = 0;

        for(let j = 0; j < tracks.length; j++) {
            daAverage += tracks[j].danceability/tracks.length;
            enAverage += tracks[j].energy/tracks.length;
            loAverage += tracks[j].loudness/tracks.length;
            spAverage += tracks[j].speechiness/tracks.length;
            acAverage += tracks[j].acousticness/tracks.length;
            inAverage += tracks[j].instrumentalness/tracks.length;
            liAverage += tracks[j].liveness/tracks.length;
            vaAverage += tracks[j].valence/tracks.length;
        }

        var averages = {
            da: Math.round(daAverage),
            en: Math.round(enAverage),
            lo: Math.round(loAverage),
            sp: Math.round(spAverage),
            ac: Math.round(acAverage),
            in: Math.round(inAverage),
            li: Math.round(liAverage),
            va: Math.round(vaAverage),
        }

        req.session.playlists[req.query.ind].averages = averages;
    }

    /**
     * getRadarChart - retrieve radar chart with averaged data from tracks array
     * @param req - enable retrieving data from session
     * @returns URL to radar chart
     */
    const getRadarChart = async (req) => {
        try {
            var chartParams = new URLSearchParams();
            chartParams.set('cat1', req.session.playlists[req.query.ind].averages.ac);
            chartParams.set('cat2', req.session.playlists[req.query.ind].averages.da);
            chartParams.set('cat3', req.session.playlists[req.query.ind].averages.en);
            chartParams.set('cat4', req.session.playlists[req.query.ind].averages.in);
            chartParams.set('cat5', req.session.playlists[req.query.ind].averages.li);
            chartParams.set('cat6', req.session.playlists[req.query.ind].averages.lo);
            chartParams.set('cat7', req.session.playlists[req.query.ind].averages.sp);
            chartParams.set('cat8', req.session.playlists[req.query.ind].averages.va);
                
            var response = await axios.request({
                method: 'GET',
                url: 'https://radarchart-microservice-dennis.herokuapp.com/chart?' + chartParams.toString(),
                responseType: 'text'
                });

            return response;
        } catch (err) {
            console.error(err);
        }
    };

    /**
     * updateChartUrl - Take microservice chart URL and update for aesthetics
     * @param url 
     * @returns updatedUrl with modified bkg and dimensions
     */
     const updateChartUrl = function(url) {
        var updatedUrl = new URL(url);
        updatedUrl.searchParams.set('bkg', '#212529');
        updatedUrl.searchParams.set('h', '325');
        updatedUrl.searchParams.set('w', '325');

        return updatedUrl.toString();
    };

    /**
     * Playlist Page - retrieve playlist's track data and respective radar chart
     * 
     */
    router.get('/', function(req, res, next) {
        var context = {};
        shared.userNavBarContext(context, req);
        setPlaylistInfo(context, req);
        var token = req.session.token_data.access_token;

        // if data hasn't been retrieved yet, query Spotify API and store in session
        if(req.session.playlists[req.query.ind].tracks.length < 1) {
            var tracks = [];
            getTracks(req).then(response => {
                setTracks(tracks, response);
                getTrackData(req, tracks).then(response => {
                    setTrackData(tracks, response);
                    getTracksAverage(tracks, req);
                    getRadarChart(req).then(response => {
                        req.session.playlists[req.query.ind].chartUrl = updateChartUrl(response.data);
                        
                        context.chart_url = req.session.playlists[req.query.ind].chartUrl;
                        context.tracks = tracks;
                        context.averages = req.session.playlists[req.query.ind].averages;
                        context.active_playlist = true;
                        res.render('playlist', context);
                    })
                });
            });
        }
        // retrieve data stored from session if already retrieved
        else {
            context.chart_url = req.session.playlists[req.query.ind].chartUrl;
            context.tracks = req.session.playlists[req.query.ind].tracks;
            context.averages = req.session.playlists[req.query.ind].averages;
            context.active_playlist = true;
            res.render('playlist', context);
        }
    }); 

    return router;
}();