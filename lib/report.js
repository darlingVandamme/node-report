import {Dataset} from "./dataset.js"
import {Link} from "./link.js"
// getValue(datasetname,key,(rowNr))

function Report(name,reportDef,engine){
    this.name = name
    this.timestamp = Date.now()
    this.def=reportDef
    this.engine = engine
    this.datasets = {}
    this.sources = {}  // needed?
    this.loadList = []
    this.outputName = "main" // main, args, error, log, debug, alt?
    this.output = {}
    this.req = {}

    this.init = function(outputName,options){
        // check report def?
        // lookup channels / connections
        //
        //console.log("name "+this.def.name)
        // todo add default datasets (log, error, msgs ...)
        this.def?.datasets.forEach(dsDef =>{
            let name = dsDef.name
            this.debug("found dataset ",name)
            this.addDataset(name,dsDef)
        })

        this.outputName = outputName
        this.output = this.def.output[outputName]
        // find needed connections / dependencies
        // set up general datasets (from conf file
        // this.require("log")
        // this.require("error")
        // this.require("msgs")
        this.debug("select output",outputName)
        // override default include through options
        if (options.include){ // array?
            this.debug("override include",options.include)
            this.output.include = options.include
        }
        if (options.dataset){
            this.debug("override dataset",options.dataset)
            if (Array.isArray(this.output.dataset)){
                this.output.include = [...options.dataset]
            } else {
                this.output.include = [options.dataset]
            }
            // change template?
            // this.debug("change template ",this.output.template)
            // todo configure
            this.output.template = "div"
            // todo no hbs layout!

        }

        this.require(this.output.include)

        return Promise.all(this.loadList.map((name,index) => {
            return this.datasets[name].done
        }))
    }

    this.getLink = function(options){
        // console.log("URL :" +this.url)
        return new Link(this.req.url, this.req.base, options)
    }

    this.require = function(source){
        //console.log(typeof source)
        if (Array.isArray(source )){
            source.forEach(s=>{
                this.require(s)
            })
        } else {
            // check comma separated
            //console.log("search source " + source)
            let ds = this.datasets[source]
            // check if not exists => error
            if (!ds){
                // autocreate?
                // console.log(" require new "+source)
                ds = this.addDataset(source)
            }
            if (!ds.required) { // if not already required
                ds.required = true
                this.loadList.push(source)

                let channel = this.engine.getChannel(ds.options.source)
                // console.log("search source type "+ds.options.source)
                // console.log("sources "+JSON.stringify(this.engine.channels))

                if (channel){
                    // console.log("found source type "+ds.options.source + " ")
                    channel.connect(ds)
                    ds.channel = channel
                    this.debug("init dataset channel ",source)
                    ds.done = ds.init(ds,channel, ds.options)
                }
                // check ds columns for dependencies
                Object.values(ds.columns).forEach((col) =>{ if (col.init){ col.init(ds, this) }}) // col.init(ds, report/this)
            }
        }
    }

    this.load = function(){
        // console.log("load datasets "+JSON.stringify(this.loadList))
        let p = []
        this.debug("loadList ",this.loadList)

        this.loadList.forEach(name => {
            let ds = this.getDataset(name)
            ds.startLoad = Date.now()
            let deps = []
            //console.log("Dependency check "+ds.name+" "+ds.dependencies)
            // todo check circular dependencies??
            ds.dependencies.forEach(depName =>{
                //console.log("Dependency "+ds.name+" waiting on "+depName)
                let depDS = this.getDataset(depName)
                if (depDS.done){
                    deps.push(depDS.done)
                }
            })
            p.push(Promise.all(deps).then((deps)=>{
                console.log("Start load "+ds.name+" "+deps.length)
                ds.done = ds.load(ds, ds.channel, ds.options)
                if (ds.done){
                    return ds.done.then(()=> {
                        ds.loadTime = Date.now()-ds.startLoad
                            //console.log("loadTime "+ds.name+" "+ds.loadTime)
                    })
                }
                //p.push( ds.done)
            }))
        })
        // check if isPromise
        return Promise.all(p)

        // wait for all dependencies to have loaded:
        // return Promise.all(this.dependencies.map((name,index) => {
        //                      return this.datasets[name].done
        //                 }))
        // return Promise.all(this.loadList.map((name,index) => {
        //             return this.datasets[name].done
        //         }))
    }

    this.result = function(){
        const result = {
            name:this.name,
            timestamp:this.timestamp,
            moment:new Date(),
            req:this.req,
            data:[]
        }
        this.output.include.forEach(dsName=> {
            result.data.push(this.getDataset(dsName).getData())
        })
        result.profile=Date.now()-this.timestamp
        return result
    }

    this.addData = function(dataset, data){
        let ds = this.datasets[dataset]
        if (!ds) {
            ds = this.addDataset(dataset)
        }
        ds.addRow(data)
    }

    this.getDataset = function(dataset){
        let ds = this.datasets[dataset]
        if (ds){
            return ds
        } else {
            this.error("dataset not found: "+dataset)
            return {}
        }
    }

    this.addDataset = function(name,params){
        if (!params) {
            params = {name: name}
        }
        // console.log("create dataset " , name)
        // check if dataset already exists ...
        let ds = this.datasets[name]
        if (ds){
            //console.log("dataset already exists "+name)
            ds.readColumns(params)
        } else {
            ds = new Dataset(params, this)
        }
        this.datasets[name] = ds
        return ds
    }

    this.replaceParams = function(source, replacer, pattern ){
        // how to handle multiple columns ??  Only first? Several batches?
        const split = "\{\{([\\w\.]*)\}\}"
        let regex = new RegExp(split, "g")  //  regex = /{{([\w.]*)}}/

        let params = {}
        let paramsOrdered = []
        if (!replacer) {
            replacer = (paramName,value,index) => { return value }
            // replacer = (paramName,value,index) => { return "@"+paramName+" " } // bigquery
            // replacer = (paramName,value,index) => { return " ? " } // sql
            // replacer = (paramName,value,index) => { return quote(value) } // quotes
        }
        let counter = 0

        let replaced = source.replaceAll(regex, (v, paramName) => {
            let ds = "query" // ????  default args
            let pos = paramName.indexOf(".")
            if (pos>0){
                ds = paramName.substr(0,pos)
                paramName =  paramName.substr(pos+1,paramName.length)
            }
        //console.log(" get Value "+ds+ " / "+paramName)
            let value = this.getDataset(ds).getValue(paramName)
            // check required fields?
            // check multiple values ???

            params[paramName] = value
            paramsOrdered.push(value)

            return replacer(paramName,value,counter++)
        })

        return {
            replaced:replaced,
            params:params,
            ordered:paramsOrdered,
            // replaced : replaced
        }

    }

    this.msg = function(msg,info){ // level?
        // used for messages to show to end user
        console.log(msg,info)
        this.addData("msgs",{ timestamp:Date.now(),msg:msg,info:info })
    }

    this.logItem = function(level,msg,info){
        console.log(msg,info)
        // log to logger
        this.addData("log",{ level:level,timestamp:Date.now(),msg:msg,info:info })
    }
    this.debug = function(msg,info){
        if (this.engine.isProduction()) return
        this.logItem("debug",msg,info)
    }
    this.log = function(msg,info){
        this.logItem("info",msg,info)
    }
    this.info = function(msg,info){
        this.logItem("info",msg,info)
    }

    this.error = function(msg, error){
        // message?
        this.logItem("Error",msg,error)
        this.addData("error",{ level:"error",timestamp:Date.now(),msg:msg,info:error })
        // stop execution
    }

}


export {Report}
