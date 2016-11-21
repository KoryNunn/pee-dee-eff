var render = require('../'),
    fs = require('fs'),
    rm = require('rimraf'),
    testSite1Path = __dirname + '/testData/testSite1.zip',
    exec = require('child_process').exec;

var tempPath = __dirname + '/temp/';

var options = {
        waitTime: 100,
        tempPath
    };

render(fs.createReadStream(testSite1Path), options, function(error, resultPath){
    exec('google-chrome "' + resultPath + '"');

    setTimeout(function(){
        rm(resultPath, function(){});
    }, 500);
});