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

registerOutput("json", function(report, res, options){
    let result = report.result() // options???
    //  result.options = options
    res.json(result)
} )


registerOutput("hbs", function(report, res , options ){
    res.render(options.template, report.result())
} )

registerOutput('serverHtml', serverHtml ) // name???
registerOutput('error', error ) // name???


function error(report, res, options){
    report.output.include = ["error","log"]
    console.log("Error "+JSON.stringify(report.result()))
    res.render("error", report.result())
}



// todo move to separate file
// Quick & Dirty
function serverHtml(report, res, options){
    /*
    server side renderer
     which datasets to include
     table vs li (singleton) vs  divs ....
     hidden datasets
     which columns to include per dataset
      template to render the whole list
      add JSON data in a script tag?
     */
    // console.log(" Output options "+JSON.stringify(options))
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#options
    const dateOptions = {  year: 'numeric', month: "2-digit", day: "2-digit", hour: "2-digit", minute:"2-digit",second:"2-digit"};

    let result ={ name:report.name,
        moment:new Date(),
        momentString: new Date().toLocaleString('en-SE',dateOptions),
        profile:Date.now()-report.timestamp,
        req:report.req,
        options:options,
        datasets:[]
    }

    options.include.forEach( dsName => {
        // header, summary, footer, detail, paging
        let ds = report.getDataset(dsName)
        let dsResult = {name:ds.name, description:ds.description, loadTime:ds.loadTime, rows:ds.rows() , position:{ } }
        dsResult.position[ds.getPosition()] = true
        // multiple positions???

        // add reload url's, paging and load next url's
        // lazy load ds's?
        //result.datasets.push( {name:ds.name, description:ds.description, loadTime:ds.loadTime, html:table(ds) } )
        switch (ds.getType()) {
            case 'table':
                dsResult.html = table(ds,options);
                result.datasets.push(dsResult)
            break;
            case 'list':
                dsResult.html = li(ds,options);
                result.datasets.push(dsResult)
            break;
            case 'row':
                dsResult.html = li(ds,options);
                result.datasets.push(dsResult)
                break;
            case 'card':
                dsResult.html = div(ds,options);
                result.datasets.push(dsResult)
            break;
            case 'form':
                dsResult.html = argForm(ds,options);
                result.datasets.push(dsResult)
            break;
            // json
            // hidden ??
            // value
            default :
                console.log("render type not found for "+dsName+" "+ds.getType())
                dsResult.html = table(ds,options);
                result.datasets.push(dsResult)
            break;
        }
    })
    // console.log(" render : "+JSON.stringify(result))
    res.render(options.template , result)
}

function table(ds){
    let data = ds.getData()
    let result = "<table id='dataset_"+data.name+"'"
    if (ds.style){ result+= "class='"+ds.style+"'" }
    result+= "> "
    result+=" <thead><tr>"
    //let columnList = ds.show()
    data.show.forEach((colName)=>{
        let header = (ds.getColumn(colName)?.options.header || colName)
        let style = (ds.getColumn(colName)?.options.style || "")
        result+=" <th class='"+style+"'>"+header+"</th>"
    }) // displayname? className
    result+=" </tr></thead>"
    result+=" <tbody> "
    data.data.forEach(row=>{
        result+=" <tr> "
        data.show.forEach((colName)=>{
            let style = (ds.getColumn(colName)?.options.style || "")
            let display = ds.getString(row,colName)
            // todo html escape (display)
            // no html escape with "escape = false"
            result+=" <td class='"+style+"'>"+display+"</td>"
        })
        result+=" </tr> "
    })
    result+=" </tbody> </table>"
    return result
}

function li(ds) {
    return table(ds)
}

function div(ds) {
    return div(ds)
}

function argForm(ds,options) {
    // todo hbs variant
    // columnOutputs????
    // or include in displays?
    let data = ds.getData()
    let target = ds.report.getLink({})
    //console.log("target link "+target.toString())
    if (options.argForm.extention)  target.setExtension(options.argForm.extention )
    // set reportName ???
    // console.log("target link "+target.url.href)

    let result = "<div id='dataset_"+data.name+"'" // className
    if (ds.style){ result+= " class='"+ds.style+"'" }
    //result+= ">  <form method='get' >"   // action='.'>"  // action  or js function ???
    result+= ">  <form method='get' action='"+target +"'>"  // action  or js function ???



    let row = ds.getRow(0)  // only 1 row
    data.show.forEach((colName)=> {
        let column = ds.getColumn(colName)
        let value = ds.getValue()
        let display = ds.getString(row.data,colName) // consistency ???
        let formType = column.options.form || "default"
        result += getColumnOutput("form."+formType)(value,display,column,ds)
    })
    // buttons
    result+= "<input type='submit' > "

    result+= "</form></div> "
    return result
}

registerColumnOutput("form.default", function (value,display,column,ds) {
    let result = "<div class='formField" // className
    if (ds.style){ result+= " "+ds.style }
    result+= "'> "
    let columnName = column.name
    if (column.options.header) columnName = column.options.header
    result +="<label >"+columnName+"</label>"
    result +="<input type='text' name='"+column.name+"' value='"+display+"' />"  //input options ...
    result+= "</div> "
    return result
})

