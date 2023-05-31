import mysql from "mysql2/promise"
import {profileStats} from "../profileStats.js";
import {Query} from "../query.js"

class MysqlChannel {

    constructor(options, engine) {
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

        this.queryPath = engine.paths.query

    }

    async load(ds, connection, params) {
        let startTime = this.stats.start()

        let query = new Query(ds.options.query, {
            path: this.queryPath,
            replacer: "prepared", // "quote",
            params: ds.options
        })
        if (params.paging) {
            await ds.require("paging")
            query.add(" limit {{paging.limit}} offset {{paging.offset}} ")
        }
        connection.query = query

        // check if query is available (and valid?
        await query.init()
        await ds.checkRequire(query.strings().join())   // .forEach(s=> ds.checkRequire(s))

        // build query

        const context = {
            getValue: (key) => ds.report.getValue(key)
        }
        query.build(context)

        ds.report.debug("replace params " + this.name, JSON.stringify({stmt: query.query, ordered: query.ordered}))
        console.log("replace params " + this.name, JSON.stringify({stmt: query.query, ordered: query.ordered}))


        let conn = this.pool
        // return connection.query(params.query).then( ([rows,columns]) =>{
        let [rows, columns] = await conn.query(query.query, query.ordered)
        // set columns
        // console.log("info "+columns.info)
        // console.log("info "+rows.info)
        // todo register column types
        try {
            let i = 0
            rows.forEach(row => {
                console.log("read row " + i++)
                ds.addRow(row)
            })
        } catch(error) {
            ds.report.error("error in MySQL", error)
            // todo try to reconnect??
            //throw error
        } finally {

            this.stats.stop(startTime)
        }
    }
}



export default MysqlChannel