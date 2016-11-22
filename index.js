var fs = require('fs'),
    unzip = require('unzip'),
    uuid = require('uuid'),
    phantom = require('phantom'),
    righto = require('righto'),
    rm = require('rimraf'),
    findShallowestFile = require('find-shallow-file');

function openUrl(page, uri, callback){
    var opened = righto.from(page.open(uri));

    opened(callback);
}

function getStatus(phantomInstance, status, options, callback){
    if (status !== 'success') {
        phantomInstance.exit();
        callback('Failed to load page');
    } else {
        setTimeout(callback, 'waitTime' in options ? options.waitTime : 500);
    }
}

function savePDF(phantomInstance, page, path, callback){
    var filename = path + '.pdf';
    var rendered = righto.from(page.render(filename));

    rendered(function(error){
        callback(null, filename);
        phantomInstance.exit();
        rm(path, function(){});
    });
}

function getShallowestHTMLUri(shallowestHTMLFilePath, callback){
    if(!shallowestHTMLFilePath){
        return callback('No html file found');
    }

    callback(null, 'file://' + shallowestHTMLFilePath);
}

function render(path, options, callback){
    var shallowestHTMLFile = righto(findShallowestFile, path, /.*\.html/, {maxDepth: 4}),
        uri = righto(getShallowestHTMLUri, shallowestHTMLFile);

    var phantomInstance = righto.from(phantom.create),
        page = phantomInstance.get(instance => instance.createPage()),
        status = righto(openUrl, page, uri),
        loaded = righto(getStatus, phantomInstance, status, options),
        result = righto(savePDF, phantomInstance, page, path, righto.after(loaded));

    result(callback);
}

function load(zipStream, options, callback){
    var id = uuid(),
        path = options.tempPath + id;

    zipStream
        .pipe(unzip.Extract({ path: path }))
        .on('error', function(error){
            callback(new Error('Error extracting file'));
        })
        .on('close', function(){
            callback(null, path);
        });
}

module.exports = function(zipStream, options, callback){
    if(!options || ! options.tempPath){
        throw 'Invalid options. pee-dee-eff requires a temporary directory to store inflated data and result pdfs in';
    }

    var inflatedPath = righto(load, zipStream, options),
        rendered = righto(render, inflatedPath, options);

    rendered(callback);
};