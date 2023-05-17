import path from "path"
import fs from "fs/promises"

class Query{

    /*
    Conditions:
    // else ?
    available:"key"
    available:["key1","key2"]
    function:
    array:
    parseInt:
    date:

    either:??
    neither:?
    and construction
    or constructions

    nested conditions??
     */

    constructor(definition,  options) {
        /*
        options:
            - path
            - replacer (name or function)
         */
        this.definition = definition // array
        this.options = options

        if (typeof this.definition == "string") {
            this.definition = [this.definition] //wrap in array
        }
        if ((typeof this.definition == "object") && (!Array.isArray(this.definition))){
            this.definition =  [this.definition] // object, wrap in array
        }
        this.queryPath = options.path; // path functions

        this.separator =  " " //"\n"
        this.replacer = replacers[options.replacer] // function ?

        const pattern = "\{\{([\\w\.]*)\}\}"
        this.regex = new RegExp(pattern, "g")  //  regex = /{{([\w.]*)}}/
    }

    add(part){
        this.definition.push(part)
    }

    init(){
        const p = []
        this.definition = this.definition.map((part)=>{
            if (typeof part == "string"){
                return { type : "string", query: part , condition:"default"}
            } else {
                if (part.file){
                    part.type = "file"
                    return part
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
        // console.log(JSON.stringify(this.definition))
        this.definition.forEach((part)=> {
            if (part.type == "file"){
                let fileName = path.join(this.queryPath, part.file)
                // todo secure filename
                // todo nested parts
                console.log("read query from file " + fileName)
                p.push(fs.readFile(fileName , "utf8")
                        .then(content => {
                            part.query = content
                            // console.log("file query " + content)
                            return part.query
                        })
                )
            }
        })
        return Promise.all(p)
    }

    strings(){
        let acc = []
        this.definition.forEach((part) => {
            checkString(part.query)
            checkString(part.else)
        })
        // nested parts
        function checkString(s){
            if (s) {
                /*if (Array.isArray(s)) {
                    acc.push(s.join())
                }*/
                if (typeof s == "string") {
                    acc.push(s)
                } else if (typeof s == "object") {
                    checkString(s.query)
                    checkString(s.else)
                }
            }
        }
        return acc
    }

    build(context){
        let queryString = ""
        this.definition.forEach((part) =>{
            let conditionName = part.condition || "default"
            let result = conditions[conditionName](part,context)
            // nested parts
            while(typeof result == "object"){
                conditionName = result.condition || "default"
                result = conditions[conditionName](result,context)
            }
            queryString += result
        })
        this.queryString = queryString
        //this.queryString = this.definition.reduce((acc , val)=>{ return acc+val.query + this.separator},"")
        this.replaceParams(context)
    }

    replaceParams( context ){
        // how to handle multiple columns ??  Only first? Several batches?
        let params = {}
        let paramsOrdered = []

        if (!this.replacer) {
            this.replacer = replacers.value
        }
        let counter = 0

        let replaced = this.queryString.replaceAll(this.regex, (v, paramName) => {
            let value = context.getValue(paramName) //,0
            params[paramName] = value
            paramsOrdered.push(value)
            return this.replacer(paramName,value,counter++)
        })

        this.query = replaced
        this.params = params
        this.ordered = paramsOrdered

        return {
            query:replaced,
            params:params,
            ordered:paramsOrdered,
            // replaced : replaced
        }
    }

    // create object ..

}


const replacers = {
    prepared: (paramName, value, index) => {
        return " ? "
    },
    quote: (paramName, value, index) => {
        return "'" + value + "'"
    },
    value: (paramName, value, index) => {
        return value
    }
}

const conditions = {
    "default": (part, context)=> { return part.query },
    "available": (part, context)=> {if (Array.isArray(part.key)){
        if(part.key.every((key) => context.getValue(key))){ return part.query } else {return (part.else || "")}
    } else {
        if(context.getValue(part.key)){ return part.query } else {return (part.else || "")}
    } },
    "equal": (part, context)=> {if(context.getValue(part.key) == part.value){ return part.query } else {return (part.else || "")} },
    "array": (part, context)=> {if(Array.isArray(context.getValue(part.key))){ return part.query } else {return (part.else || "")} }

}



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

    // condition available
    const testQuery6 = [{file:"test.sql"},
        " where ",
        "  status = 1 ",
        { condition:"available",
          key :"name",
          query:" and lastName = {{name}}",
          else: " and lastname = ''"
        }   ]

    //condition equal
    const testQuery7 = [{file:"test.sql"},
        " where ",
        "  status = 1 ",
        { condition:"equal",
            key :"name", value:"Geert",
            query:" and lastName = {{name}}",
            else: " and lastname = ''"
        }   ]

    //condition nested
    const testQuery8 = [{file:"test.sql"},
        " where ",
        "  status = 1 ",
        { condition:"available", key :"name",
            query:" and lastName = {{name}}",
            else: { condition:"available", key :"test",
                query:" and lastName = 'test' ",
                else: " and 1=0 "
            }
        }   ]

    /*    const testQuery7 = [{file:"test.sql"}, //???
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
    */

    const obj={
        test:"test",
        level:5
    }
    const context  = {
        getValue : (key)=> obj[key]
    }

    let q = new Query(testQuery8  , {path:  "/home/geert/projects/node-report/runtime/test",
                                            replacer: "quote"})

    await q.init()
    console.log(" strings " + q.strings())
    console.log(q.definition)

    q.build(context)
    console.log(q.query )
    console.log(q.params )
    console.log(q.ordered )
}

// test()

export {Query}