import {getDisplay} from "./display.js";
import {getColumn} from "./column.js";
import {accumulator} from "./accumulator.js";

function Dataset(options, report) {
    this.name = options?.name
    this.options = options || {}
    this.report = report
    //this.logger = report.logger
    this.data = []  // rows???
    this.storage = "array" // naamgeving?
                            // array, singleton, aggregate, virtual, join, function? ,
    this.columnList = []
    this.columns =  {}
    this.dependencies = [] // or {} ??
    this.connection = {}
    // this.connectOptions = {}
    // batches?
    console.log("create dataset "+JSON.stringify(options))

    this.readColumns = function(options={}) {
        this.description = options?.description
        // check storage
        let show = options.show || "*"
        if (typeof show == "string"){
            // make array
            this.columnList = show.split(",")
        } else { // array
            this.columnList = show
        }
        this.columnList.forEach((colName) => {
            //// console.log("add column "+colName)
            if (colName && colName != "*" && colName !="") {
                this.addColumn(colName)
                // require ...
            }
        })

        for (let colName in options.columns){
            let opt = options.columns[colName]
            this.addColumn(colName, opt)
        }
    }

    this.rows = ()=>{return this.data.length} //singleton

    this.getType = ()=>{  // table, list, row, card, value  ??  displayType?
        if (this.options.type) {return this.options.type}
        // auto choose
        if (this.data.length == 1){
            // if columns.length == 1  single value
            return 'row'
        } else {
            return 'table'
        }
    }

    this.getPosition = ()=>{return this.options.position || "main"}

    this.getLink = ()=>{
        let link = report.getLink({})
        // report.dataset?
        link.set("report.dataset",this.name)
        // todo relative
        return link.toString()
    }

    this.show = ()=>{  // calculate list of columns
        let list = [...this.columnList]
        // // console.log("show")
        // // console.log("list:"+list)
        list.forEach((colName,index)=>{
            if(colName=="*"){
                let missing = []
                // // console.log("columns:"+JSON.stringify(this.columns))
                missing = Object.keys(this.columns).filter((c)=>{ return !list.includes(c) })
                missing = missing.sort((a,b)=>{
                    //// console.log(a+" col Order "+ this.getColumn(a).options?.order)
                    return (this.getColumn(a).options?.order || 100) - (this.getColumn(b).options?.order || 100)})
                //// console.log("missing:"+[...missing])
                // // console.log("index:"+index)
                list.splice(index,1,...missing)
                // // console.log("list:"+list)
            }
        })
        report.debug(this.name+" columns",list)
        return list
    } // todo hide list?

    // calculate ds dependencies
    this.checkRequire = function(s){
        // better naming? ensureDependencies checkDependencies?
        // todo pattern report or engine dependend??
        const split = "\{\{([\\w\.]*)\}\}"
        let regex = new RegExp(split, "g")  //  regex = /{{([\w.]*)}}/
        let params = [...s.matchAll(regex)]  // capturing groups https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/matchAll
        params.forEach((found) =>{
            //// console.log("checkRequire param "+found)
            let param = found[1] // capturing group
            let pos = param.indexOf(".")
            if (pos>0){
                let ds = param.substr(0,pos)
                let paramName =  param.substr(pos+1,param.length)
                this.report.debug("requireCheck ",JSON.stringify({from:this.name, require:ds, param:paramName}))
                this.require(ds,paramName)
            }
        })
    }

    this.require = function(name,paramName){
        if (Array.isArray(name )){
            name.forEach(s=>{
                this.require(s)
            })
        } else {
            if (!this.dependencies.includes(name)) {
                this.dependencies.push(name)
                this.report.require(name)
                this.report.debug("dependency ",JSON.stringify({from:this.name, require:name, param:paramName}))

                // console.log("start Dependency "+this.name+" waiting on "+name)
            }
            // todo check paramName as required field!
        }
    }

    this.getRow = function(rowNr){
        // todo better polymorphism
        switch(this.storage){
            case "fixed": return this.data[rowNr]
            case "singleton":{
                rowNr = 0
            }
            case "array": {
                if (this.data.length > rowNr ) {
                    return this.data[rowNr]
                } else {
                    // grow???
                    let row = new Row({},this)
                    return row
                }
            }
            // virtual
            // function
            default: return this.data[rowNr]
        }
        /*

        let row
        if (this.data.length > rowNr ) {
            row = this.data[rowNr]
        }
        if (!row){    //empty row
            row = new Row({},this)
        }
        return row
         */
    }

    this.getRows = function(filter){
        if (!filter){
            filter = ()=>true;
        }
        // if singleton ....
        return this.data.filter(filter)
    }

    this.accumulator = function(columns){
        // cache existing
        let acc = new accumulator(columns)
        this.getRows().forEach(
            row=>{
                acc.add(row.getData(columns))
            }
        )
        return acc
    }
    // context  HTML, form, string, object, function ...
    this.getValue = function(key,rowNr){
        // what if length == 0
        // promise or direct?
        if (!rowNr) rowNr = 0
        if (this.data.length < 1){
            //// console.log(" reading empty data (default values???) " + this.name+" "+this.rows()+rowNr)
        }
        let row  = this.getRow(rowNr) // this.data[rowNr]
        // if (!row) ... error
        return row.getValue(key)
    }

    this.getString = function(row,colName){  // context??
        let options = this.getColumn(colName)?.options || {}
        let value = (row.getValue)?row.getValue(colName):row[colName]
        // if Row, getValue....
        //if (options.display){
        let display = options.display || "default"
        // return getDisplay(display,options)(value)
        return getDisplay(display)(value,options)
        //}
        //return value
    }

    // addData??
    this.addRow = function(r){
        for (let c in r){
            this.addColumn(c) // ensureColumn?
        }
        switch(this.storage){
            case "singleton":{
                if (this.data.length == 0){
                    this.data.push(new Row(r,this))
                } else {
                    //todo merge
                    // override or not??
                    // console.log("Merge rows ")
                }
                break;
            }
            case "fixed": {
                this.data.push(new Row(r,this))
                break;
            }
            case "array": {
                this.data.push(new Row(r,this))
                break;
            }
            // virtual
            // function
            default: {}
        }
        // return row??

        /*// what if singleton?
        // check columns
        // add default values?
        for (let c in r){
            this.addColumn(c) // ensureColumn?
        }
        let row = new Row(r,this)
        this.data.push(row)
         */
    }

    this.addColumn = function(colName,options){
        if (this.columns[colName]){
            if (options) {
                //// console.log(this.name+" change Column "+colName+" "+JSON.stringify(options))
                this.columns[colName]=getColumn(colName, (options?.type ||"default"), options)
                // this.columns[colName].options = options
                // merge options?
                // handle column types
            }
        } else {
            if (!options){
                options = {}
            }
            if (!options.order){
                // default column order
                options.order = 100 + (Object.keys(this.columns).length * 10)
            }
            //// console.log(this.name+" add Column "+colName+" "+JSON.stringify(options))
            this.columns[colName]=getColumn(colName, (options?.type ||"default"), options)
        }
    }

    // andere naam? result?  getResult?  context??
    // handlebars helpers?
    this.getData = function(options = {display:false, json:false}){  // filter?
        let result = {name: this.name,
            description:this.description,
            moment : new Date(),
            timestamp : Date.now(),
            loadTime : this.loadTime,
            show:[],
            columns:{},
            position:{ },
            url: this.getLink(),
            options:this.options,
            data:[],
            class : this.options.class

            // display
            // storage??
            // virtual?
            // context?
        }
        result.position[this.getPosition()] = true
        let columnList = this.show()
        columnList.forEach(colName =>{
            result.show.push(colName)
            let columnOptions = this.getColumn(colName).options || {}
            if (!columnOptions.header) columnOptions.header = colName
            columnOptions.name = colName
            result.columns[colName] = columnOptions
        })
        // if include data
        // getrows  filter
        this.getRows().forEach(row=>{
            let rowData = {}
            columnList.forEach((colName)=> {
                let col = this.getColumn(colName)
                rowData[colName] = row.getValue(col)
            })
            result.data.push(rowData)
        })
        if (options.display) {
            result.displayData = []
            this.getRows().forEach((row, i) => {
                let rowData = {}
                columnList.forEach((colName) => {
                    let col = this.getColumn(colName)
                    rowData[colName] = {
                        column: colName,
                        value: row.getValue(col),
                        display: this.getString(row, colName),
                        class: col.options.class,
                        options: col.options
                    }
                })
                result.displayData.push({rowNr: i, data: rowData})
            })
        }
        result.rows = result.data.length
        if (options.json) {
            result.JSONData = JSON.stringify(result)
        }
        return result
    }
    this.getResult = this.getData

    this.render = function(options){
        let hbs = this.report.handlebars
        // set helpers
        // set includes

        // lookup  template (cache)
        // read template + compile
        // render
        // return promise

    }

    this.getColumn = function(name){
        return  this.columns[name] // this.columns.find((col)=>{ return col.name==name})
    }

    /*
    {
    name
    timestamp
    columns : []  {}
    columnOptions {}
    data : [{}.{}.{}]

    }

     */
    this.readColumns(this.options)


    this.init = function(){}  // to be overwritten by channels
    this.load = function(){}  // to be overwritten by channels

}

function Row(data,dataset){
    this.data = data
    // todo translate incoming data to datatype depending on column?
    // this.values = data ???
    this.dataset = dataset
    this.rowNr

    if(dataset){
        this.rowNr = dataset.rows()
    }
    // cache?
    // original data

    // rowNr
    // link to dataset (&report)
    // link to column

    this.getData = function(columns){ // get data object with all column values for this row
        // cache?
        // show columns, columnList
        let data  = {}
        if (!columns){
            columns = Object.keys(this.dataset.columns)
        }
        columns.forEach(colName=>{
            let col = this.dataset.getColumn(colName)
            data[colName]=this.getValue(col)
        })
        return data
    }

    this.getValue = function(column){
        let colName
        if (typeof column == "string"){
            colName = column
            column = dataset.getColumn(column)
        }
        if (column){
            colName = column.name
            return column.getValue(this.data)
        } else {
            // error column not found
            //console.error("column not found "+colName)
            return null
        }
    }

    /*
    this.getString = function(key){
        // find column
        // find formatter
        return String(data[key])
    }
*/
}



export {Dataset}
