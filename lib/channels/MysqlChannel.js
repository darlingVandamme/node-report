import mysql from "mysql2/promise"
import path from "path"
import fs from "fs/promises"
import {profileStats} from "../profileStats.js";

function MysqlChannel(options) {
    // // console.log("setup Mysql Channel " + JSON.stringify(options))
    this.options = options.options
    this.name = options.name
    this.stats = new profileStats("mySQL")
    // connectionpool
    this.done = mysql.createConnection({
        host: this.options.host,
        user: this.options.user,
        port: this.options.port,
        password: this.options.password,
        database: this.options.db
    }).then((conn)=>
        this.connection = conn
    )
    // // console.log("setup Mysql Channel connected" )
    this.connect = function (dataset) {
        //// console.log("connecting Mysql Channel connected" )
        return {
            init: init,
            load: load
        }
    }

}

function init(ds, channel, params){
    // // console.log(" init ds mysql "+JSON.stringify(params))
    // if dataset.queryfile  read file into query
    let promises = [channel.done ]
    ds.report.log("Init MySQL "+channel.name,params)
    if (Array.isArray(params.query)){
        params.query = params.query.join(" /n")
    }
    if (params.queryFile) {
        // todo other file locations
        let fileName = path.join(ds.report.path,params.queryFile)
        console.log("read query from file "+fileName)
        promises.push(
            fs.readFile(fileName)
                .then(bytes => {
                    params.query=new String(bytes)
                })
        )
    }
    // check if query is available (and valid?

    Promise.all(promises)
        .then(()=>{
            ds.checkRequire(params.query)
        })

    // check if connection is still ok, reconnect
    return Promise.all(promises)
}

let replacerPrepared = (paramName,value,index) => { return " ? " }
let replacerQuote = (paramName,value,index) => { return "'"+value+"'" }
let replacer = (paramName,value,index) => { return value }

function load(ds, channel, params){
    // (wait on channel.done?)
    let connection = channel.connection
    ds.report.log("MySQL query " , params.query)
    let startTime = channel.stats.start()

    let replace = ds.report.replaceParams(params.query , replacerPrepared  )
    params.preparedStatement = replace.replaced
    params.ordered = replace.ordered

    ds.report.debug("replace params "+channel.name,JSON.stringify({stmt:params.preparedStatement,ordered:params.ordered}))


    // return connection.query(params.query).then( ([rows,columns]) =>{
    return connection.query(params.preparedStatement, params.ordered).then( ([rows,columns]) =>{
    //return connection.execute(params.preparedStatement, params.ordered).then( ([rows,columns]) =>{
        // set columns
        //// console.log("info "+columns.info)
        //// console.log("info "+rows.info)
        // todo register column types
        let i=0
        rows.forEach(row=>{
            // console.log("read row "+i++)
            ds.addRow(row)
        })
        channel.stats.stop(startTime)

    }).catch(error => {
        ds.report.error("error in MySQL",error)
        // todo try to reconnect??
        //throw error
    })
}



export default MysqlChannel