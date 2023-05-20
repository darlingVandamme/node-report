class AggregateChannel {
    constructor(options) {
        this.options = options.options
        this.name = options.name
    }

    init(ds, connection, params) {

        ds.require(params.from)
        connection.sourceDS = ds.report.getDataset(params.from)
        // load all functions??
        // read functions from file?
        return Promise.resolve()
    }

    load(ds, connection) {
        console.log("SourceDS " + connection.sourceDS.rows())
        // let data = this.sourceDS.getRow(0).data
        let accumulator = connection.sourceDS.accumulator()
        let columns = accumulator.dimensions
        /*if (ds.options.columns){
            columns = ds.options.columns
        }*/

        getDim("sum", (c) => accumulator.sum(c), ds, columns)
        getDim("min", (c) => accumulator.min(c), ds, columns)
        getDim("max", (c) => accumulator.max(c), ds, columns)
        getDim("count", (c) => accumulator.count(c), ds, columns)
        getDim("mean", (c) => accumulator.average(c), ds, columns)
        getDim("stddev", (c) => accumulator.std(c), ds, columns)

        columns.forEach((colName) => {
            ds.getColumn(colName).options.display = "fixed"
        })
        return Promise.resolve()
    }
}

function getDim(dim, f , ds , columns) {
    let result = {name: dim}
    columns.forEach((colName) => {
        result[colName] = f(colName)
    })
    ds.addRow(result)
}



export default AggregateChannel