import {BigQuery} from '@google-cloud/bigquery';
import {profileStats} from "../profileStats.js";
import {Query} from "../query.js"

class BigQueryChannel {

    constructor(options) {
        // // console.log("setup Mysql Channel " + JSON.stringify(options))
        this.options = options.options
        this.name = options.name
        this.stats = new profileStats("BigQuery")

        // todo login as end user
        // https://cloud.google.com/bigquery/docs/authentication/end-user-installed
        
        console.log("starting bigQuery "+JSON.stringify(options))
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

    connect(dataset) {
        console.log("Init BigQuery "+dataset.name)
        return {
            init: init,
            load: load
        }
    }
}

function init(ds, channel, params){
    ds.report.log("Init BigQuery "+channel.name,params)
    let query = new Query(params.query,{
        path: ds.report.path,
        replacer:"at", // "quote",
        params:params
    })
    if (params.paging){
        query.add(" limit {{paging.limit}} offset {{paging.offset}} ")
    }
    ds.connection.query = query

    // check if query is available (and valid?
    let p = query.init()
        .then(()=>{
            ds.checkRequire(query.strings().join())   // .forEach(s=> ds.checkRequire(s))
        })
    // check if connection is still ok, reconnect
    return p
}


function load(ds, channel, params){
    console.log("start BigQuery Load")
    let startTime = channel.stats.start()
    const query = ds.connection.query
    const context = {
        getValue : (key)=>{
            key = key.replaceAll("_",".")
            return ds.report.getValue(key)
        }
    }
    query.build(context)

    ds.report.debug("replace params "+channel.name,JSON.stringify({stmt:query.query, params:query.params}))
    console.log("replace params "+channel.name,JSON.stringify({stmt:query.query, params:query.params}))

    const opt = {
        query: query.query,
        // Location must match that of the dataset(s) referenced in the query.
        location: 'US',
        params: query.params

        // dryRun: true,
    };
    return channel.bigquery.query(opt)
        .then(([rows] ) =>{
        console.log("Done Query "+rows.length)
        let i=0
        rows.forEach(row=>{
            console.log("read row "+i++)
            ds.addRow(row)
        })
        channel.stats.stop(startTime)
        })
        .catch(error => {
        ds.report.error("error in Bigquery",error)
        // todo try to reconnect??
        //throw error
    })
}

export default BigQueryChannel