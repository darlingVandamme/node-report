
function PagingChannel(options) {
    this.options = options.options
    this.name = options.name //"paging"
    this.connect = function (dataset) {
        //console.log("connecting Mysql Channel connected" )
        dataset.init = init
        dataset.load = load
    }
}


/* columns :

- limit / pageSize
- offset
- page
- from
- to
- previousPage
- nextPage
- url's
?? start , end , pageSize?
*/

function init(ds, channel, params){
    // console.log(" init ds mysql "+JSON.stringify(params))
    // if dataset.queryfile  read file into query
    console.log("setup paging Channel "+this.name)
    // hardcoded to query???
    ds.require("query")

    return Promise.resolve()
}


function load(ds, channel, params){

    //let source = ds.report.getDataset(params.source)
    // set defaults?
    let data = {

    }
    let source = ds.report.getDataset("query")
    data.limit = tryValue(source,"limit")
    data.pageSize = tryValue(source,"pageSize")
    data.offset = tryValue(source,"offset")
    data.from = tryValue(source,"from")
    data.to = tryValue(source,"to")
    data.page = tryValue(source,"page")
    // ... others? From, to
    console.log("paging params "+JSON.stringify(data))
    data = calculate(data)
    console.log("paging params "+JSON.stringify(data))
    ds.addRow(data)
    console.log(JSON.stringify(ds.getRow(0).data))
}

function tryValue(source,name){
    let val = source.getValue(name)
    if (val){
        val = parseInt(val)
    }
    //console.log("page value "+name+" "+val)
    return val
}

function calculate(data){
    // from - to   limit = (to - from )  switch
    let toFrom
    if (data.to != null && data.from !=null) toFrom = (data.to-data.from)
    data.limit = data.limit || data.pageSize || toFrom || 20
    data.pageSize = data.limit

    let offset = data.offset || data.from  || 0
    if (! (data.offset || data.from)){
        // if page ....  calculate offset
        if (data.page){
            offset = data.page * data.limit
        } else {
            offset = 0
        }
    }
    data.offset = offset
    data.from = offset
    data.to = data.from + data.limit
    if (!data.page) {
        data.page = (data.offset / data.limit)
    }
    if (data.page>0){
        data.previousPage = data.page-1
    }
    // maxPage???
    data.nextPage = data.page+1
    // data.pageStart = start*limit
    // todo prev and next pages
    return data

}


export default PagingChannel