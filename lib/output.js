const outputs = {}
const columnOutputs = {}

// register on global level ? or on engine level?
function registerOutput(name, handler){
    outputs[name] = handler
}

function getOutput(name){
    return outputs[name]
}

function registerColumnOutput(name, handler){
    columnOutputs[name] = handler
}

function getColumnOutput(name){
    return columnOutputs[name]
}


export {getOutput, registerOutput}
// hardcoded linked to res
// what about streams, files ?
// todo change  res  to   {file:fileName, res:res, ...}

registerOutput("json", function(report, options){
    let result = report.getResult() // options???
    //  result.options = options
    return Promise.resolve(JSON.stringify(result))
} )


registerOutput("hbs",  hbs)

registerOutput('serverHtml', hbs ) // name???
registerOutput('error', error ) // name???


function error(report, options){
    report.output.include = ["error","log"]
    let result = report.getResult()
    // console.log("Error "+JSON.stringify(result))
    // alert error ??
    return Promise.resolve(result)
}

function hbs(report, options) {
    let startTime = Date.now()
    if (options.reload){
        report.hbs.reload()
    }
    let link = report.getLink({})
    let result = report.getResult({datasets:false})
    let p = []
    options.include.forEach( dsName => {
        // header, summary, footer, detail, paging
        let ds = report.getDataset(dsName)
        let dsResult = ds.getResult({display:true})
        console.log("render dataset "+JSON.stringify(dsResult))
        // console.log("render type for "+dsName+" "+ds.getType())
        p.push(
            // todo add some report info  (or use helpers??)
            report.hbs.render( "dataset", ds.getType(), {dataset:dsResult}, report ).then(html=>{
                dsResult.html = html
                result.data.push(dsResult)
                // console.log("ds rendered "+html)
        }))
    })
    return Promise.all(p).then(()=> {
        // skip datasets as a copy of data
        result.datasets = result.data
        return report.hbs.render("report", options.template, result , report )
    }).then(reportHtml=> {
        result.body = reportHtml
        // console.log("Render layout "+options.template)
        if (options.layout && options.layout!="" ) {
            return report.hbs.render("layouts", options.layout, result)
        } else {
            return reportHtml
        }
    }).then((html)=>{
        // console.log("report rendered " + html)
        // res.send(html)
        // log user usage ms,  bytes, queryTime
        //res.render(options.template , result)
        // console.log("Output time " + (Date.now() - startTime))
        // console.log("Output size " + html.length)
        return html
    })
}

