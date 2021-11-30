module.exports = function(){
    var express = require('express');
    var router = express.Router();
    var shared = require('./shared.js');

    /**
     * About Page
     */
    router.get('/', function(req, res, next) {
        var context = {};
        shared.userNavBarContext(context, req);

        context.active_about = true;
        res.render('about', context);
    }); 

    return router;
}();