
function CopyChannel(options) {
    // // console.log("setup Mysql Channel " + JSON.stringify(options))
    this.options = options.options
    this.name = options.name
    // console.log("setup Copy Channel constructor" )
    this.connect = function (dataset) {
        //// console.log("connecting Mysql Channel connected" )
        return {
            init: init,
            load: load
        }
    }
}

function init(ds, channel, params){
    // // console.log(" init ds mysql "+JSON.stringify(params))
    // if dataset.queryfile  read file into query
    // console.log("setup Copy Channel "+this.name+" from "+ params.from)

    ds.checkRequire(params.from)
    this.sourceDS = ds.report.getDataset(params.from)
    //// console.log("SourceDS "+this.sourceDS.rows())

    /*read Queryfile
    .then(()=>{

        ds.checkRequire(params.query)

    })
    */
    return Promise.resolve()
}


function load(ds, channel, params){

    //let source = ds.report.getDataset(params.source)
    // console.log("SourceDS "+this.sourceDS.rows())
    let data = this.sourceDS.getRow(0).data
    // todo copy multiple rows
    ds.report.debug("Copy data ",JSON.stringify(data))
    ds.addRow(data)
}



export default CopyChannel