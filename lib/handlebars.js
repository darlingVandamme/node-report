import Handlebars  from 'handlebars';
import fs from "fs/promises"
import path from "path"

// generator function??

/* info
https://htmljstemplates.com/nodejs/most-useful-express-handlebars-tricks?utm_content=cmp-true

 */

// todo
// includes
// custom folders
// recurse dirs
// default templates

let templates = {}
const partials = {}
const helpers = {}
const formElements = {}
// elements? formElements?
// multiple contexts??
const hbsInstance = Handlebars.create()  // create separate instance

function hbs(options) {
    // this.hbs = Handlebars.create()  // create separate instance
    this.reads = 0
    this.cacheReads = 0
    this.root = options.root
    this.ext = ".hbs"
    this.encoding = "utf8"

    this.reload = function(){
        //delete cache
        templates = {}
        delete this.initialized
    }

    this.init = function(){
        // register helpers
        hbsInstance.registerHelper("date",datehelper)
        if (this.initialized){
            return this.initialized
        } else {
            this.initialized = Promise.all([
                this.readPartials(path.resolve(path.join(this.root, "partials")), partials),
                this.readPartials(path.resolve(path.join(this.root, "form")) , formElements)
            ])
            return this.initialized
        }
    }

    this.readPartials = function(dir, storage){
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
                                storage[fileName] = hbsInstance.compile(data)
                                // partials[fileName] = data
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
        // check if file exists
        let promise = fs.readFile(fileName, this.encoding)
            .then((data) => {
                //console.log("read from file")
//                 console.log("precompile "+Handlebars.precompile(template))
                return hbsInstance.compile(data) //, this.rtOptions)
            })
        templates[key] = promise
        return promise
    }

    this.render = function (subDir,name, data) {
        // todo report dependent helpers
        return this.getTemplate(subDir,name)
            .then((template) => {
                    console.log("found template " + template)
                    //console.log("data " + JSON.stringify(data))
                    let rtOptions = {
                        helpers : helpers,
                        partials : partials
                    }
                    rtOptions.helpers["formElement"] = formElement
                    rtOptions.helpers["element"] = element
                    rtOptions.helpers["testHelp"] = function (object, propertyName, defaultValue, options) {
                        var result = options.lookupProperty(object, propertyName)
                        if (result != null) {
                            return result
                        }
                        return defaultValue
                    }
                    return template(data, rtOptions)
                }
            )
    }
}

function element(object, propertyName, defaultValue, options) {

}

function formElement( context, dataset, options) {
    // dynamic template idea https://stackoverflow.com/questions/13396543/how-do-i-load-different-partials-dynamically-using-handlebars-templates
    console.log("FormElement "+Object.keys(options) )
    console.log("context "+JSON.stringify(context) )
    console.log("dataset "+JSON.stringify(dataset) )
    /*
    FormElement lookupProperty,name,hash,data,loc
    context {"column":"id","value":"23","display":"23"}
    dataset {"name":"query","moment":"2023-04-27T14:51:27.315Z","timestamp":1682607087315,"show":["id","paging.limit"],"columns":{"id":{"order":100,"header":"id","name":"id"},"paging.limit":{"order":110,"header":"paging.limit","name":"paging.limit"}},"position":{"nav":true},"url":"http://localhost:3000/report/stackUser.html?id=23&paging.limit=5&report.dataset=query","options":{"name":"query","type":"form","position":"nav","show":"*"},"data":[{"id":"23","paging.limit":"5"}],"displayData":[{"rowNr":0,"data":{"id":{"column":"id","value":"23","display":"23"},"paging.limit":{"column":"paging.limit","value":"5","display":"5"}}}],"rows":1}
     */
    let col = dataset.columns[context.column]
    context.columnOptions = col
    let template = "text"
    if (col.template){
        template = col.template
    } else {
        if (col.name.startsWith("paging.")){
            template = "hidden"
        }
    }
    if (formElements[template]){
        return new hbsInstance.SafeString(formElements[template](context))
    } else {
        // template not found
        return context.display
    }
}


/* helper info
                        var result = options.lookupProperty(object, propertyName)
                        console.log("object "+JSON.stringify(object))
                        console.log("propertyname "+JSON.stringify(propertyName))
                        console.log("defaultValue "+JSON.stringify(defaultValue))
                        console.log("options "+JSON.stringify(options))

object {"rows":20}
propertyname "rows"
defaultValue "other"
options {"name":"testHelp","hash":{},"data":{"root":{"rows":20}},"loc":{"start":{"line":3,"column":14},"end":{"line":3,"column":46}}}


 */


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

function datehelper(value){
    //console.log("datehelper "+value)
    const dateOptions = {  year: 'numeric', month: "2-digit", day: "2-digit", hour: "2-digit", minute:"2-digit",second:"2-digit"};
    if (value?.toLocaleString) {
        return value.toLocaleString('en-SE', dateOptions)
    } else {
        return value
    }
}

export {hbs}