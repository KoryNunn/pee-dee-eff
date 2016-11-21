# pee-dee-eff

Make a pdf from a .zip'd static site.

Handy for printing generated documents etc.

## Usage

```

var zipStream = fs.createReadStream('my/cool/static/site.zip');

render(zipStream, {
        tempPath: '/temp/or/whatevs'
    },
    function(error, resultPath){
        // error or a path to the result .pdf
    }
);
```