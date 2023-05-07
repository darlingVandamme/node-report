
function CopyChannel(options) {
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

    return Promise.resolve()
}


function load(ds, channel, params){

    //let source = ds.report.getDataset(params.source)
    console.log("SourceDS "+this.sourceDS.rows())
    // let data = this.sourceDS.getRow(0).data
    this.sourceDS.getRows().forEach(row =>{
        ds.addRow(row.getData(params.copyColumns ))
    })
    console.log("copy "+JSON.stringify(params))
    //ds.report.debug("Copy data ",JSON.stringify(data))
    // ds.addRow(data)
}



export default CopyChannel