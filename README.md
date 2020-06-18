# Sketch to SVG

Exports layers from a .sketch file to an svg, without needing Sketch installed.

## Usage as a command

### Installation

Install globally  `npm i sketch-to-svg -g` 

Or install locally `npm i sketch-to-svg` (or checkout this repo) and then `npm link` (to enable the `sketch-to-svg` command in the terminal)

### Examples

* Export all layers on all pages from my-design.sketch into the current folder:
    * `sketch-to-svg ./my-design.sketch` 
* Export all layers on all pages from my-design.sketch into the output folder:
    * `sketch-to-svg ./my-design.sketch ./output/`
* Export all layers from 'Page 1' and 'Page 2' from my-design.sketch into the current folder:
    * `sketch-to-svg -p 'Page 1' -p 'Page 2' ./my-design.sketch`

### Documentation

Just running `sketch-to-svg` will output the help:
```
sketch-to-svg <sketch> [output]

export svg from sketch

Positionals:
  sketch  path to the sketch file                                       [string]
  output  output folder - defaults to the current folder                [string]

Options:
  --version    Show version number                                     [boolean]
  --help       Show help                                               [boolean]
  --pages, -p  pages to export (default is all pages)
```

## Usage as a library

```javascript
/// At the moment you need to pass in a sketch-constructor layer.
const { Sketch } = require('sketch-constructor')

/// Require the library
const svg = require('sketch-to-svg')

// Open the sketch file and pass in the layer you want to extract
let absolutePath = `${process.cwd()}` + "/mysketchfile.sketch"
Sketch
        .fromFile(absolutePath)
        .then(sketch => {
          /// Get the layer you want to extract - this example extracts the first layer in the first page
          let layer = sketch.getPages()[0].layers[0]

          let options = { sketchFilePath: absolutePath, optimizeImageSize: true, optimizeImageSizeFactor: 3 }

          return svg.createFromLayer(layer, options)
        })
        .then(icon => {
          // For this example, we just dump the svg to the console
          console.log(icon.svg)
        })
        .catch(err => {
            console.log("Failed to create svg:", err)
        })
```

You can see this example in action by checking out the repo and running `node example.js`.

## Development

This is written in Typescript, there's an npm script (`build`) which will build the library into the dist folder, and a script (`npm start`) which will 
run through a few test/example sketch files, exporting them into /out.

If things are going _really_ badly, you can run `npm run clobber` to start from the start again. This will remove all built code, and all node modules. You'll then have to run `npm install` again :)
