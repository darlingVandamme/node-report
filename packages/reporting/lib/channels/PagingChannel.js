
class PagingChannel {

    constructor(options) {
        this.options = options.options
        this.name = options.name //"paging"
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

    init(ds, connection) {
        // // console.log(" init ds mysql "+JSON.stringify(params))
        // if dataset.queryfile  read file into query
        // console.log("setup paging Channel "+this.name)
        // hardcoded to query???
        ds.require("query")
        return Promise.resolve()
    }


    load(ds, connection) {
        //let source = ds.report.getDataset(params.source)
        // set defaults?
        let data = {}
        let source = ds.report.getDataset("query")
        data.limit = tryValue(source, "limit")
        data.pageSize = tryValue(source, "pageSize")
        data.offset = tryValue(source, "offset")
        data.from = tryValue(source, "from")
        data.to = tryValue(source, "to")
        data.page = tryValue(source, "page")
        data.max = tryValue(source, "max")
        data.maxEstimate = tryValue(source, "maxEstimate")
        data.link = ds.report.getLink()
        //// console.log("paging params "+JSON.stringify(data))
        data = calculate(data)
        //// console.log("paging params "+JSON.stringify(data))
        ds.addRow(data)

        //// console.log(JSON.stringify(ds.getRow(0).data))
        return Promise.resolve()
    }
}

function tryValue(source,name){
    let val = source.getValue("paging."+name)
    if (val){
        val = parseInt(val)
    }
    //// console.log("page value "+name+" "+val)
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
    // check if offset < max
    data.data = getPaging(data)
    return data
}

function getPaging(data){
    // data = calculate(data)
    let link = data.link
    link.delete("paging.from")
    link.delete("paging.to")
    link.delete("paging.offset")
    //link.remove("paging.limit")
    //link.remove("paging.pageSize")
    link.delete("paging.page")
    let maxPage = 1000 // ???
    if (data.max) maxPage = data.max/data.pageSize
    // console.log("maxPage "+maxPage+" "+data.max)
    let start = Math.max(data.page - 4,1)
    let showPages = 10
    let result = {}
    // first

    result.first={
        name:"first",
        page:1,
        url: link.set("paging.page",0).relative()
    }
    result.pages = []
    for (let p = start;(p<(start + showPages)&& (p<maxPage)) ;p++ ){
        result.pages.push({
            name:""+(p+1),
            page:p,
            url: link.set("paging.page",p).relative()
        })
    }
    if (data.max){
        result.last={
            name:"last",
            page:maxPage,
            url: link.set("paging.page",maxPage).relative()
        }
    }
    return result
}

export default PagingChannel