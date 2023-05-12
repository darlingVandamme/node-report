import {getDisplay} from "./display.js";
import {getColumn} from "./column.js";
import {Accumulator} from "./accumulator.js";
import * as utils from "./utils.js";

class Dataset {
    constructor(options, report) {
        this.name = options?.name
        this.options = options || {}
        this.report = report
        //this.logger = report.logger
        this.data = []  // rows???
        this.storage = "array" // naamgeving?
        // array, singleton, aggregate, virtual, join, function? ,
        this.columnList = []
        this.columns = {}
        this.dependencies = [] // or {} ??
        this.connection = {}
        // this.connectOptions = {}
        // batches?
        console.log("create dataset " + JSON.stringify(options))

        this.getResult = this.getData

        this.readColumns(this.options)


        this.init = function () {
        }  // to be overwritten by channels
        this.load = function () {
        }  // to be overwritten by channels

    }

    readColumns(options = {}) {
            this.description = options?.description
            // check storage
            let show = options.show || "*"
            if (typeof show == "string") {
                // make array
                this.columnList = show.split(",")
            } else { // array
                this.columnList = show
            }
            this.columnList.forEach((colName) => {
                //// console.log("add column "+colName)
                if (colName && colName != "*" && colName != "") {
                    this.addColumn(colName)
                    // require ...
                }
            })

            for (let colName in options.columns) {
                let opt = options.columns[colName]
                this.addColumn(colName, opt)
            }
        }

    rows(){
        return this.data.length
    } //singleton

     getType(){  // table, list, row, card, value  ??  displayType?
            if (this.options.type) {
                return this.options.type
            }
            // auto choose
            if (this.data.length == 1) {
                // if columns.length == 1  single value
                return 'row'
            } else {
                return 'table'
            }
        }

      getPosition (){
            return this.options.position || "main"
      }

      getLink(){
            let link = this.report.getLink({})
            // report.dataset?
            link.set("report.dataset", this.name)
            return link.relative()
        }

      show(){  // calculate list of columns
            let list = [...this.columnList]
            // // console.log("show")
            // console.log("list:"+list)
            list.forEach((colName, index) => {
                if (colName == "*") {
                    let missing = []
                    // // console.log("columns:"+JSON.stringify(this.columns))
                    missing = Object.keys(this.columns).filter((c) => {
                        return !list.includes(c)
                    })
                    missing = missing.sort((a, b) => {
                        //// console.log(a+" col Order "+ this.getColumn(a).options?.order)
                        return (this.getColumn(a).options?.order || 100) - (this.getColumn(b).options?.order || 100)
                    })
                    //// console.log("missing:"+[...missing])
                    // // console.log("index:"+index)
                    list.splice(index, 1, ...missing)
                    // // console.log("list:"+list)
                }
            })
            this.report.debug(this.name + " columns", list)
            return list
        } // todo hide list?

        // calculate ds dependencies
      checkRequire(s) {
            // better naming? ensureDependencies checkDependencies?
            // todo pattern report or engine dependend??
            const split = "\{\{([\\w\.]*)\}\}"
            let regex = new RegExp(split, "g")  //  regex = /{{([\w.]*)}}/
            let params = [...s.matchAll(regex)]  // capturing groups https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/matchAll
            params.forEach((found) => {
                //// console.log("checkRequire param "+found)
                let param = found[1] // capturing group
                let pos = param.indexOf(".")
                if (pos > 0) {
                    let ds = param.substr(0, pos)
                    let paramName = param.substr(pos + 1, param.length)
                    this.report.debug("requireCheck ", JSON.stringify({from: this.name, require: ds, param: paramName}))
                    this.require(ds, paramName)
                }
            })
        }

     require(name, paramName) {
            if (Array.isArray(name)) {
                name.forEach(s => {
                    this.require(s)
                })
            } else {
                if (!this.dependencies.includes(name)) {
                    this.dependencies.push(name)
                    this.report.require(name)
                    this.report.debug("dependency ", JSON.stringify({from: this.name, require: name, param: paramName}))

                    // console.log("start Dependency "+this.name+" waiting on "+name)
                }
                // todo check paramName as required field!
            }
        }

