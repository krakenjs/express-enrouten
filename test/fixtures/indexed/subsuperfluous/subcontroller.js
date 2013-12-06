'use strict';


// This conforms to the old API ONLY to ensure it doesn't get loaded in the `index` case.
module.exports = function (req, res) {
    res.send('ok');
};