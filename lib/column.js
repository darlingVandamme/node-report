import Handlebars  from 'handlebars';
import vm from 'node:vm'

const column = {}

function registerColumn(name, handler){
    column[name] = handler
}

function getColumn(name, type, options){
    let handler = column[type]
    if (!handler){
        handler = column["default"]
    }
    return new handler(name,options)
}


export {getColumn, registerColumn}


registerColumn("default" , function (name,options){
    this.name = name
    this.defaultValue = options?.default
    this.options = options || {}
    // setValue???
    // init
    this.init = function(ds,report){
        //// console.log("init column "+ds.name+" "+name)
    }
    this.getValue = function(row,colName){
        let result ;
        let data = row.getData("raw")  //
        if (data){
            result = data[this.name]
            //// console.log("get Column value "+this.name+" "+result)
        }
        // todo defaultValue
        if (result == null){
            result = this.defaultValue
        }  // undefined?
        return result //|| this.defaultValue
    }
})

registerColumn("copy" , function (name,options){
    this.name = name
    this.defaultValue = options?.default
    this.options = options || {}
    this.source = options.source
    this.sourceColumn = options.sourceColumn
    this.sourceDataset
    // setValue???
    this.init = function(ds,report){
        if (ds.source) { // copy from another dataset
            ds.require(this.source)
            this.sourceDataset = report.getDataset(this.source)
        }
        // console.log("init copy column "+ds.name+" "+this.sourceDataset.name)
    }

    this.getValue = function(row,colName){
        let data = row.getData("raw")
        let result
        if (this.sourceDataset){
            result = this.sourceDataset.getValue(this.sourceColumn); // which row?????
        } else {
            result = data[this.sourceColumn];
            // second order copy???
        }
        // console.log("copy column getValue "+this.name+" "+this.source+" "+result)
        return result || this.defaultValue
    }
})

registerColumn("parseInt" , function (name,options){
    this.name = name
    this.defaultValue = options?.default
    this.options = options || {}
    this.source = options.source
    this.sourceColumn = options.sourceColumn
    this.sourceDataset
    // setValue???
    this.init = function(ds,report){
        if (this.source) {
            ds.require(this.source)
            this.sourceDataset = report.getDataset(this.source)
        }
        //// console.log("init copy column "+ds.name+" "+this.sourceDataset.name)
    }
    this.getValue = function(row,colName){
        let data = row.getData("raw")
        let result
        if (this.source) {
            result = this.sourceDataset.getValue(this.sourceColumn);
        } else {
            if (data){
                result = data[this.name]
            }
        }
        if (!result){result = this.defaultValue}
        //if (typeof result == 'string'){
            result = parseInt(result)
        //}
        return result
    }
})

registerColumn("format" , function (name,options){
        this.name = name
        this.defaultValue = options?.default
        this.options = options || {}
        this.format = options.format
        // setValue???
        this.init = function(ds,report){
            // ds.require ??
            // console.log("init format column "+this.format)
            const split = "\{\{([\\w\.]*)\}\}"
            this.regex = new RegExp(split, "g")  //  regex = /{{([\w.]*)}}/
        }

        this.getValue = function(row,colName){
            let result = this.format.replaceAll(this.regex, (v, paramName) => {
                // choose with option??
                // return row.getValue(paramName)
                if (paramName == colName){
                    return row.getRawValue(paramName)
                } else {
                    return row.getDisplay(paramName)
                }
            })
            // console.log("get value format column "+this.format+" "+result)
            if (!result){result = this.defaultValue}
            return result
        }
})

registerColumn("hbs" , function (name,options){
    this.name = name
    this.defaultValue = options?.default
    this.options = options || {}
    this.format = options.format

    this.init = function(ds,report){
        this.hbs = report.hbs
        // add helpers
        this.formatter = this.hbs.formatter(this.format)
    }

    this.getValue = function(row,colName){
        //let result = this.hbs.format(this.format,data)
        let data = row.getData("raw")
        let result = this.formatter(data)
        return result
        // return new Handlebars.SafeString(result)
    }
})

registerColumn("link" , function (name,options){
    this.name = name
    this.options = options || {}
    // setValue???

    this.init = function(ds,report){
        this.link = report.getLink() // options??
    }

    this.getValue = function(row,colName){
        // console.log("get value format column "+this.link)
        // todo  return object
        /* { link:
             display...
        }
         */

        if (this.options.relative){
            return this.link.relative()
        } else {
            return this.link.toString()
        }
    }
})

registerColumn("rank" , function (name,options) {
    this.name = name
    this.options = options || {}
    this.reference = this.options.reference
    this.init = function (ds, report) {
        this.ds = ds
    }
    this.getValue = function(row,colName){
         // console.log("get value Rank column "+data)
        let data = row.getData("raw")
        if (!this.acc) {
            this.acc = this.ds.accumulator([this.reference])
        }
        return this.acc.rank(this.reference, data[this.reference])
    }
})

registerColumn("maxPercentage" , function (name,options) {
    this.name = name
    this.options = options || {}
    this.reference = this.options.reference
    this.init = function (ds, report) {
        if (!this.options.display){
            this.options.display = "percentage"
        }
        this.ds = ds
    }
    this.getValue = function(row,colName){
        // console.log("get value Rank column "+data)
        let value= row.getValue(this.reference)
        if (!this.acc) {
            this.acc = this.ds.accumulator([this.reference])
        }
        return (value/ this.acc.max(this.reference))
    }
})

registerColumn("totalPercentage" , function (name,options) {
    this.name = name
    this.options = options || {}
    this.reference = this.options.reference
    this.init = function (ds, report) {
        if (!this.options.display){
            this.options.display = "percentage"
        }
        this.ds = ds
    }
    this.getValue = function(row,colName){
        // console.log("get value Rank column "+data)
        let value= row.getValue(this.reference)
        if (!this.acc) {
            this.acc = this.ds.accumulator([this.reference])
        }
        return (value/ this.acc.sum(this.reference))
    }
})

registerColumn("rowNr" , function (name,options) {
    this.name = name
    this.options = options || {}
    this.init = function (ds, report) {

    }
    this.getValue = function(row,colName){
        let offset =  this.options.offset || 0
        // offset in paging ???
        return row.rowNr + offset
    }
})

registerColumn("function" , function (name,options){
    this.name = name
    this.options = options || {}
    this.f = options.function
    // read from file   => promise in init?
    // array
    this.init = function(ds,report){
        this.ds = ds
        this.report = report
        this.script = new vm.Script(this.f)
    }
    this.getValue = function(row,colName) {
        let context = {
            options: this.options,
            row : row,
            data : row.getData("raw"),
            dataset:this.ds,
            report:this.report
            // ds, report
        }
        vm.createContext(context)
        return this.script.runInContext(context)
    }
}
)
