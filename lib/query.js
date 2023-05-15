import path from "path"
import fs from "fs/promises"

class Query{

    /*
    Conditions:
    // else ?
    available:"key"
    available:{"key1","key2"}
    function:
    array:
    parseInt:
    date:

    either:??
    neither:?
    and construction
    or constructions
     */

    constructor(definition, report, options) {
        this.report = report
        this.definition = definition // array
        this.options = options

        if (typeof this.definition == "string") {
            this.definition = [this.definition] //wrap in array
        }
        if ((typeof this.definition == "object") && (!Array.isArray(this.definition))){
            this.definition =  [this.definition] // object, wrap in array
        }
        this.queryPath = "";
        if (report) this.queryPath = report.path // or options....
        this.separator =  " " //"\n"
        this.replacer = replacerPrepared

        const pattern = "\{\{([\\w\.]*)\}\}"
        this.regex = new RegExp(pattern, "g")  //  regex = /{{([\w.]*)}}/

    }

    init(){
        const p = []
        this.definition = this.definition.map((part)=>{
            if (typeof part == "string"){
                return { type : "string", query: part }
            } else {
                if (part.file){
                    return {
                        type: "file",
                        file:part.file
                    }
                } else {
                    // check if query
                    if (!part.type){
                        part.type = "string"
                    }
                    return part
                }
            }
        })
        // load files
        console.log(JSON.stringify(this.definition))
        this.definition.forEach((part)=> {
            if (part.type == "file"){
                let fileName = path.join(this.queryPath, part.file)
                // todo secure filename
                console.log("read query from file " + fileName)
                p.push(fs.readFile(fileName)
                        .then(bytes => {
                            part.query = new String(bytes)
                            // console.log("add new Query "+part.query)
                            return part.query
                        })
                )
            }
        })
        return Promise.all(p)
    }

    checkRequire(ds){
        return this.definition.forEach((part)=>{
            if (part.query) ds.checkRequire(part.query)
            if(part.else) ds.checkRequire(part.else)
        })
    }

    build(){
        this.queryString = this.definition.reduce((acc , val)=>{ return acc+val.query + this.separator},"")
        this.replaceParams()
    }

    replaceParams(  ){
        // how to handle multiple columns ??  Only first? Several batches?
        let params = {}
        let paramsOrdered = []

        if (!this.replacer) {
            this.replacer = (paramName,value,index) => { return value }
            // replacer = (paramName,value,index) => { return "@"+paramName+" " } // bigquery
            // replacer = (paramName,value,index) => { return " ? " } // sql
            // replacer = (paramName,value,index) => { return quote(value) } // quotes
        }
        let counter = 0

        let replaced = this.queryString.replaceAll(this.regex, (v, paramName) => {
            let ds = "query" // ????  default args
            let pos = paramName.indexOf(".")
            if (pos>0){
                ds = paramName.substr(0,pos)
                paramName =  paramName.substr(pos+1,paramName.length)
            }
            //  console.log(" get Value "+ds+ " / "+paramName)
            let value = this.report.getValue(ds,paramName) //,0
            //console.log(" get Value "+ds+ " / "+paramName+"  val:"+value)
            //console.log(" get Value "+this.getDataset("paging").rows())
            // check required fields?
            // check multiple values ???

            params[paramName] = value
            paramsOrdered.push(value)

            return this.replacer(paramName,value,counter++)
        })

        this.replaced = replaced
        this.params = params
        this.ordered = paramsOrdered

        return {
            replaced:replaced,
            params:params,
            ordered:paramsOrdered,
            // replaced : replaced
        }

    }

}


let replacerPrepared = (paramName,value,index) => { return " ? " }
let replacerQuote = (paramName,value,index) => { return "'"+value+"'" }
let replacer = (paramName,value,index) => { return value }


async function test() {
    const testQuery1 = "select * from files "
    const testQuery2 = ["select * ",
                        "from files "]
    const testQuery3 = ["select * ",
        {type:"string", query:"from files "}]

    const testQuery4 = [{file:"test.sql"}]
    const testQuery5 = [{file:"test.sql"},
        " where ",
        " status = 1"]

    // condition
    const testQuery6 = [{file:"test.sql"},
        " where ",
        "  status = 1 ",
        { required :"name",
          query:" and lastName = {{name}}",
          else: ""
        }   ]

    const testQuery7 = [{file:"test.sql"}, //???
        " where ",
        "  status = 1 ",
        [{
            "and":
                {
                    required: "name",
                    query: " and lastName = {{name}}",
                    else: ""
                }
            },
            {
                required: "date",
                query: " and lastName = {{name}}",
                else: ""
            }
            ]
        ]


    let q = new Query(testQuery6  , {getReportPath: () => "/home/geert/projects/node-report/runtime/test"})
    await q.init()
    console.log(q.build())
}
// test()

export {Query}