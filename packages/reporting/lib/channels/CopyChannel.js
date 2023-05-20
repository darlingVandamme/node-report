
class CopyChannel {
    constructor(options) {
        this.options = options.options
        this.name = options.name
    }

    init(ds, connection, params) {

        ds.require(params.from)
        connection.sourceDS = ds.report.getDataset(params.from)
        connection.copyColumns = params.copyColumns
        return Promise.resolve()
    }


    load(ds, connection) {

        //let source = ds.report.getDataset(params.source)
        // console.log("SourceDS " + connection.sourceDS.rows())
        connection.sourceDS.getRows().forEach(row => {
            ds.addRow(row.getData(connection.copyColumns))
        })
    }
}


export default CopyChannel