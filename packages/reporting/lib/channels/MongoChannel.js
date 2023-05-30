import {profileStats} from "../profileStats.js";
import {MongoClient} from 'mongodb'
import {Query} from "../query.js";
import vm from 'node:vm'

class MongoChannel{

    constructor(options, engine){
        this.options = options.options
        this.name = options.name
        this.stats = new profileStats("mongo")
        // path in channel options?
        this.queryPath = engine.paths.query
        const connectionConf ={}

        if (options.user){
            // todo use secrets
            connectionConf.auth = {user : options.user,
                password : options.password}
        }
        console.log(options)
        this.client = new MongoClient(this.options.url , connectionConf)
        try {
            this.connection = this.client.connect()
        } catch (error) {console.error(error)}
    }

    async load(ds, connection, params) {
        let startTime = this.stats.start()
        let query = new Query(ds.options.query, {
            path: this.queryPath,
            replacer: "object", // "quote",
            params: ds.options
        })
        if (params.paging) {
            await ds.require("paging")
            // query.add(" limit {{paging.limit}} offset {{paging.offset}} ")
        }
        connection.query = query

        let conn = await this.connection

        await query.init()
        await ds.checkRequire(query.strings().join())   // .forEach(s=> ds.checkRequire(s))

        const context = {
            getValue: (key) => ds.report.getValue(key)
        }
        query.build(context)

        ds.report.debug("replace params " + this.name, JSON.stringify({stmt: query.query, params: query.flatParams}))
        console.log("replace params " + this.name, JSON.stringify({stmt: query.query, params: query.flatParams}))

        const queryContext = query.flatParams
        // add ISODate and ObjectID
        // query.getObject(queryContext)
        //console.log(query.query)
        // console.log(queryContext)
        let script = new vm.Script( "query = "+query.query )
        vm.createContext(queryContext)
        let queryObj = script.runInContext(queryContext)
        //console.log(queryContext)
        // console.log(queryObj)

        console.log("db "+params.db+" collection: "+params.collection )
        const queryOptions = {

        }
        if (params.sort){
            script = new vm.Script( "sort = "+params.sort )
            let sortObj = script.runInContext(queryContext)
            queryOptions.sort = sortObj
        }
        // projection
        // distinct count group
        // aggregate
        if (params.paging){
            queryOptions.skip = ds.report.getValue("paging.offset")
            queryOptions.limit = ds.report.getValue("paging.limit")
        }

        console.log("QueryOptions ",queryOptions )

        // find vs findOne vs command vs aggregate ....
        let cursor

        try {
            if (params.command=="aggregate"){
                console.log("using aggregate")
                cursor = await conn.db(params.db).collection(params.collection).aggregate(queryObj, queryOptions)
            }else {
                cursor = await conn.db(params.db).collection(params.collection).find(queryObj, queryOptions)
            }


            let i = 0
            while(await cursor.hasNext()){
                console.log("read row " + i++)
                ds.addRow(await cursor.next())
            }
        } catch(error) {
            console.log("Mongo error ",error)
            ds.report.error("error in mongo", error)
            // todo try to reconnect??
            //throw error
        } finally {
            await cursor.close()
            this.stats.stop(startTime)
        }



    }
}

export default MongoChannel