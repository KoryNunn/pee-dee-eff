var fs = require('fs'),
    path = require('path'),
    unzip = require('unzip2'),
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

function savePDF(phantomInstance, page, documentPath, callback){
    var filename = documentPath + '.pdf';
    var rendered = righto.from(page.render(filename));

    rendered(function(error){
        callback(null, filename);
        phantomInstance.exit();
        rm(documentPath, function(){});
    });
}

function getShallowestHTMLUri(shallowestHTMLFilePath, callback){
    if(!shallowestHTMLFilePath){
        return callback('No html file found');
    }

    callback(null, 'file://' + shallowestHTMLFilePath);
}

function render(documentPath, options, callback){
    var shallowestHTMLFile = righto(findShallowestFile, documentPath, /.*\.html/, {maxDepth: 4}),
        uri = righto(getShallowestHTMLUri, shallowestHTMLFile);

    var phantomInstance = righto.from(phantom.create),
        page = phantomInstance.get(instance => instance.createPage()),
        setSettings = page.get(page => righto.from(page.property('paperSize', options.page))),
        status = righto(openUrl, page, uri, righto.after(setSettings)),
        loaded = righto(getStatus, phantomInstance, status, options),
        result = righto(savePDF, phantomInstance, page, documentPath, righto.after(loaded));

    result(callback);
}

function load(zipStream, options, callback){
    var id = uuid(),
        documentPath = path.join(options.tempPath, id);

    zipStream
        .pipe(unzip.Extract({ path: documentPath }))
        .on('error', function(error){
            callback(new Error('Error extracting file'));
        })
        .on('close', function(){
            callback(null, documentPath);
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