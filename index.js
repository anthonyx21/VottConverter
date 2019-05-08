var walk    = require('walk');
var path = require('path')
var fs = require('fs');
var shortid = require('shortid');
var files   = [];
let frames = {};
let visitedFrames = []
let tagsSet = new Set()

let readPath = process.argv[2]
var walker  = walk.walk(readPath, { followLinks: false });

var i = 0
walker.on('file', function(root, stat, next) {

    let filename = root + '/' + stat.name
    if(path.extname(filename) === '.json'){
        var contents = fs.readFileSync(filename, 'utf8');
        try{
            let contentsObj = JSON.parse(contents)
            let frameName = decodeURIComponent(contentsObj.asset.name)
            let frameContents = []
            let nameCounter = 1
            for(let region of contentsObj.regions){
                let points = region.points
                let x1 = points[0].x
                let x2 = points[2].x
                let y1 = points[0].y
                let y2 = points[2].y
                frameContents.push({
                    "x1": x1,
                    "x2": x2,
                    "y1": y1,
                    "y2": y2,
                    "width": region.boundingBox.width,
                    "height": region.boundingBox.height,
                    "box": {
                        "x1": x1,
                        "x2": x2,
                        "y1": y1,
                        "y2": y2,
                    },
                    "points": [
                      { "x": x1, "y": y1 },
                      { "x": x2, "y": y1 },
                      { "x": x2, "y": y2 },
                      { "x": x1, "y": y2 }
                    ],
                    "UID": shortid.generate(),
                    "id": i,
                    "type": "rect",
                    "tags": region.tags,
                    "name": nameCounter++
                })
                i++
                tagsSet.add(region.tags[0])
            }

            visitedFrames.push(frameName)
            frames[frameName] = frameContents
        }
        catch(error){
            console.log(error, filename)
        }
    }
    next();
});


walker.on('end', function() {
    let obj = {
        frames,
        "framerate": "1",
        "inputTags": Array.from(tagsSet).join(','),
        "suggestiontype": "track",
        "scd": false,
        visitedFrames
    }
    console.log(JSON.stringify(obj))
});