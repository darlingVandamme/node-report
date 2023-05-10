
function AggregateChannel(options) {
    this.options = options.options
    this.name = options.name
    this.connect = function (dataset) {
        return {
            init: init,
            load: load
        }
    }
}

function init(ds, channel, params){

    ds.require(params.from)
    this.sourceDS = ds.report.getDataset(params.from)
    // load all functions??
    // read functions from file?
    return Promise.resolve()
}


function load(ds, channel, params){
    //let source = ds.report.getDataset(params.source)
    console.log("SourceDS "+this.sourceDS.rows())
    // let data = this.sourceDS.getRow(0).data
    let accumulator = this.sourceDS.accumulator()
    let columns = accumulator.dimensions
    if (ds.options.columns){
        columns = ds.options.columns
    }

    getDim("sum", (c)=>accumulator.sum(c) , ds, columns)
    getDim("min", (c)=>accumulator.min(c) , ds, columns)
    getDim("max", (c)=>accumulator.max(c) , ds, columns)
    getDim("count", (c)=>accumulator.count(c) , ds, columns)
    getDim("mean", (c)=>accumulator.average(c) , ds, columns)
    getDim("stddev", (c)=>accumulator.std(c) , ds, columns)

    return Promise.resolve()
}

function getDim(dim, f , ds , columns) {
    let result = {name: dim}
    columns.forEach((colName) => {
        result[colName] = f(colName)
    })
    ds.addRow(result)
}



export default AggregateChannel