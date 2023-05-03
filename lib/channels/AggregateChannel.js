
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

    let result = {}
    result.name="sum"
    result.posts = this.sourceDS.getRows().map(row=>row.data).reduce(
        // (acc,current)=>acc+=parseFloat(current.posts) ,0
        (acc,current)=>acc+=current.posts ,0
    )
    result.views = this.sourceDS.getRows().map(row=>row.data).reduce(
        // (acc,current)=>acc+=parseFloat(current.views) ,0
        (acc,current)=>acc+= current.views ,0
    )
    ds.addRow(result)

    result = {}
    result.name="min"
    result.posts = this.sourceDS.getRows().map(row=>row.data).reduce(
        // (acc,current)=>acc+=parseFloat(current.posts) ,0
        (acc,current)=>Math.min(acc ,current.posts) , Number.MAX_SAFE_INTEGER
    )
    result.views = this.sourceDS.getRows().map(row=>row.data).reduce(
        // (acc,current)=>acc+=parseFloat(current.views) ,0
        (acc,current)=> Math.min(acc, current.views) ,Number.MAX_SAFE_INTEGER
    )
    ds.addRow(result)


    return Promise.resolve()

}



export default AggregateChannel