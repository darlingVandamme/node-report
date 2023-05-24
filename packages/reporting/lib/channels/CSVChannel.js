import {profileStats} from "../profileStats.js";
import { parse} from 'csv-parse';
import path from "path"
import fs from "fs/promises"

class CSVChannel{

    constructor(options, engine){
        this.options = options.options
        this.name = options.name
        this.stats = new profileStats("csv")
        // path in channel options?

        this.path = path.join(engine.paths.root , (this.options.path || engine.paths.query))
        console.log("setup CSV "+this.path)
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
        if (params.paging){
            await ds.require("paging")
            options.from = ds.report.getValue("paging.from")
            options.to = ds.report.getValue("paging.to")
        }
        console.log("CSV Options",options)
        // filter
        let fd
        try {

            fd = await fs.open(fileName)
            const stream = fd.createReadStream()
            let i=0
            return new Promise((resolve, reject) => {
                stream.pipe(parse(options))
                    .on('error', error => {
                        reject(error)
                    })
                    .on('data', row => {
                        i++;
                        ds.addRow(row)
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