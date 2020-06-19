#!/usr/bin/env node
const { Sketch } = require('sketch-constructor')
const svg = require('../dist/index.js')
const yargs = require('yargs')
const fs = require('fs')
const path = require('path')
const { exit } = require('process')

const argv = yargs
  .command('$0 <sketch> [output]', 'export svg from sketch', (yargs) => {
  yargs.positional('sketch', {
    describe: 'path to the sketch file',
    type: 'string',
  }).positional('output', {
    describe: 'output folder - defaults to the current folder',
    type: 'string',
    default: './svg-output/'
  }).option("pages", {
    alias: 'p',
    describe: 'pages to export (default is all pages)'
  })
  })
  .help()
  .argv

const sketchFile = path.resolve(argv.sketch)
const isValidSketchFile = (file) => {
  const extenstion = ".sketch"
  if (file.substring(sketchFile.length-extenstion.length) == extenstion) {
    const stat = fs.statSync(file)
    return stat.isFile
  }
  return false
}
const pagesToProcess = (sketch, pages) => {
  const validNames = sketch.pages.flatMap(page => page.name)
  if (pages){
  const pagesArr = function(){
    if (Array.isArray(pages)) return pages
    return [pages]
  }()
  return { 
      pages: pagesArr.filter(pageName => validNames.indexOf(pageName) > -1),
      supplied: pagesArr 
      }
  } else {
  // @TODO get all of the pages and return them here
  return {pages: validNames, supplied: []}
  }
}
// make sure it's actually a sketch file, otherwise report error and return help
if (!isValidSketchFile(sketchFile)) {
  console.error(`🚨Error: not a valid sketch file '${sketchFile}'\n\n`)
  yargs.showHelp()
  exit(410)
}

Sketch
  .fromFile(sketchFile)
  .then(sketch => {
    let pages = pagesToProcess(sketch, argv.pages)
    // handle supplied pages not being 
    if (pages.pages.length == 0) {
      const availableNames = sketch.pages.map(page => page.name).join("', '")
      const suppliedNames = pages.supplied.join("', '")
      console.error(`Couldn't find any requested pages - you asked for '${suppliedNames}' and the document contains '${availableNames}'.`)
      yargs.showHelp()
      exit(404)
    } else if (pages.pages.length < pages.supplied.length) {
      const availableNames = sketch.pages.map(page => page.name).join("', '")
      const processedNames = pages.pages.join("', '")
      const missingNames = pages.supplied.filter(name => pages.pages.indexOf(name) == -1)
      console.warn(`Warning: pages called '${missingNames}' were not found, so only processing '${processedNames}'. The document contains '${availableNames}'.`)
    }

    console.log(`processing ${sketchFile}`)
    let layers = sketch.pages
      .filter(page => pages.pages.indexOf(page.name) > -1)
      .flatMap(page => { return page.getLayers() })

    return layers
  })
  .then(layers => {
    console.log(`processing ${layers.length} layers`)
    const output = argv.output
    let options = { sketchFilePath: sketchFile, optimizeImageSize: true, optimizeImageSizeFactor: 1 }

    layers.forEach(layer => {

      svg.createFromLayer(layer, options)
        .then(icon => {

          console.log(`---------- Completed ${layer.name}`)

          if (0) {
            if (icon.images.length > 0) {
              console.log(`and ${icon.images.length} assets: ${icon.images.map(asset => { return asset.path; })}`)
            }
            console.log("----------\n")
          }

          // For each layer, create the folder and then write the svg out to a file
          let filename = `${output}/${layer.name}.svg`

          // For each path component
          let folder = filename.split('/').slice(0, -1).join('/')
          fs.mkdirSync(folder, { recursive: true })

          fs.writeFile(filename, icon.svg, err => {
            if (err) {
              console.log(`Error saving ${filename}: ${err}`)
            }
          })

          // And store the assets
          icon.images.forEach(image => {
            let imagePath = folder + "/" + image.path
            let imageFolder = imagePath.split('/').slice(0, -1).join('/')
            fs.mkdirSync(imageFolder, { recursive: true })

            fs.writeFile(imagePath, image.contents, err => {
              if (err) {
                console.log(`Error saving image ${image.path}: ${err}`)
              }
            })
          })
        }).catch((err) => {
          console.log(err)
        })
    })
  })
  .catch(error => {
    console.error("Sorry, an error occurred", error)
    exit(500)
  })
