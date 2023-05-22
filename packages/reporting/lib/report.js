import {Dataset} from "./dataset.js"
import {Link} from "./link.js"
// getValue(datasetname,key,(rowNr))

class Report {


    constructor(name,reportDef,engine) {
        this.name = name
        this.timestamp = Date.now()
        this.def = reportDef
        this.engine = engine
        this.datasets = {}
        this.sources = {}  // needed?
        this.outputName = "main" // main, args, error, log, debug, alt?
        this.output = {}
        this.req = {}
        this.hbs = engine.hbs
        this.requireList = []
        this.loadList = []
        this.version = reportDef.version || ""

    }


    init(outputName,options){
        // todo check version
        // console.log("name "+this.def.name)
        // todo Better output selection
        this.def?.datasets.forEach(dsDef =>{
            let name = dsDef.name
            this.debug("found dataset ",name)
            this.addDataset(name,dsDef)
        })

        this.outputName = outputName
        this.output = this.def.output[outputName]
        //console.log("output selected "+outputName+" : "+JSON.stringify(this.output))
        this.debug("select output",outputName)
        // override default include through options
        if (options.include){ // array?
            this.debug("override include",options.include)
            this.output.include = options.include
        }

        //if (!this.output.layout) this.output.layout = options.layout
        if (options.dataset){
            this.debug("override dataset",options.dataset)
            if (Array.isArray(this.output.dataset)){
                this.output.include = [...options.dataset]
            } else {
                this.output.include = [options.dataset]
            }
            // this.debug("change template ",this.output.template)
            // todo configure
            this.output.layout = ""
            // this.output.template = "div"
        }

        return this.require(this.output.include)
    }


    getLink(options){
        // console.log("URL :" +this.url)
        // remove report. settings?
        // other base ???
        return new Link(this.req.url, this.req.base, options)
    }

    async require(dsName) {
        //console.log("require " + dsName)
        if (Array.isArray(dsName)) {
            return Promise.all(dsName.map(s => {
                return this.require(s)
            }))
        } else {
            // check comma separated
            //// console.log("search source " + source)
            let ds = this.datasets[dsName]
            if (!ds) {
                // autocreate?
                // // console.log(" require new "+source)
                ds = this.addDataset(dsName)
            }
            //console.log("require2 " + dsName + " " + ds.connection.status)
            if (ds.connection.status == "loading") {
                // error circular dependency
                // await ???
                if (ds.connection.done) {
                    return ds.connection.done.then(() => {
                        return ds
                    })
                } else {
                    console.log("circular dependency??? ")
                }
                //return ds
            }
            if (ds.connection.status == "done") {
                return ds //ds.connection.done
            }

            this.requireList.push(dsName)
            ds.connection.done = this.load(ds)
            await ds.connection.done
        }
    }

    async load(ds) {
        ds.connection.status = "loading"

        if (ds.options.require) {
            await ds.require(ds.options.require)
            // console.log("require dataset"+ds.options.require)
        }
        // check ds columns for dependencies
        // todo await
        Object.values(ds.columns).forEach((col) => {
            if (col.init) {
                col.init(ds, this)
            }
        }) // col.init(ds, report/this)

        // source deprecated
        let channel = this.engine.getChannel(ds.options.channel || ds.options.source)
        if (channel) {
            // console.log("found source type "+ds.options.source + " ")
            ds.connection.channel = channel

            this.debug("init dataset channel ", ds.name)
            if (channel.init) {
                ds.connection.initDone = await channel.init(ds, ds.connection, ds.options)
            }
            await channel.load(ds, ds.connection, ds.options)
            ds.connection.status = "done"
            //console.log("require done " + ds.name)
            this.loadList.push(ds.name)
            return ds
            // return ds.connection.done
        } else {
            ds.connection.status = "done"
            return ds
        }
    }


    /*
    dependencyPromises(ds) {
        let deps = []
        ds.dependencies.forEach(depName => {
            let depDS = this.getDataset(depName)
            if (depDS.connection) {
                //console.log("Dependency " + ds.name + " waiting on " + depName)
                deps.push(depDS.connection.done)
                deps.push(depDS.connection.loading)
            }
        })
        return deps
    }
*/
    checkColumns(){
        // check columns after load
        // specify additional info (type, display, style,...)
        this.loadList.forEach(name => {
            let ds = this.getDataset(name)
            ds.columns.forEach( col =>{
                // ds.options.position
                // ds.options.type
                if (!col.template) {
                    // change
                    if (ds.options.type == "form") {
                        if (col.name.startsWith("report.")){
                            col.template = "hidden"
                        }
                        if (col.name.startsWith("paging.")){
                            col.template = "hidden"
                        }
                        //  date, checkbox, select(lookup)

                    } else {
                        col.template = "default"
                    }
                }
            })
        })
    }

    getValue(key){
        // rowNr??
        let s = key.split(".")
        if (s.length>1) {
            let ds = this.getDataset(s[0])
            return ds.getValue(s[1])
        }
    }

    getResult(options = {datasets:true}){
        const result = {
            name:this.name,
            timestamp:this.timestamp,
            moment:new Date(),
            req:this.req,
            url: this.getLink().toString(),
            relative: this.getLink().relative(),
            data:{},
            include:{
                "css" : [],
                "scripts" : [],
                "javascript" : []
            }
        }
        if (options.datasets) {
            this.output.include.forEach(dsName => {
                result.data[dsName] = (this.getDataset(dsName).getResult(options))
            })
        }
        // options custom include
        result.profile=Date.now()-this.timestamp
        return result
    }

    addData(dataset, data){
        let ds = this.datasets[dataset]
        if (!ds) {
            ds = this.addDataset(dataset)
        }
        ds.addRow(data)
    }

    getDataset(dataset){
        let ds = this.datasets[dataset]
        if (ds){
            return ds
        } else {
            this.error("dataset not found: "+dataset)
            return {}
        }
    }

    addDataset(name,params){
        if (!params) {
            params = {name: name}
        }
        //// console.log("create dataset " , name,params)
        // check if dataset already exists ...
        let ds = this.datasets[name]
        if (ds){
            //// console.log("dataset already exists "+name)
            // merge options
            //// console.log(ds.options)
            ds.options = {...ds.options, ...params}
            //// console.log(ds.options)
            ds.readColumns(params)
        } else {
            ds = new Dataset(params, this)
        }
        this.datasets[name] = ds
        return ds
    }

    msg(msg,info){ // level?
        // used for messages to show to end user
        // console.log(msg,info)
        this.addData("msgs",{ timestamp:Date.now(),msg:msg,info:info })
    }

    logItem(level,msg,info){
        // console.log(msg,info)
        // log to logger
        this.addData("log",{ level:level,timestamp:Date.now(),msg:msg,info:info })
    }
    debug(msg,info){
        if (this.engine.isProduction()) return
        this.logItem("debug",msg,info)
    }
    log(msg,info){
        this.logItem("info",msg,info)
    }
    info(msg,info){
        this.logItem("info",msg,info)
    }

    error(msg, error){
        // message?
        this.logItem("Error",msg,error)
        this.addData("error",{ level:"error",timestamp:Date.now(),msg:msg,info:error })
        // stop execution
    }

}


export {Report}
