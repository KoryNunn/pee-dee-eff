var render = require('../');
var test = require('tape');
var fs = require('fs');
var rm = require('rimraf');
var testSite1Path = __dirname + '/testData/testSite1.zip';
var exec = require('child_process').exec;

var tempPath = __dirname + '/temp/';

var options = {
        ignoreHTTPSErrors: true,
        waitTime: 100,
        tempPath,
        page:{
            format: 'A4',
            orientation: 'portrait'
        }
    };

test('render valid zip', function(t){
    t.plan(1);

    render(fs.createReadStream(testSite1Path), options, function(error, resultPath){
        if(error){
            console.log(error);
            return;
        }
        exec('google-chrome "' + resultPath + '"');

        t.pass();

        setTimeout(function(){
            rm(resultPath, function(){});
        }, 3000);
    });

});

test('render invalid zip', function(t){

    t.plan(1);

    render(fs.createReadStream(__dirname + '/index.js'), options, function(error, resultPath){
        t.ok(error);
    });

});