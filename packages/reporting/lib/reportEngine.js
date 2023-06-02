import fs from "fs/promises"
import path from "path"
import {Report} from "./report.js"
import {getOutput} from "./output.js"
import {hbs}  from './handlebars.js';
import { fileURLToPath } from 'url';
import express from 'express'
import {cache} from './cache.js'

function createEngine(configFile){
    return new ReportEngine(configFile)
}

class ReportEngine {

    constructor(configFile) {
        this.runtime = {
            startTime: Date.now(),
            errors: 0,
            bytes: 0,
            reports: 0
        }
        const __filename = fileURLToPath(import.meta.url);
        this.paths = {
            lib: path.dirname(__filename),
            cwd: process.cwd(),
            root: process.cwd(),
            module: path.resolve(path.dirname(__filename), "..")
        }
        this.configFile = path.join(this.paths.root, configFile)
        this.paths.config = this.configFile
        this.paths.report =  path.join(this.paths.root,  "./runtime/reports")
        this.paths.query =  path.join(this.paths.root, "./runtime/reports")
        console.log(" init reports dir "+this.paths.report)

        this.channels = {}
        this.cache = {
            tries:0,
            hits :0,
            misses:0,
            caching:null,
        }

        this.logger = console

        this.isProduction = function () {
            // todo better
            return process.env.NODE_ENV == "production"
        }
    }

    setLogger(log) {
        this.logger = log
        //logger.info("start reporting logging")
    }

    addChannel(name, channel) {
        this.channels[name] = channel
    }

    getChannel(name) {
        return this.channels[name]
    }

    init(req, res, next) {
        // if init loading, wait for promise done
        if (this.loading) {
            this.loading.then(() => next())
            return this.loading
        }
        console.log("init engine ")
        // static dirs
        req.app.use("/reporting", express.static(path.join(this.paths.module, './public')));

        // read internal config
        this.loading = Promise.all([
            this.readDefaults(path.join(this.paths.module, "settings/reporting.json")),
            this.loadConfig(this.configFile)
        ]).then(r => {
            // todo views folder specify
            //this.hbs = new hbs({root:  path.join(this.paths.root, "views") , "module": path.join(this.paths.module, "views")}) // options
            this.hbs = new hbs({root:  path.join(this.paths.report, "../views") , "module": path.join(this.paths.module, "views")}) // options
            this.cache.caching = cache(this.conf.cache)
            console.log(this.paths)
            // console.log("all setup")
            next()
        })

        return this.loading
    }

    loadConfig(configFile) {
        return fs.readFile(configFile,"utf8")
            .then(content => {
                const conf = JSON.parse(content)
                this.conf = conf
                if (conf.reports) {
                    this.paths.report = path.join(this.paths.root, conf.reports )
                    console.log(" read reports dir "+this.paths.report)
                }

                this.paths.query =  path.join(this.paths.root, (conf.query || conf.report || "./runtime/reports"))
// todo views path
                let promises = []
                promises.push(this.addChannels(conf.channels))

                this.logger.log("init reporting " + configFile)
                this.setup = true
                this.setupTimestamp = Date.now
                return promises
            })
            .catch(error => {
                this.logger.error(error, "config file not found or invalid " + configFile)
                throw error
            })
    }


    readDefaults(fileName){
        return fs.readFile(fileName,"utf8")
            .then(content => {
                let conf = JSON.parse(content)
                return this.addChannels(conf.channels)
            })
            .catch(error => {
                this.logger.error(error, "default config file not found or invalid " + fileName)
                throw error
            })

    }

    addChannels(channelConf){
        return Promise.all (channelConf.map(channel => {
            if (channel.source) {
                // dynamic import
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import
                return import(channel.source).then(result => {
                    // // console.log("try new channel "+channel.name )
                    this.addChannel(channel.name, new result.default(channel, this))
                })
            }
        }))
        //console.log("read and init channels "+p.length )

    }

    async findReport(name) {
        // todo uitwerken (multiple sources?)
        let fileName = path.join(this.paths.report, name + ".json")
        this.logger.log("try report file " + fileName)
        try {
            let content = await fs.readFile(fileName,"utf8")
            // console.log(content)
            let reportDef = JSON.parse(content)
            // console.log(reportDef)
            reportDef.location = {
                path: this.paths.report,
                file: fileName
            }
            this.logger.log("read report file " + reportDef)
            return reportDef
        } catch {
            (error) => {
                console.error(error)
                this.logger.error(error)
                throw error
            }
        }
    }

