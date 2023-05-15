import mysql from "mysql2/promise"
import path from "path"
import fs from "fs/promises"
import {profileStats} from "../profileStats.js";
import {Query} from "../query.js"

function MysqlChannel(options) {
    // // console.log("setup Mysql Channel " + JSON.stringify(options))
    this.options = options.options
    this.name = options.name
    this.stats = new profileStats("mySQL")
    // connectionpool
    this.pool =  mysql.createPool({    //mysql.createConnection({
        host: this.options.host,
        user: this.options.user,
        port: this.options.port,
        password: this.options.password,
        database: this.options.db
    })/*.then((conn)=>
        this.connection = conn
    )*/
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
    /*connection.ping(function (err) {
  if (err) throw err;
  console.log('Server responded to ping');
  reconnect
})

     */
    ds.report.log("Init MySQL "+channel.name,params)
    console.log("Init MySQL "+channel.name,params)
    let query = new Query(params.query,ds.report,{})
    ds.connection.query = query
    /*    if (Array.isArray(params.query)){
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
        }*/

    // check if query is available (and valid?
    let p = query.init()
        .then(()=>{
            // add paging
            ds.checkRequire(query.checkRequire(ds))
        })

    // check if connection is still ok, reconnect
    return p
}


function load(ds, channel, params){
    // (wait on channel.done?)
    let connection = channel.pool
    // build query
    const query = ds.connection.query

    query.build()


    // ds.report.log("MySQL query " , params.query)
    let startTime = channel.stats.start()

    ds.report.debug("replace params "+channel.name,JSON.stringify({stmt:query.replaced,ordered:query.ordered}))
    console.log("replace params "+channel.name,JSON.stringify({stmt:query.replaced,ordered:query.ordered}))


    // return connection.query(params.query).then( ([rows,columns]) =>{
    return connection.query(query.replaced, query.ordered).then( ([rows,columns]) =>{
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