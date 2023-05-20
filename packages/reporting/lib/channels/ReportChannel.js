import {profileStats} from "../profileStats.js";
import fs from "fs/promises"
import path from "path"

class ReportChannel {

    constructor(options) {
        // // console.log("setup Mysql Channel " + JSON.stringify(options))
        this.options = options.options
        this.name = options.name
        this.stats = new profileStats("Report")
    }

    init(ds, connection,params){
        ds.report.log("Init Report "+this.name,params)
        const reportDir = ds.report.path
        return Promise.resolve()
    }

    load(ds, connection){
        // caching?
        const reportDir = ds.report.path
        return fs.readdir(reportDir)
            .then( (files)=>{
                return files.map(f=>{
                    console.log("reading file "+f)
                    // filter on extension?
                    let fileName = path.join(reportDir,f)
                    return fs.readFile(fileName,"utf8")
                        .then(content=>{
                            const reportDef = JSON.parse(content)
                            console.log("found report "+reportDef.name)
                            ds.addRow({
                                "name":reportDef.name,
                                "filename":f,
                                "baseName":path.basename(f,".json"),
                                "description":reportDef.description,
                                "keywords":reportDef.keywords
                                // todo other ?
                                // check if output html exists
                                // check report def?
                            })
                        }).catch(error=>{
                            // add invalid files?
                            console.log("Cannot read file "+f,error)
                        })
                })
            }).then((p)=>{
                    return Promise.all(p)
                }
            )

    }

}


export default ReportChannel