    async getReport(name) {
        let report
        let definition = await this.findReport(name)
        let defaultDef = await this.findReport("default")
        // console.log(definition)
        let combined = {...defaultDef, ...definition}
        // todo better merge???
        combined.datasets = [...defaultDef.datasets, ...definition.datasets]
        //outputs ...
        report = new Report(name, combined, this)
        report.path = definition.location.path
        report.debug("start ", combined)
        // set URL
        return report
/*        }).catch(error => {
            console.log("error reading report  " + name)
            throw error
        })*/
    }

    // caching
    getCache(key,options){
        // console.log("get cache ",key,options)
        this.cache.tries++
        if (this.cache.caching){
            let val = this.cache.caching.get(key)
            if (val){
                this.cache.hits++
                // hit
                return val
            } else{
                this.cache.misses++
            }

            // miss
        }
    }
    setCache(key,data,options){
        console.log("set cache ",key)
        if (this.cache.caching){
            this.cache.caching.set(key,data)
        }
    }


    // usage log
    usage(item){
        // log usage
        // ip, browser, ....
        // query, server , ....
        /*{ name:reportName
            url
            user
            startTime
            stopTime
            bytes
            error
        }
         */
        console.log(item)
    }

    express(req,res,next) {
        let report
        let options = {}
        // // console.log("start report " + req.params.name + " " + req.params.type)
        this.getReport(req.params.name)
            .then(r => {
                if (!r) {
                    // not found
                    this.runtime.errors ++
                    next()
                } else {
                    report = r
                    let lang = req.get("Accept-Language")
                    report.req = req
                }
            }).then(() => {
                let output = report.def?.output?.default || "json"

                // if (req.query.output) output = req.query.output
                // if (!options.layout) options.layout = "main" // default layout???
                // if (options.layout=="none") options.layout = false
                if (req.params.type) output = req.params.type // extension
            //  get output from query param  override
                if (req.query.output) output = req.query.output
            //  get single dataset from query param ???  output{name="dataset"}
                if (req.query.dataset) options.dataset = req.query.dataset
                // better options
                if (req.query["report.output"]) output = req.query["report.output"]
                if (req.query["report.dataset"]) {
                    options.dataset = req.query["report.dataset"]
                    //options.layout = "div"
                }
                if (req.query["report.template"]) {
                    options.layout = req.query["report.layout"]
                }

            // engine   # reports, users, speed, log ....
            return report.init(output,options)
        }).then(() => {
            // todo check required params
            let output = getOutput(report.output.type)
            let outputOptions = report.output
            output(report, outputOptions).then(html=>{
                if (outputOptions.mime){
                    // console.log("mime type "+outputOptions.mime)
                    res.type(outputOptions.mime)
                }
                res.send(html)
                console.log("requireList ",report.requireList)
                console.log("loadList ",report.loadList)
                let bytes = Buffer.byteLength((html || ""),"utf-8")
                this.runtime.reports ++
                this.runtime.bytes += bytes
                this.usage({
                    name:report.name,
                    url:req.originalUrl,
                    user:req.user,
                    startTime:report.timestamp,
                    stopTime:Date.now(),
                    bytes:bytes,
                    error:{}
                    // req info
                    // server info
                    // user info
                })
                // res.status?
                // res.end() ?
            })
            // todo register (user dependent) performance data and quota
            // add additional info to report.result
            //res.json(report.data)
        })
            .catch(error => {
                console.log("error "+error+JSON.stringify(error))
                console.trace(error)
                this.runtime.errors ++
                if (report) {
                    report.error(error.message,JSON.stringify(error))
                    let output = getOutput("error")
                    output(report,res, report.output)
                    this.usage({
                        name:report.name,
                        url:req.originalUrl,
                        user:req.user,
                        startTime:report.startTime,
                        stopTime:Date.now(),
                        bytes: 0, // Buffer.byteLength(html,"utf-8"),
                        error:{}
                    })
                } else {
                    // res.sendStatus(500)
                    next(error)
                }
                // output
                //next() // or send error 404
            })
    }
}

export {ReportEngine}