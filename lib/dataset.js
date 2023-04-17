import {getDisplay} from "./display.js";
import {getColumn} from "./column.js";


function Dataset(options, report) {
    this.name = options?.name
    this.options = options || {}
    this.report = report
    //this.logger = report.logger
    this.data = []  // rows???
    this.columnList = []
    this.columns =  {}
    this.dependencies = [] // or {} ??
    // this.connectOptions = {}

    // singleton
// batches?

    this.readColumns = function(options={}) {
        this.description = options?.description

        let show = options.show || "*"
        if (typeof show == "string"){
                    // make array
            this.columnList = show.split(",")
        } else { // array
            this.columnList = show
        }
        this.columnList.forEach((colName) => {
            //console.log("add column "+colName)
            if (colName && colName != "*" && colName !="") {
                this.addColumn(colName)
            }
        })

        for (let colName in options.columns){
            let opt = options.columns[colName]
            this.addColumn(colName, opt)
        }
    }

    this.rows = ()=>{return this.data.length} //singleton

    this.getType = ()=>{  // table, list, row, card, value  ??
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
        link.set("dataset",this.name)
        // todo relative
        return link.toString()
    }

    this.show = ()=>{  // calculate list of columns
        let list = [...this.columnList]
        // console.log("show")
        // console.log("list:"+list)
        list.forEach((colName,index)=>{
            if(colName=="*"){
                let missing = []
                // console.log("columns:"+JSON.stringify(this.columns))
                missing = Object.keys(this.columns).filter((c)=>{ return !list.includes(c) })
                missing = missing.sort((a,b)=>{
                    //console.log(a+" col Order "+ this.getColumn(a).options?.order)
                    return (this.getColumn(a).options?.order || 100) - (this.getColumn(b).options?.order || 100)})
                //console.log("missing:"+[...missing])
                // console.log("index:"+index)
                list.splice(index,1,...missing)
                // console.log("list:"+list)
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
            //console.log("checkRequire param "+found)
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
            source.forEach(s=>{
                this.require(s)
            })
        } else {
            if (!this.dependencies.includes(name)) {
                this.dependencies.push(name)
                this.report.require(name)
                // console.log("start Dependency "+this.name+" waiting on "+name)
            }
            // todo check paramName as required field!
        }
    }

    this.getRow = function(rowNr){
        let row
        if (this.data.length > rowNr ) {
            row = this.data[rowNr]
        }
        if (!row){    //empty row
            row = new Row({},this)
        }
        return row
    }

    this.getValue = function(key,rowNr){
        // what if length == 0
        // promise or direct?
        if (this.data.length < 1){
            //console.log(" reading empty data (default values???) " + this.name+" "+this.rows()+rowNr)
        }
        let row // = this.getRow(rowNr)
        if (rowNr){
            row =  this.getRow(rowNr) // this.data[rowNr]
        } else {
            row = this.getRow(this.data.length-1) // this.data[this.data.length-1]
        }
        return row.getValue(key)
    }

    this.getString = function(row,colName){
        let options = this.getColumn(colName).options || {}
        let value = row[colName] // if Row, getValue....
        //if (options.display){
        let display = options.display || "default"
        // return getDisplay(display,options)(value)
        return getDisplay(display)(value,options)

        //}
        //return value
    }

    // addData??
    this.addRow = function(r){
        // what if singleton?
        // check columns
        // add default values?
        for (let c in r){
            this.addColumn(c) // ensureColumn?
        }
        let row = new Row(r,this)
        this.data.push(row)
    }

    this.addColumn = function(colName,options){
        if (this.columns[colName]){
            if (options) {
                //console.log(this.name+" change Column "+colName+" "+JSON.stringify(options))
                this.columns[colName]=getColumn(colName, (options?.type ||"default"), options)
                // this.columns[colName].options = options
                // merge options?
                // handle column types
            }
        } else {
            //console.log(this.name+" add Column "+colName+" "+JSON.stringify(options))
            this.columns[colName]=getColumn(colName, (options?.type ||"default"), options)
        }
    }

    // andere naam? result?
    this.getData = function(){  // filter?
        let result = {name: this.name,
            description:this.description,
            moment : new Date(),
            timestamp : Date.now(),
            loadTime : this.loadTime,
            rows: this.rows(),
            show:[],
            columns:{},
            data:[]
        }
        // recalculate columnlist?
        let columnList = this.show()
        columnList.forEach(colName =>{
            result.show.push(colName)
            result.columns[colName] = this.getColumn(colName)?.options // limit options??
        })
        this.data.forEach(row=>{
            let r = {}
            columnList.forEach((colName)=> {
                let col = this.getColumn(colName)
                r[colName] = row.getValue(col)
            })
            result.data.push(r)
        })
        return result
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


