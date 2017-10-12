var fs = require('fs'),
    fstream = require('fstream'),
    path = require('path'),
    unzip = require('unzipper'),
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

    var browserInstance = righto.from(puppeteer.launch, {args: ['--no-sandbox', '--disable-setuid-sandbox']}),
        page = browserInstance.get(instance => instance.newPage()),
        loaded = righto(openUrl, page, uri),
        pdfPath = righto(savePDF, page, documentPath, options, righto.after(loaded)),
        instanceClosed = righto(closeInstance, browserInstance, righto.after(pdfPath)),
        tempFilesRemoved = righto(rm, documentPath, righto.after(pdfPath)),
        result = righto.mate(pdfPath, righto.after(tempFilesRemoved, instanceClosed));

    result(callback);
}

function load(zipStream, options, callback){
    var id = uuid();
    var documentPath = path.join(options.tempPath, id);
    var filesWriting = 0;
    var closed = false;
    var hasErrored = false;

    function checkComplete(){
        if(!hasErrored && closed && !filesWriting){
            callback(null, documentPath);
        }
    }

    zipStream
        .pipe(unzip.Parse({ path: documentPath }))
        .on('entry', function(entry){
            if (entry.type == 'Directory'){
                return;
            }
            filesWriting++;
            entry.pipe(fstream.Writer({
              path: path.join(documentPath, entry.path)
            }))
            .on('error',function(error) {
                hasErrored = true;
                callback(new Error('Error writing file: ' + String(error)));
            })
            .on('close', function(){
                filesWriting--;
                checkComplete();
            });
        })
        .on('error', function(error){
            hasErrored = true;
            callback(new Error('Error extracting file: ' + String(error)));
        })
        .on('close', function(){
            closed = true;
            checkComplete();
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