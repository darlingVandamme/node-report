import Handlebars  from 'handlebars';
import fs from "fs/promises"
import path from "path"

// generator function??

const templates = {}

function hbs(options) {
    this.hbs = Handlebars.create()  // vreate separate instance
    this.reads = 0
    this.cacheReads = 0
    this.root = options.root
    this.ext = ".hbs"
    this.encoding = "utf8"
    this.rtOptions = {
        helpers : {},
        partials : {}
    }

    this.init = function(){
        if (this.initialized){
            return this.initialized
        } else {
            this.initialized = Promise.all([
                this.readPartials(path.resolve(path.join(this.root, "partials")))
            ])
            return this.initialized
        }
    }

    this.readPartials = function(dir){
        // multiple directories? recurse?
        return fs.readdir(dir)
            .then(files=>{
                files.forEach(file => {
                    let ext = path.extname(file)
                    let fileName = path.basename(file,ext)
                    let fullPath = path.join(dir,file)
                    if (ext == this.ext){
                        console.log(fileName)
                        fs.readFile(fullPath, this.encoding)
                            .then((data) => {
                                console.log("add partial "+fileName)
                                this.rtOptions.partials[fileName] = this.hbs.compile(data)
                                // this.rtOptions.partials[fileName] = data
                            })
                    }
                })
            })
    }

    this.getTemplate = async function (subDir, name) {
        await this.init()
        this.reads++
        let key = subDir+"/"+name
        if (templates[key]) {
            this.cacheReads++
            return templates[key]
        }
        let fileName = path.resolve(path.join(this.root, subDir, name + this.ext))
        console.log("try read "+fileName)
        let promise = fs.readFile(fileName, this.encoding)
            .then((data) => {
                //console.log("read from file")
//                 console.log("precompile "+Handlebars.precompile(template))
                console.log("rtOptions "+JSON.stringify(this.rtOptions))
                return this.hbs.compile(data) //, this.rtOptions)
            })
        templates[key] = promise
        return promise
    }

    this.render = function (subDir,name, data) {
        return this.getTemplate(subDir,name)
            .then((template) => {
                    console.log("found template " + template)
                    console.log("data " + JSON.stringify(data))
                    this.rtOptions.helpers["testHelp"] = function (object, propertyName, defaultValue, options) {
                        var result = options.lookupProperty(object, propertyName)
                        console.log("object "+JSON.stringify(object))
                        console.log("propertyname "+JSON.stringify(propertyName))
                        console.log("defaultValue "+JSON.stringify(defaultValue))
                        console.log("options "+JSON.stringify(options))
                        if (result != null) {
                            return result
                        }
                        return defaultValue
                    }
                    return template(data, this.rtOptions)
                }
            )
    }


/*
    renderReport(name, report){
        templ = getTemplate(reportTemplates)
        data = report.generalData  // some ds values as well???
        options={
            helpers: {
                dataset: renderDataset(name)
            }
        }
        templ(data,options)
    }

    renderDataset(name,report,dataset){
        templ = getTemplate(reportTemplates)
        data = {
            report : report.generalData  // some ds values as well???
            dataset : dataset.getResult("html")
        }
        options={
            helpers: {
                values: renderValue(name)
            }
        }

    }

// alternative
    renderDatasets to html with values as partials
    renderreport to html with dataset.html as data values
    renderlayout {{body}} or {{report}}
    // report as helper??
 */
}


function test(){
    const options = {root:"runtime/views"}
    const h = new hbs(options)
    const data = {rows:20}
    h.init().then(()=>{
    h.render("dataset","test",data)
        .then(result=>{
            console.log(result)
        })
    h.render("dataset","test",data)
        .then(result=>{
            console.log(result)
        })
    })
}

//setTimeout(test, 2000)
// test()

export {hbs}