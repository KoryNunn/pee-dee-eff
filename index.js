var fs = require('fs'),
    path = require('path'),
    unzip = require('unzip2'),
    uuid = require('uuid'),
    puppeteer = require('puppeteer'),
    righto = require('righto'),
    rm = require('rimraf'),
    findShallowestFile = require('find-shallow-file');

function openUrl(page, uri, callback){
    var opened = righto.from(page.goto(uri, { waitUntil: 'networkidle' }));

    opened(callback);
}

function savePDF(page, documentPath, options, callback){
    var pageOptions = options.page || { format: 'A4' };
    var filename = documentPath + '.pdf';

    pageOptions.path = filename;
    
    var emulationSet = righto.from(page.emulateMedia('print'));
    var rendered = righto.from(page.pdf(pageOptions));

    var result = righto.mate(filename, righto.after(rendered));

    result(callback);
}

function getShallowestHTMLUri(shallowestHTMLFilePath, callback){
    if(!shallowestHTMLFilePath){
        return callback('No html file found');
    }

    callback(null, 'file://' + shallowestHTMLFilePath);
}

function closeInstance(browserInstance, callback){
    var closed = righto.from(browserInstance.close());

    closed(callback);
}

function render(documentPath, options, callback){
    var shallowestHTMLFile = righto(findShallowestFile, documentPath, /.*\.html/, {maxDepth: 4}),
        uri = righto(getShallowestHTMLUri, shallowestHTMLFile);

    var browserInstance = righto.from(puppeteer.launch),
        page = browserInstance.get(instance => instance.newPage()),
        loaded = righto(openUrl, page, uri),
        pdfPath = righto(savePDF, page, documentPath, options, righto.after(loaded)),
        instanceClosed = righto(closeInstance, browserInstance, righto.after(pdfPath)),
        tempFilesRemoved = righto(rm, documentPath, righto.after(pdfPath)),
        result = righto.mate(pdfPath, righto.after(tempFilesRemoved, instanceClosed));

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