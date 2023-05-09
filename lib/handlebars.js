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
let templateTimes = {}

const helpers = {}
const partials = {}
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
    this.loadTime = 0

    this.getInstance = function(){
        return hbsInstance
    }

    this.reload = function(){
        //delete cache
        // templates = {}
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
            ]).then(()=>{
                this.loadTime = Date.now()
            })
            return this.initialized
        }
    }

    // check reload changed files?
    this.readPartials = async function (dir, storage) {
        // multiple directories? recurse?
        let files = await fs.readdir(dir)
        for (const file of files) {
            let ext = path.extname(file)
            let fileName = path.basename(file, ext)
            let fullPath = path.join(dir, file)
            if (ext == this.ext) {
            let stat = await fs.stat(fullPath)
            // console.log("load "+fileName + " "+stat.mtimeMs+" "+this.loadTime +" "+(stat.mtimeMs >  this.loadTime))
            if (stat.mtimeMs >  this.loadTime) {
                let data = await fs.readFile(fullPath, this.encoding)
                // console.log("add partial " + fileName)
                storage[fileName] = hbsInstance.compile(data)
                }
            }

        }
    }

    this.getTemplate = async function (subDir, name) {
        await this.init()
        this.reads++
        let key = subDir+"/"+name
        let fileName = path.resolve(path.join(this.root, subDir, name + this.ext))
        // if reloadChanged
        let stat = await(fileName)

        if (templates[key]) {
            if (stat.mtimeMS <= templateTimes[key]) {
                this.cacheReads++
                return templates[key]
            }
        }

        // console.log("try read "+fileName)
        // check if file exists
        let promise = fs.readFile(fileName, this.encoding)
            .then((content) => {
                return hbsInstance.compile(content)
            })
        templateTimes[key]=stat.mtimeMS
        templates[key] = promise
        return promise
    }

    this.renderFile = function (subDir, name, data, report) {
        return this.getTemplate(subDir,name)
            .then((template) => {
                    return this.renderTemplate(template,data,report)
                }
            )
    }

    this.renderTemplate = function(template,data,report){
        // console.log("found template " + template)
        //// console.log("data " + JSON.stringify(data))
        if (typeof template =="string"){
            template = hbsInstance.compile(template)
        }
        let rtOptions = {
            helpers : {...helpers},
            partials : {...partials}
        }

        if (report) {// }  add report specific helpers
            rtOptions.helpers["classColumn"] = classColumn(report, rtOptions)
            rtOptions.helpers["link"] = link(report, rtOptions)

            rtOptions.helpers["formElement"] = formElement(report, rtOptions)
            rtOptions.helpers["element"] = element(report, rtOptions)
            rtOptions.helpers["jsData"] = jsData(report, rtOptions)
            rtOptions.helpers["paging"] = paging(report, rtOptions)
            rtOptions.helpers["report"] = reportName(report, rtOptions)
            rtOptions.helpers["options"] = optionsHelper(report, rtOptions)
            rtOptions.helpers["position"] = datasetPositionHelper(report, rtOptions)
            rtOptions.helpers["dataset"] = datasetHelper(report, rtOptions)
            rtOptions.helpers["include"] = includeHelper(report, rtOptions)
            rtOptions.helpers["datasetID"] = datasetID(report, rtOptions)
        }
        //console.log("helpers "+Object.keys(rtOptions.helpers))
        return template(data, rtOptions)
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
        // console.log("link helper "+JSON.stringify(context))
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
                // console.log("link helper "+JSON.stringify(report.output))
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
        // console.log("Element helper "+JSON.stringify(col))
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
         console.log("FormElement context "+JSON.stringify(context) )
         console.log("dataset "+JSON.stringify(dataset) )
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
        // console.log(" report handler " + report.name)
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
            // console.log(" jsData " + dataset)
            let result = report.getDataset(dataset).getResult({display:true})
            // console.log(" jsData " + objectJSON(result))
            return objectJSON(result)
        }
    }
}

function datasetHelper(report,rtOptions){
    // returns dataset data as javascript object.
    return function(name, reportResult,options) {
        // console.log(" dataset helper " + name)
        let result = reportResult.data[name].html
        // console.log(" jsData " + objectJSON(result))
        return result
    }
}

function datasetPositionHelper(report,rtOptions){
    // returns dataset data as javascript object.
    return function( name, reportResult , options) {
        let result = ""
        let partial = "serverDS"
        // only in sql
        Object.keys(reportResult.data).forEach((dsName)=>{
            let dataset = reportResult.data[dsName]
            // console.log(" dataset Position check " + name +"found "+dataset.name)
            if (name == dataset.options.position){
                // console.log(" dataset Position " + name +"found "+dataset.name)
                if (!dataset.html){
                    // console.log(" dataset Position include " +dataset.name)
                    // data values to load the original
                    result += "<div id='placeholder_"+dataset.name+"'> "+dataset.name+"</div>"
                    // dataset.options.recurse=true

                    dataset.options.position = "hidden"
                    dataset.position.hidden = true
                    //reportResult.data[name].recurse = true
                } else {
                    /*if (rtOptions.partials[partial]) {
                        result += rtOptions.partials[partial](dataset)
                    } else {*/
                    result += dataset.html
                }
            }
        })
        // console.log(" jsData " + objectJSON(result))
        return new hbsInstance.SafeString(result)
    }
}


function datasetID(report,rtOptions) {
    return function (datasetName) {
        let ds = report.getDataset(datasetName)
        let style = "dataset "+ (ds.options.style || "")

        let result = ' id="dataset_'+datasetName+'" class="'+style+' dataset" data-src="'+ds.getLink+'"'
        return new hbsInstance.SafeString(result)
    }
}


function paging(report,rtOptions){
    // returns dataset data as javascript object.
    return function( dataset) {
        if (report) {
            let pagingData = report.getDataset("paging").getValue("data")
            // console.log(" paging "+JSON.stringify(pagingData))
            if (partials["paging"]) {
                return new hbsInstance.SafeString(partials["paging"](pagingData, rtOptions))
            }
        }
    }
}

function includeHelper(report,rtOptions) {
    return function (includeType, prefix, reportResult, options) {
        let content = options.fn(this)
//        console.log("include Helper1 "+JSON.stringify(reportResult))
//        console.log("include Helper "+JSON.stringify(options))

        switch(includeType){
            case "css": reportResult.include.css.push(content); break;
            case "script" : reportResult.include.scripts.push(content); break;
            case "javascript" : reportResult.include.javascript.push(content); break;
            default: console.log("include type not found "+includeType)
        }
//        console.log("include Helper 2"+JSON.stringify(reportResult.include))
        return ""
    }
}


function classColumn(report,rtOptions) {
    return function (lookup, value, options) {
        // console.log("lookup class "+JSON.stringify(lookup)+ " "+value)
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
                // console.log ("Dataset select "+lookup+" found "+ds.rows()+" "+result)
            } else {
                //console.log ("Dataset select "+lookup+" not found")
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