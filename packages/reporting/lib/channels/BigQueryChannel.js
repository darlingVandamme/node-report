import {BigQuery} from '@google-cloud/bigquery';
import {profileStats} from "../profileStats.js";
import {Query} from "../query.js"

class BigQueryChannel {

    constructor(options) {
        // // console.log("setup Mysql Channel " + JSON.stringify(options))
        this.options = options.options
        this.name = options.name
        this.stats = new profileStats("BigQuery")
        console.log("starting bigQuery " + JSON.stringify(options))
        // todo login as end user
        // https://cloud.google.com/bigquery/docs/authentication/end-user-installed

        // service account
        this.bigquery = new BigQuery({
                keyFilename: this.options.keyFilename,
                projectId: this.options.projectId,
                scopes: [
                    "https://www.googleapis.com/auth/bigquery",
                    "https://www.googleapis.com/auth/drive"
                ]
            }
        )
    }

    async load(ds, connection, params) {
        console.log("start BigQuery Load")
        let startTime = this.stats.start()
        ds.report.debug("Init BigQuery " + this.name, params)
        let query = new Query(params.query, {
            path: ds.report.path,
            replacer: "at", // "quote",
            params: params
        })
        if (params.paging) {
            await ds.require("paging")
            query.add(" limit {{paging.limit}} offset {{paging.offset}} ")
        }
        ds.connection.query = query
        ds.connection.location = params.location || "US"

        // check if query is available (and valid?
        await query.init()
        await ds.checkRequire(query.strings().join())   // .forEach(s=> ds.checkRequire(s))

        const context = {
            getValue: (key) => {
                key = key.replaceAll("_", ".")
                return ds.report.getValue(key)
            }
        }
        query.build(context)

        ds.report.debug("replace params " + this.name, JSON.stringify({stmt: query.query, params: query.flatParams}))
        console.log("replace params " + this.name, JSON.stringify({stmt: query.query, params: query.flatParams}))

        const opt = {
            query: query.query,
            location: connection.location,
            params: query.flatParams
            // dryRun: true,
        };

        return this.bigquery.query(opt)
            .then(([rows]) => {
                console.log("Done Query " + rows.length)
                let i = 0
                rows.forEach(row => {
                    // console.log("read row " + i++)
                    ds.addRow(row)
                })
            })
            .catch(error => {
                ds.report.error("error in Bigquery", error)
                console.error("error in Bigquery", error)
                // todo try to reconnect??
                //throw error
            }).finally(()=>{
                this.stats.stop(startTime)
            })
    }
}

export default BigQueryChannel