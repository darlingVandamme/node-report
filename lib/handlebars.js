import Handlebars  from 'handlebars';
import fs from "fs/promises"
import path from "path"
import {objectJSON} from "./utils.js";

// generator function??
/* info
https://htmljstemplates.com/nodejs/most-useful-express-handlebars-tricks?utm_content=cmp-true

 */

// todo
// includes
// custom folders
// recurse dirs
// default templates

// caches
let templates = {}
const partials = {}
const helpers = {}
const formElements = {}
const elements = {}
// elements? formElements?
// multiple contexts??
const hbsInstance = Handlebars.create()  // create separate instance per engine??

function hbs(options) {
    // this.hbs = Handlebars.create()  // create separate instance
    this.reads = 0
    this.cacheReads = 0
    this.root = options.root
    this.ext = ".hbs"
    this.encoding = "utf8"

    this.getInstance = function(){
        return hbsInstance
    }

    this.reload = function(){
        //delete cache
        templates = {}
        delete this.initialized
    }

    this.init = function(){
        // register helpers
        helpers.date = datehelper
        if (this.initialized){
            return this.initialized
        } else {
            this.initialized = Promise.all([
                this.readPartials(path.resolve(path.join(this.root, "partials")), partials),
                this.readPartials(path.resolve(path.join(this.root, "form")) , formElements),
                this.readPartials(path.resolve(path.join(this.root, "value")) , elements)
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
                        // console.log(fileName)
                        fs.readFile(fullPath, this.encoding)
                            .then((data) => {
                                // console.log("add partial "+fileName)
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
        // console.log("try read "+fileName)
        // check if file exists
        let promise = fs.readFile(fileName, this.encoding)
            .then((data) => {
                //// console.log("read from file")
//                 // console.log("precompile "+Handlebars.precompile(template))
                return hbsInstance.compile(data) //, this.rtOptions)
            })
        templates[key] = promise
        return promise
    }

    this.render = function (subDir,name, data, report) {
        return this.getTemplate(subDir,name)
            .then((template) => {
                    // console.log("found template " + template)
                    //// console.log("data " + JSON.stringify(data))
                    let rtOptions = {
                        helpers : {...helpers},
                        partials : {...partials}
                    }

                    rtOptions.helpers["classColumn"] = classColumn(report,rtOptions)
                    rtOptions.helpers["link"] = link(report,rtOptions)

                    rtOptions.helpers["formElement"] = formElement(report,rtOptions)
                    rtOptions.helpers["element"] = element(report,rtOptions)
                    rtOptions.helpers["jsData"] = jsData(report,rtOptions)
                    rtOptions.helpers["paging"] = paging(report,rtOptions)
                    rtOptions.helpers["report"] = reportName(report,rtOptions)
                    rtOptions.helpers["options"] = optionsHelper(report,rtOptions)
                    //console.log("helpers "+Object.keys(rtOptions.helpers))
                    return template(data, rtOptions)
                }
            )
    }

    this.formatter = function(template){
        // caching!!!
        let compiled = hbsInstance.compile(template,{})
        return compiled
    }
    this.format = function(template, data){
        // caching!!!
        let compiled = hbsInstance.compile(template,{})
        return compiled(data)
    }
}

function link(report,rtOptions){
    return function( context, linktype, options) {
        console.log("link helper "+JSON.stringify(context))
        let link = report.getLink()
        let s = () => {
            if (context.options?.relative){
                //console.log("link helper "+context.options.relative)
                return link.relative()
            } else {
                return link.relative()
            }
        }

        let result = s()
        switch (linktype){
            case "action" :{
                console.log("link helper "+JSON.stringify(report.output))
                if (report.output.extension) {
                    link.setExtension(report.output.extension)
                }
                // fill in form action (and target ...)
                result = 'action="'+link.relative()+'"'
                break
            }
            // form javascript loading

            // link to other reports, with other params
            default:
                result = s()
        }
        return new hbsInstance.SafeString(result)
    }
}


function element(report,rtOptions){
    return function( context, dataset, options) {
        let col = dataset.columns[context.column]
        console.log("Element helper "+JSON.stringify(col))
        context.columnOptions = col
        let template = col.template || "td"
        if (elements[template]) {
            return new hbsInstance.SafeString(elements[template](context, rtOptions))
        } else {
            // template not found
            return context.display
        }
    }
}

function formElement(report,rtOptions){
    return function( context, dataset, options) {
        // dynamic template idea https://stackoverflow.com/questions/13396543/how-do-i-load-different-partials-dynamically-using-handlebars-templates
        // console.log("FormElement "+Object.keys(options) )
        // console.log("context "+JSON.stringify(context) )
        // console.log("dataset "+JSON.stringify(dataset) )
        /*
        FormElement lookupProperty,name,hash,data,loc
        context {"column":"id","value":"23","display":"23"}
        dataset {"name":"query","moment":"2023-04-27T14:51:27.315Z","timestamp":1682607087315,"show":["id","paging.limit"],"columns":{"id":{"order":100,"header":"id","name":"id"},"paging.limit":{"order":110,"header":"paging.limit","name":"paging.limit"}},"position":{"nav":true},"url":"http://localhost:3000/report/stackUser.html?id=23&paging.limit=5&report.dataset=query","options":{"name":"query","type":"form","position":"nav","show":"*"},"data":[{"id":"23","paging.limit":"5"}],"displayData":[{"rowNr":0,"data":{"id":{"column":"id","value":"23","display":"23"},"paging.limit":{"column":"paging.limit","value":"5","display":"5"}}}],"rows":1}
         */
        let col = dataset.columns[context.column]
        context.columnOptions = col
        let template = "text"
        if (col.template) {
            template = col.template
        } else {
            if (col.name.startsWith("paging.")) {
                template = "hidden"
            }
        }
        if (formElements[template]) {
            return new hbsInstance.SafeString(formElements[template](context, rtOptions))
        } else {
            // template not found
            return context.display
        }
    }
}

function reportName(report){
    return function( value, options) {
        console.log(" report handler " + report.name)
        if (report) {
            return report.name
        } else {
            return "no report specified"
        }
    }
}

function jsData(report,rtOptions){
    // returns dataset data as javascript object.
    return function( dataset) {
        if (report) {
            console.log(" jsData " + dataset)
            let result = report.getDataset(dataset).getResult({display:true})
            // console.log(" jsData " + objectJSON(result))
            return objectJSON(result)
        }
    }
}

function paging(report,rtOptions){
    // returns dataset data as javascript object.
    return function( dataset) {
        if (report) {
            let pagingData = report.getDataset("paging").getValue("data")
            console.log(" paging "+JSON.stringify(pagingData))
            if (partials["paging"]) {
                return new hbsInstance.SafeString(partials["paging"](pagingData, rtOptions))
            }
        }
    }
}


function classColumn(report,rtOptions) {
    return function (lookup, value, options) {
        console.log("lookup class "+JSON.stringify(lookup)+ " "+value)
        return lookup[value].value
    }
}
/*function styleColumn(report,rtOptions) {
    return function (lookup, value, options) {
        console.log("lookup style "+JSON.stringify(lookup)+ " "+value)
        return lookup[value].value
    }
}*/

function optionsHelper(report){
    return function (lookup, value, options) {
        // console.log("make options " + lookup+" "+value)
        if (report) {
            let result = ""
            let ds = report.getDataset(lookup)
            if (ds){
                ds.getRows().forEach(row =>{
                    result += "<option value='"+row.getValue("key")+"' "
                    if (row.getValue("key") == value){
                        result +=" selected "
                    }
                    result+= ">"+row.getValue("display")+"</option>"
                })
                console.log ("Dataset select "+lookup+" found "+ds.rows()+" "+result)
            } else {
                console.log ("Dataset select "+lookup+" not found")
            }
            return new hbsInstance.SafeString(result)
        } else {
            return "no report specified"
        }
    }
}

/* helper info
                        var result = options.lookupProperty(object, propertyName)
                        // console.log("object "+JSON.stringify(object))
                        // console.log("propertyname "+JSON.stringify(propertyName))
                        // console.log("defaultValue "+JSON.stringify(defaultValue))
                        // console.log("options "+JSON.stringify(options))

object {"rows":20}
propertyname "rows"
defaultValue "other"
options {"name":"testHelp","hash":{},"data":{"root":{"rows":20}},"loc":{"start":{"line":3,"column":14},"end":{"line":3,"column":46}}}


 */


/*function test(){
    const options = {root:"runtime/views"}
    const h = new hbs(options)
    const data = {rows:20}
    h.init().then(()=>{
    h.render("dataset","test",data)
        .then(result=>{
            // console.log(result)
        })
    h.render("dataset","test",data)
        .then(result=>{
            // console.log(result)
        })
    })
}*/

//setTimeout(test, 2000)
// test()

function datehelper(value,options){
    const dateOptions = {  year: 'numeric', month: "2-digit", day: "2-digit", hour: "2-digit", minute:"2-digit",second:"2-digit"};
    if (value?.toLocaleString) {
        return value.toLocaleString('en-SE', dateOptions)
    } else {
        return value
    }
}


export {hbs}