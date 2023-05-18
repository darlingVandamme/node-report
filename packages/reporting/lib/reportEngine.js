import fs from "fs/promises"
import path from "path"
import {Report} from "./report.js"
import {getOutput} from "./output.js"
import {hbs}  from './handlebars.js';
import { fileURLToPath } from 'url';
import express from 'express'

function createEngine(configFile){
    return new ReportEngine(configFile)
}

class ReportEngine {

    constructor(configFile) {

        this.runtime = {
            startTime: Date.now(),
            errors: 0,
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
        this.paths.reports =  path.join(this.paths.root, "./runtime/reports")

        console.log(this.paths)

        this.hbs = new hbs({root: "runtime/views", "module": path.join(this.paths.module, "views")}) // options

        this.channels = {}

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
                if (conf.root) {
                    this.paths.report = path.join(this.paths.root, conf.root)
                    console.log("report path "+this.paths.report)
                }

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
                this.addChannels(conf.channels)
            })
            .catch(error => {
                this.logger.error(error, "default config file not found or invalid " + fileName)
                throw error
            })

    }

    addChannels(channelConf){
        return Promise.all(channelConf.map(channel => {
            if (channel.source) {
                // dynamic import
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import
                return import(channel.source).then( result => {
                    // // console.log("try new channel "+channel.name )
                    this.addChannel(channel.name, new result.default(channel))
                })
            }
        }))
    }

    async findReport(name) {
        // todo uitwerken (multiple sources?)
        let fileName = path.join(this.paths.report, name + ".json")
        this.logger.log("try report file " + fileName)
        try {
            let content = await fs.readFile(fileName,"utf8")
            // console.log(content)
            let reportDef = JSON.parse(content)
            console.log(reportDef)
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
        console.log(definition)
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
                    report.req = {
                        url : req.url,
                        originalUrl : req.originalUrl,
                        base : req.protocol + '://' + req.get('host') ,
                        fullUrl: req.protocol + '://' + req.get('host') + req.originalUrl,
                        method:req.method,
                        route:req.route.path,
                        acceptLanguage:lang,
                        lang: lang.substr(0,(lang.search("-")>-1?lang.search("-"):lang.length)),
                        locale: lang.substr(0,(lang.search(",")>-1?lang.search(","):lang.length)),
                        userAgent:req.get("User-Agent"),
                        ip:req.ip,
                        user:req.user,
                        href:req.href
                    }
                    // set base
                    // check is req.url is correct  anders originalURL  of combination of protocol, server ...
                    // absolute vs relative
                    // https?? base and protocol specs in reportEngine
                    // report.logger.info("report get " + report.name)
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

            // register query and body as singleton dataset

            // headers
            // session
            // params
            // user
            // required
            // engine   # reports, users, speed, log ....
            report.addData("server", {
                "baseUrl":req.baseUrl,
                "url":req.url,
                "hostname":req.hostname,
                "ip":req.ip,
                "ips":req.ips,
                "method":req.method,
                "originalUrl":req.originalUrl,
                "path":req.path,
                "protocol":req.protocol
            })
            report.addData("query", req.query)
            //// console.log("query1 "+report.getDataset("query").rows())
            return report.init(output,options)
        }).then(() => {
            // argument form
            // report info
            // create context
            // report.arguments.addAll(req.query)
            // todo check required params
            //// console.log("query2 "+JSON.stringify(report.getDataset("query").data))
            return report.load()
        }).then((result) => {
            //// console.log(JSON.stringify(report))
            // check if exists, fallback to default (first)
            let output = getOutput(report.output.type)
            //let output = getOutput("serverHtml")
            //let output = getOutput("json")
            //// console.log("output options: "+JSON.stringify(report.output))

            let outputOptions = report.output
            // if  (!outputOptions.layout) outputOptions.layout = "main" // default layout???
            // console.log("output options "+JSON.stringify(report.output))
            // outputOptions.res = res  // send res to allow serverHTML
            output(report, outputOptions).then(html=>{
                if (outputOptions.mime){
                    console.log("mime type "+outputOptions.mime)
                    res.type(outputOptions.mime)
                }
                res.send(html)
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