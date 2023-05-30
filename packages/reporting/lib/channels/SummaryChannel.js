
class SummaryChannel {
    constructor(options, engine) {
        this.options = options.options
        this.name = options.name
    }


    async load(ds, connection, params) {
        //let source = ds.report.getDataset(params.source)
        connection.sourceDS = await ds.report.require(params.from)
        // connection.sourceDS = ds.report.getDataset(params.from)
        ds.addRow({ }) // add single empty row
        // iterate over columns?

    }
}


export default SummaryChannel