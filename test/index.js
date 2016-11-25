var render = require('../'),
    fs = require('fs'),
    rm = require('rimraf'),
    testSite1Path = __dirname + '/testData/testSite1.zip',
    exec = require('child_process').exec;

var tempPath = __dirname + '/temp/';

var options = {
        waitTime: 100,
        tempPath,
        page:{
            format: 'A4',
            orientation: 'portrait'
        }
    };

render(fs.createReadStream(testSite1Path), options, function(error, resultPath){
    if(error){
        console.log(error);
        return;
    }
    exec('google-chrome "' + resultPath + '"');

    setTimeout(function(){
        rm(resultPath, function(){});
    }, 3000);
});