import fs from "fs/promises"
import path from "path"
import {Report} from "./report.js"
import { cwd } from 'node:process';
import {getOutput} from "./output.js"

//classname not needed
let channelTypes = {}
function registerChannelType(name,file){
    channelTypes[name] = ({name:name, sourceFile:file})
}

// todo move to config
registerChannelType("mysql","./channels/MysqlChannel.js")
registerChannelType("copy","./channels/CopyChannel.js")
registerChannelType("paging","./channels/PagingChannel.js")


function createEngine(configFile){
    return new ReportEngine(configFile)
}

function ReportEngine(configFile) {
    this.runtime = {
        startTime : Date.now(),
        errors:0,
        reports:0
    }
    this.rootPath = cwd()
    this.channels = {}
    this.configFile = path.join(this.rootPath, configFile)
    this.reportPath = path.join(this.rootPath, "./runtime/reports")
    this.logger = console

    this.isProduction = function(){
        // todo better
        return process.env.NODE_ENV == "production"
    }

    this.setLogger = function (log) {
        this.logger = log
        //logger.info("start reporting logging")
    }
    this.addChannel = function (name, channel) {
        this.channels[name] = channel
    }

    this.getChannel = function (name) {
        return this.channels[name]
    }

    this.init = function (req,res,next){
        // if init loading, wait for promise done
        if (this.loading) {
            this.loading.then(()=>next())
            return this.loading
        }
        // console.log("init engine ")
        // read config
        this.loading = fs.readFile(this.configFile)
            .then(bytes => {
                let conf = JSON.parse(new String(bytes))
                this.conf = conf
                if (conf.root) {
                    this.reportPath = path.join(this.rootPath, conf.root)
                }
                /*  todo handle promises */
                let promises = []
                conf.channels.forEach(channel => {
                    //console.log("try channel "+channel.name)
                    let channelType = channelTypes[channel.type]
                    //let channelSource = require(channelType.sourceFile)
                    if (channelType) {
                        // console.log("found channel type "+channel.type+" "+channelType.sourceFile)
                        // dynamic import
                        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import
                        promises.push( import(channelType.sourceFile).then( result => {
                            // console.log("try new channel "+channel.name )
                            this.addChannel(channel.name, new result.default(channel))
                        }))
                    }
                })

                this.logger.log("init reporting " + this.configFile)
                this.setup = true
                this.setupTimestamp = Date.now
                this.logger.log("root folder " + this.rootPath)
                this.logger.log("report folder " + this.reportPath)
                this.logger.log("Create engine " + this.configFile)

                Promise.all(promises).then(r=>{
                    console.log("all setup")
                    next()
                })

                //return conf
            })
            .catch(error => {
                this.logger.error(error, "config file not found " + this.configFile)
            })
        return this.loading
    }

    this.findReport = async function (name) {
        // todo uitwerken (multiple sources?)
        let fileName = path.join(this.reportPath, name + ".json")
        this.logger.log("try report file "+fileName)
        try {
            let bytes = await fs.readFile(fileName)
            let reportDef = JSON.parse(new String(bytes))
            reportDef.location = {
                path: this.reportPath,
                file: fileName
            }
            this.logger.log("read report file "+reportDef)
            return reportDef
        } catch {
            (error) => {
                this.logger.error(error)
                throw error
            }
        }
    }

    this.getReport = function (name) {
        let report
        let definition
        return this.findReport(name).then(def => {
            definition = def
            return this.findReport("default")
        }).then(defaultDef=>{
            let combined = {...defaultDef, ...definition}
            combined.datasets = [...defaultDef.datasets, ...definition.datasets]
            //outputs ...
            report = new Report(name, combined, this)
            report.debug("start ", combined)
            // set URL
            return report
        })
    }

    this.express = function(req,res,next) {
        let report
        let options = {}
        // console.log("start report " + req.params.name + " " + req.params.type)
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
                if (req.params.type) output = req.params.type // extension
            //  get output from query param  override
                if (req.query.output) output = req.query.output
            //  get single dataset from query param ???  output{name="dataset"}
                if (req.query.dataset) options.dataset = req.query.dataset

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
            //console.log("query1 "+report.getDataset("query").rows())
            return report.init(output,options)
        }).then(() => {
            // argument form
            // report info
            // create context
            // report.arguments.addAll(req.query)
            // todo check required params
            //console.log("query2 "+JSON.stringify(report.getDataset("query").data))
            return report.load()
        }).then((result) => {
            //console.log(JSON.stringify(report))
            // check if exists, fallback to default (first)
            let output = getOutput(report.output.type)
            //let output = getOutput("serverHtml")
            //let output = getOutput("json")
            //console.log("output options: "+JSON.stringify(report.output))
            output(report,res, report.output)
            // todo register (user dependent) performance data and quota
            // add additional info to report.result
            //res.json(report.data)
        })
            .catch(error => {
                console.log("error "+error+JSON.stringify(error))
                console.trace(error)
                this.runtime.errors ++
                report.error(error.message,JSON.stringify(error))
                if (report) {
                    let output = getOutput("error")
                    output(report,res, report.output)
                }
                // output
                //next() // or send error 404
            })
    }
}


export {ReportEngine}