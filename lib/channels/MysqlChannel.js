import mysql from "mysql2/promise"
import {profileStats} from "../profileStats.js";
import {Query} from "../query.js"

class MysqlChannel {

    constructor(options) {
        // // console.log("setup Mysql Channel " + JSON.stringify(options))
        this.options = options.options
        this.name = options.name
        this.stats = new profileStats("mySQL")
        // connectionpool
        this.pool = mysql.createPool({    //mysql.createConnection({
            host: this.options.host,
            user: this.options.user,
            port: this.options.port,
            password: this.options.password,
            database: this.options.db
        }) // console.log("setup Mysql Channel connected" )
    }

    connect(dataset) {
        //// console.log("connecting Mysql Channel connected" )
        return {
            init: init,
            load: load
        }
    }
}

function init(ds, channel, params){
    ds.report.log("Init MySQL "+channel.name,params)
    console.log("Init MySQL "+channel.name,params)
    let query = new Query(params.query,{
        path: ds.report.path,
        replacer:"prepared", // "quote",
        params:params
    })
    if (params.paging){
        query.add(" limit {{paging.limit}} offset {{paging.offset}} ")
    }
    ds.connection.query = query

    // check if query is available (and valid?
    let p = query.init()
        .then(()=>{
            // todo add paging
            query.strings().forEach(s=> ds.checkRequire(s))
        })
    // check if connection is still ok, reconnect
    return p
}


function load(ds, channel, params){
    // (wait on channel.done?)
    let connection = channel.pool
    // build query
    const query = ds.connection.query

    const context = {
        getValue : (key)=>ds.report.getValue(key)
    }
    query.build(context)


    // ds.report.log("MySQL query " , params.query)
    let startTime = channel.stats.start()

    ds.report.debug("replace params "+channel.name,JSON.stringify({stmt:query.query,ordered:query.ordered}))
    console.log("replace params "+channel.name,JSON.stringify({stmt:query.query,ordered:query.ordered}))

    // return connection.query(params.query).then( ([rows,columns]) =>{
    return connection.query(query.query, query.ordered).then( ([rows,columns]) =>{
        // set columns
        // console.log("info "+columns.info)
        // console.log("info "+rows.info)
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