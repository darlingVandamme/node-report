import {profileStats} from "../profileStats.js";
import {Filter} from "../filter.js";
import { parse} from 'csv-parse';
import path from "path"
import fs from "fs/promises"

class CSVChannel{

    //  https://csv.js.org/parse/


    constructor(options, engine){
        this.options = options.options
        this.name = options.name
        this.stats = new profileStats("csv")
        // path in channel options?

        this.path = path.join(engine.paths.root , (this.options.path || engine.paths.query))
        console.log("setup CSV "+this.path)
        // return Promise.resolve()
    }

    async load(ds, connection, params) {
        let startTime = this.stats.start()
        // console.log("CSV file ")
        // create filename
        // todo build filename
        const fileName = path.join(this.path,params.fileName)
        console.log("CSV file "+fileName)
        // check if filename is safe

        // parser options
        // https://csv.js.org/parse/options/columns/
        const options = {...this.options , ...params.options}

        let filter = (p)=>{return true}
        if (params.filter){
            // use on_record to filter??  https://csv.js.org/parse/options/on_record/
            let sourceDS = params.filter.sourceData || "query"
            await ds.require(sourceDS)
            let sourceData = ds.report.getDataset(sourceDS).getData()[0]
            // console.log(sourceData)
            filter = new Filter(params.filter).getFilter(sourceData)
            // console.log(new Filter(params.filter).getFilterCode(sourceData))
            // manual paging
        }

        let pagingFrom = 0
        let pagingTo = Number.MAX_SAFE_INTEGER

        if (params.paging){
            await ds.require("paging")
            pagingFrom = ds.report.getValue("paging.from")
            pagingTo = ds.report.getValue("paging.to")
            options.from = ds.report.getValue("paging.from")
            options.to = ds.report.getValue("paging.to")
        }
        // manual paging
        // console.log("CSV Options",options)
        // filter
        let fd
        try {

            fd = await fs.open(fileName)
            const stream = fd.createReadStream()
            let i=0, valid=0
            return new Promise((resolve, reject) => {
                stream.pipe(parse(options))
                    .on('error', error => {
                        reject(error)
                    })
                    .on('data', row => {

                        if (filter(row)) {
                            i++;
                           /* if (i > pagingTo) {
                                console.log(" over limit " + i)
                                //stream.emit("end")
                                //stream.destroy()
                                //fd.close()
                                // stream.end()
                                // this.end()
                                //stream.close()


                            }
                            if (i > pagingFrom) {*/
                                ds.addRow(row)
                            /*}*/
                        }
                    })
                    .on('end', () => {
                        console.log("csv file read " + i)
                        fd.close()
                        resolve()
                    });
            })
        } catch(error) {
            console.log("CSV error ",error)
            ds.report.error("error in CSV Read", error)
            //throw error
        } finally {
            //fd.close()
            this.stats.stop(startTime)
        }



    }
}

export default CSVChannel