
const dateRegex = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/
// https://stackoverflow.com/questions/3143070/regex-to-match-an-iso-8601-datetime-string/58878432

function objectJSON(obj){
    // custom JSON stringify that keeps Dates as Date object
    // better method?
    let replacer = function(key, value) {
        if (dateRegex.exec(value)){
            return "new Date("+value+")"
        } else {
            return value
        }
    };
    let json = JSON.stringify(obj,replacer,2)
    json = json.replaceAll(/"new Date\((.*)\)"/g , 'new Date("$1")' )
    return json
}


function test(){
    let o = {"name":"Geert",
        age:54,
        "DOB":new Date("1969-06-14"),
        "today":new Date()
    }
    console.log(dateJSON(o))
}

// test()

export {objectJSON}