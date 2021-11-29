exports.userNavBarContext = function(context, req){
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
}