     getRow(rowNr) {
            // todo better polymorphism
            switch (this.storage) {
                case "fixed":
                    return this.data[rowNr]
                case "singleton": {
                    rowNr = 0
                }
                case "array": {
                    if (this.data.length > rowNr) {
                        return this.data[rowNr]
                    } else {
                        // grow???
                        let row = new Row({}, this)
                        return row
                    }
                }
                // virtual
                // function
                default:
                    return this.data[rowNr]
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

     getRows(filter) {
            if (!filter) {
                filter = () => true;
            }
            // if singleton ....
            return this.data.filter(filter)
        }

     accumulator(columns) {
            // cache existing
            let acc = new Accumulator(columns)
            this.getRows().forEach(
                row => {
                    acc.add(row.getData(columns))
                }
            )
            return acc
        }
        // context  HTML, form, string, object, function ...
     getValue(key, rowNr) {
            // what if length == 0
            // promise or direct?
            if (!rowNr) rowNr = 0
            if (this.data.length < 1) {
                //// console.log(" reading empty data (default values???) " + this.name+" "+this.rows()+rowNr)
            }
            let row = this.getRow(rowNr) // this.data[rowNr]
            // if (!row) ... error
            return row.getValue(key)
        }

     getString(row, colName) {  // context??
            let options = this.getColumn(colName)?.options || {}
            let value = (row.getValue(colName)) // ?row.getValue(colName):row[colName]
            // if Row, getValue....
            //if (options.display){
            let display = options.display || "default"
            // return getDisplay(display,options)(value)
            return getDisplay(display)(value, options)
            //}
            //return value
        }

    getDisplay(row, column) {
        // if row == number ..
        row.getDisplay(column)
    }

        // addData??
      addRow(r) {
            for (let c in r) {
                this.addColumn(c) // ensureColumn?
            }
            switch (this.storage) {
                case "singleton": {
                    if (this.data.length == 0) {
                        this.data.push(new Row(r, this))
                    } else {
                        //todo merge
                        // override or not??
                        // console.log("Merge rows ")
                    }
                    break;
                }
                case "fixed": {
                    this.data.push(new Row(r, this))
                    break;
                }
                case "array": {
                    this.data.push(new Row(r, this))
                    break;
                }
                // virtual
                // function
                default: {
                }
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

      addColumn(colName, options) {
            if (this.columns[colName]) {
                if (options) {
                    //// console.log(this.name+" change Column "+colName+" "+JSON.stringify(options))
                    this.columns[colName] = getColumn(colName, (options?.type || "default"), options)
                    // this.columns[colName].options = options
                    // merge options?
                    // handle column types
                }
            } else {
                if (!options) {
                    options = {}
                }
                if (!options.order) {
                    // default column order
                    options.order = 100 + (Object.keys(this.columns).length * 10)
                }
                //// console.log(this.name+" add Column "+colName+" "+JSON.stringify(options))
                this.columns[colName] = getColumn(colName, (options?.type || "default"), options)
            }
        }

        // andere naam? result?  getResult?  context??
        // handlebars helpers?
      getData(options = {display: false, json: false, html:false}) {  // filter?
            let result = {
                name: this.name,
                description: this.description,
                moment: new Date(),
                timestamp: Date.now(),
                loadTime: this.loadTime,
                show: [],
                columns: {},
                position: {},
                url: this.getLink(),
                options: this.options,
                data: [],
                class: this.options.class

                // display
                // storage??
                // virtual?
                // context?
            }
            if (!this.options.position) {this.options.position="main"}
            result.position[this.getPosition()] = true
            let columnList = this.show()
            columnList.forEach(colName => {
                let col = this.getColumn(colName)
                if (!col.options.hidden) {
                    result.show.push(colName)
                    let columnOptions = this.getColumn(colName).options || {}
                    if (!columnOptions.header) columnOptions.header = colName
                    columnOptions.name = colName
                    result.columns[colName] = columnOptions
                }
            })
            // if include data
            // getrows  filter
            this.getRows().forEach(row => {
                let rowData = {}
                columnList.forEach((colName) => {
                    let col = this.getColumn(colName)
                    rowData[colName] = row.getValue(col)
                })
                result.data.push(rowData)
            })
            if (options.display) {
                //console.log(" show DisplayData ")
                result.displayData = []
                this.getRows().forEach((row, i) => {
                    let rowData = {}
                    columnList.forEach((colName) => {
                        let col = this.getColumn(colName)
                        // todo  isHidden function?
                        if (!col.options.hidden) {
                            rowData[colName] = {
                                rownr: i,
                                column: colName,
                                value: row.getValue(col),
                                display: this.getString(row, colName),
                                class: col.options.class,
                                options: col.options
                            }
                        }
                    })
                    result.displayData.push({rowNr: i, data: rowData})
                })
            }
            result.rows = result.data.length
            if (options.json) {
                // result.JSONData = JSON.stringify(result)
                result.JSONData = utils.objectJSON(result)
            }
            if (options.html) {

               result.html = this.html
            }
            return result
        }


      render(options) {
            let hbs = this.report.handlebars
            // set helpers
            // set includes

            // lookup  template (cache)
            // read template + compile
            // render
            // return promise

        }

        getColumn(name) {
            return this.columns[name] // this.columns.find((col)=>{ return col.name==name})
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
        setHtml(html){
            this.html = html

        }

}

class Row {
    constructor(data, dataset) {
        this.data = data
        // todo translate incoming data to datatype depending on column?
        // this.values = data ???
        this.dataset = dataset
        this.rowNr

        if (dataset) {
            this.rowNr = dataset.rows()
        }
        // cache?
        // original data

        // rowNr
        // link to dataset (&report)
        // link to column
    }

    getData(columns) { // get data object with all column values for this row
            // cache?
            // show columns, columnList
            let data = {}
            if (!columns || columns == "all") {
                columns = Object.keys(this.dataset.columns)
            }
            if (columns == "raw") {
                return this.data
            }
            columns.forEach(colName => {
                let col = this.dataset.getColumn(colName)
                data[colName] = this.getValue(col)
            })
            return data
        }

     getRawValue(column) {
            if (column.name) column = column.name
            return this.data[column]
        }

     getValue(column) {
            let colName
            if (typeof column == "string") {
                colName = column
                column = this.dataset.getColumn(column)
            }
            if (column) {
                colName = column.name
                // return column.getValue(this.data)
                // column.getValue based on  Row instead of Row.data
                return column.getValue(this, column.name)
            } else {
                // error column not found
                //console.error("column not found "+colName)
                return null
            }
        }

    getDisplay(column) {
            if (typeof column == "string") {
                column = this.dataset.getColumn(column)
            }
            let options = column.options || {}
            let value = this.getValue(column) // ?row.getValue(colName):row[colName]
            let display = options.display || "default"
            // return getDisplay(display,options)(value)
            return getDisplay(display)(value, options)
        }

        /*
        this.getString = function(key)
            // find column
            // find formatter
            return String(data[key])
        }
        */
}


export {Dataset}
