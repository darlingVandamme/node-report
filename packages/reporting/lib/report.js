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
        this.loadList = []
        this.outputName = "main" // main, args, error, log, debug, alt?
        this.output = {}
        this.req = {}
        this.hbs = engine.hbs
    }

    getLink(options){
        // console.log("URL :" +this.url)
        // remove report. settings?
        // other base ???
        return new Link(this.req.url, this.req.base, options)
    }

    require(source){
        // console.log(typeof source)
        if (Array.isArray(source )){
            source.forEach(s=>{
                this.require(s)
            })
        } else {
            // check comma separated
            //// console.log("search source " + source)
            let ds = this.datasets[source]
            // check if not exists => error
            if (!ds){
                // autocreate?
                // // console.log(" require new "+source)
                ds = this.addDataset(source)
            }
            if (!ds.required) { // if not already required
                ds.required = true
                this.loadList.push(source)

                let channel = this.engine.getChannel(ds.options.channel)

                if (channel){
                    // console.log("found source type "+ds.options.source + " ")
                    ds.connection = {
                        channel:channel
                    }
                    this.debug("init dataset channel ",source)
                    if (channel.init) {
                        ds.connection.initDone = channel.init(ds, ds.connection, ds.options)
                    }
                }
                if (ds.options.require){
                    ds.require(ds.options.require)
                    // console.log("require dataset"+ds.options.require)
                }
                // check ds columns for dependencies
                Object.values(ds.columns).forEach((col) =>{ if (col.init){ col.init(ds, this) }}) // col.init(ds, report/this)
            }
        }
    }

    init(outputName,options){
        // console.log("name "+this.def.name)
        // todo Better output selection
        this.def?.datasets.forEach(dsDef =>{
            let name = dsDef.name
            this.debug("found dataset ",name)
            this.addDataset(name,dsDef)
        })

        this.outputName = outputName
        this.output = this.def.output[outputName]
        console.log("output selected "+outputName+" : "+JSON.stringify(this.output))
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

        this.require(this.output.include)

        return Promise.all(this.loadList.map((name,index) => {
            if (this.datasets[name].connection)
                return this.datasets[name].connection.initDone
        }))
    }

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

    load(){
        //console.log("load datasets "+JSON.stringify(this.loadList))
        this.debug("loadList ",this.loadList)
        this.dsList = this.loadList.map(name => {return this.getDataset(name)})
        // sort loadList on dependencies
        this.dsList.sort( (a,b) => {if (a.dependencies.includes(b.name)){ return 1 }else{ return -1} })
        this.debug("loadList 2 ",this.dsList.map(d=>d.name))
        this.dsList.forEach(ds => {
            // console.log("start load dataset "+name)
            //console.log("Dependency check "+ds.name+" "+ds.dependencies)
            // todo check circular dependencies??
            let deps = this.dependencyPromises(ds);
            const channel = ds.connection.channel
            if (channel && channel.load){
                //console.log("Prepare load "+ds.name+" "+deps.length)
                ds.connection.loading = Promise.all(deps).then((deps)=>{
                    //console.log("Start load "+ds.name+" "+deps.length)
                    ds.startLoad = Date.now()
                    ds.connection.done = channel.load(ds, ds.connection )
                    //console.log("Promise set load "+ds.name+" "+deps.length)
                    if (ds.connection && ds.connection.done) {
                        return ds.connection.done.then(() => {
                            ds.loadTime = Date.now() - ds.startLoad
                            //console.log("loadTime " + ds.name + " " + ds.loadTime)
                        })
                    } else {
                        return Promise.resolve()
                    }
                })
            }
        })

        // check if isPromise
        return Promise.all(
            [...this.dsList.map(ds => {return ds.connection.loading}),
                ...this.dsList.map(ds => {return ds.connection.done})]
        )
/*            .then(()=>{
            this.checkColumns()
        })*/

    }

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
