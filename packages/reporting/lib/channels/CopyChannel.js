
class CopyChannel {
    constructor(options) {
        this.options = options.options
        this.name = options.name
    }



    async load(ds, connection, params) {
        //let source = ds.report.getDataset(params.source)
        connection.sourceDS = await ds.report.require(params.from)
        // connection.sourceDS = ds.report.getDataset(params.from)
        connection.copyColumns = params.copyColumns

        //console.log("SourceDS " + connection.sourceDS.name + connection.sourceDS.rows())
        connection.sourceDS.getRows().forEach(row => {
            ds.addRow(row.getData(connection.copyColumns))
        })
    }
}


export default CopyChannel