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

    init(ds, connection, params){
        ds.report.log("Init MySQL "+this.name)
        // console.log("Init MySQL "+channel.name,params)
        let query = new Query(ds.options.query,{
            path: ds.report.path,
            replacer:"prepared", // "quote",
            params:ds.options
        })
        if (params.paging){
            ds.report.require("paging")
            query.add(" limit {{paging.limit}} offset {{paging.offset}} ")
        }
        connection.query = query

        // check if query is available (and valid?
        let p = query.init()
            .then(()=>{
                ds.checkRequire(query.strings().join())   // .forEach(s=> ds.checkRequire(s))
            })
        // check if connection is still ok, reconnect
        return p
    }


    load(ds, connection){
        // (wait on channel.done?)
        let startTime = this.stats.start()
        let conn = this.pool
        // build query
        const query = connection.query

        const context = {
            getValue : (key)=>ds.report.getValue(key)
        }
        query.build(context)

        ds.report.debug("replace params "+this.name,JSON.stringify({stmt:query.query,ordered:query.ordered}))
        console.log("replace params "+this.name,JSON.stringify({stmt:query.query,ordered:query.ordered}))

        // return connection.query(params.query).then( ([rows,columns]) =>{
        return conn.query(query.query, query.ordered).then( ([rows,columns]) =>{
            // set columns
            // console.log("info "+columns.info)
            // console.log("info "+rows.info)
            // todo register column types
            let i=0
            rows.forEach(row=>{
                // console.log("read row "+i++)
                ds.addRow(row)
            })
        }).catch(error => {
            ds.report.error("error in MySQL",error)
            // todo try to reconnect??
            //throw error
        }).finally (()=>{
            this.stats.stop(startTime)
        })
    }
}



export default MysqlChannel