
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
    this.getValue = function(data){
        let result ;
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

    this.getValue = function(data){
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
    this.getValue = function(data){
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

        this.getValue = function(data){
            let result = this.format.replaceAll(this.regex, (v, paramName) => {
                return data[paramName]
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
        this.formatter = this.hbs.formatter(this.format)
    }

    this.getValue = function(data){
        //let result = this.hbs.format(this.format,data)
        let result = this.formatter(data)
        return result
    }
})

registerColumn("link" , function (name,options){
    this.name = name
    this.options = options || {}
    // setValue???

    this.init = function(ds,report){
        this.link = report.getLink() // options??
    }

    this.getValue = function(data){
        // console.log("get value format column "+this.link)
        this.link.setReportName("ander")
        return this.link.toString()
    }
})
/*registerColumn("function" , function (name,options){
    let f = options.function
    // read from file   => promise in init?
    let script = new vm.Script(f)
    return (row) => {
        let context = {
            options: options,
            row: row.data
        } // dataset & report
        vm.createContext(context)
        return script.runInContext(context)
    }
}
*/