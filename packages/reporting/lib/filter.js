
// fixed values?
// Script execute?

class Filter{

    constructor(options){
        // cleanup
        if (options.equals){
            if (typeof options.equals == "string"){
                let p = options.equals
                options.equals = {
                    "source":[p],
                    "target":[p]
                }
            }
            if (Array.isArray(options.equals )){
                let p = options.equals
                options.equals = {
                    "source":p,
                    "target":p
                }
            }
            if (!options.equals.target){
                options.equals.target = options.equals.source
            }
        }



        this.options = options
        console.log(this.options)

        /*
        {  "type":"simple",
           "equals":{
                "source":["param1","param2"]
                "target":["param1","param3" ]
            }
        }


        {  "type":"simple",
           "between": {
            "source":"param1",
            "from": "param1",
            "to":"param3"
            }
        }

        {
            "function":" " ???
        }

         */



    }

    getFilter(source){
        const options = this.options
        return function (target) {
            let result = true
            if (options.equals){
                options.equals.source.forEach( (sourceParam,i) =>{
                    //console.log("check "+source[sourceParam]+target[options.equals.target[i]])
                    if (source[sourceParam] != target[options.equals.target[i]]){
                        result = false
                        return false
                    }
                }
                )
            }
            return result
        }
    }

    getFilterCode(source){
        const options = this.options
        let code = " (target) => {  \n"
        code += " let result = true  \n"
        if (options.equals){
            options.equals.source.forEach( (sourceParam,i) =>{
                code += " if ( '"+source[sourceParam]+"' != target['"+ options.equals.target[i]+"'] ) return false  \n"
            }
        )
        }
        code += "return result } \n "
        return code
    }

}


function test(){
    const obj1 = {name:"geert", age:53}
    const obj2 = {name:"geert", age:54}
    const obj3 = {name:"jan", age:13}

    let test1 = new Filter({equals:"name"})
    let f = test1.getFilter(obj1)

    console.log(" obj1 == obj2 "+f(obj2))
    console.log(" obj1 != obj3 "+f(obj3))

    let test2 = new Filter({equals:["age"]})
    f = test2.getFilter(obj1)

    console.log(" obj1 != obj2 "+f(obj2))
    console.log(" obj1 != obj3 "+f(obj3))

    let test3 = new Filter({equals:["age","name"]})
    f = test3.getFilter(obj1)

    console.log(" obj1 != obj2 "+f(obj2))
    console.log(" obj1 != obj3 "+f(obj3))

    console.log(test1.getFilterCode(obj1))
    console.log(test2.getFilterCode(obj1))
    console.log(test3.getFilterCode(obj1))

}
// test()

export {Filter}