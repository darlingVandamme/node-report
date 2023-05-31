import {renderPlot} from "./graph.js"

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

registerOutput("json", function(report, options){
    let result = report.getResult() // options???
    //  result.options = options
    // include html??
    return Promise.resolve(JSON.stringify(result))
}
)

registerOutput("hbs",  hbs)

registerOutput('serverHtml', hbs ) // name???
registerOutput('error', error ) // name???
registerOutput("graph",  renderPlot )


function error(report, options){
    report.output.include = ["error","log"]
    let result = report.getResult()
    // console.log("Error "+JSON.stringify(result))
    // alert error ??
    return Promise.resolve(result)
}


async function hbs(report, options) {
    let startTime = Date.now()
    //if (options.reload){
    report.hbs.reload()
    //}
    let result = report.getResult({datasets: true, display: true})
    result.datasets = result.data
    options.include.forEach(dsName => {
        if (report.getDataset(dsName).getDisplayType().template != "container") {
            renderDS(dsName, report, result)
        }
    })
    await Promise.all(options.include.map(dsName => {return result.data[dsName].rendering}))

    options.include.forEach(dsName => {
        if (report.getDataset(dsName).getDisplayType().template == "container") {
            renderDS(dsName, report, result)
        }
    })

    //console.log("rendering  "+options.include.map( dsName => {return result.data[dsName].name}))
    await Promise.all(options.include.map(dsName => {
        return result.data[dsName].rendering
    }))

    let reportHtml = await report.hbs.renderFile("report", options.template, {report:result, output:options},report)
    result.body = reportHtml
    //console.log("using layout "+JSON.stringify(options))
    if (typeof options.layout == "undefined") options.layout = "main"
    //console.log("using layout "+JSON.stringify(options))
    if (options.layout != "" && options.layout != "none") {
        // check if layout exists ...
        reportHtml = await report.hbs.renderFile("layouts", options.layout, {report:result, output:options},report)
    }
    return reportHtml
}

function renderDS(dsName, report, result ) {
    let ds = report.getDataset(dsName)
    let dsResult = result.data[dsName]  //ds.getResult({display:true})
    //console.log("render dataset " + JSON.stringify(dsResult, null, 2))
    // console.log("render type for "+dsName+" "+ds.getType())
    if (ds.getDisplayType().template) {
        result.data[dsName].rendering = //promise
            report.hbs.renderFile("dataset", ds.getDisplayType().template, {
                dataset: dsResult,
                report: result
            }, report).then(html => {
                dsResult.html = html
                // also store the generated html in the dataset itself
                ds.setHtml(html)
                return dsResult
            })
    }
}