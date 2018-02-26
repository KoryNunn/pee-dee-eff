# pee-dee-eff

Make a pdf from a .zip'd static site.

Handy for printing generated documents etc.

## Usage

```javascript
var render = require('pee-dee-eff');

var zipStream = fs.createReadStream('my/cool/static/site.zip');

render(zipStream, {
        tempPath: '/temp/or/whatevs',
        waitTime: 500, // default,
        page: { // puppeteer page.pdf options
            format: 'A4'
            ...
        }
    },
    function(error, resultPath){
        // error or a path to the result .pdf file
    }
);
```

## Custom executable path

```javascript

render(zipStream, {
        executablePath: '/path/to/Chrome',
        ignoreHTTPSErrors: (default false),
        ...
    },
    function(error, resultPath){
        // error or a path to the result .pdf file
    }
);
```