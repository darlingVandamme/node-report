import Handlebars  from 'handlebars';

const displays = {}
//const dateOptions = {  year: 'numeric', month: "2-digit", day: "2-digit", hour: "2-digit", minute:"2-digit",second:"2-digit"};
const dateOptions = {  dateStyle:"short"};


//  display function to return specific form of data value
// register on global level ? or on engine level?

// register all displays as handlebars helper?

function registerDisplay(name, handler){
    displays[name] = handler
}

// deze options????
function getDisplay(name,options){
    if (!displays[name]) {
        name = "default"
    }
    return displays[name]
}


export {getDisplay, registerDisplay}

// deze options????
registerDisplay("direct", (value, options)=>{return value})
registerDisplay("default", (value, options)=>{
    //// console.log("  Display value of  "+value)
    switch (typeof value){
        case "string":{
            return value // escape???
        }
        case "number":{
            return value // decimal ....
        }
        case "object":{
            if (value instanceof Date){
                return getDisplay("date")(value,options)
            }
            return JSON.stringify(value,options) //???
        }
        default:return value;
    } })

registerDisplay("json", (value, options)=>{
    try{
        return JSON.stringify(value)
    } catch{ (error)=>{
        return "JSON error"
    }}
})

registerDisplay("date", (value, options)=>{
    // options https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#options
    // store date and number formatters in report....
    // long medium short, date, datetime, .... in options
    // client locale!!
    //// console.log("date options "+JSON.stringify(options))
    options = {...dateOptions,...options}
    //// console.log("date options "+JSON.stringify(options))
    const dateTimeFormat = new Intl.DateTimeFormat("en-SE", options);
    return  dateTimeFormat.format(value) // date formatting object  or handle to date displayer
})

registerDisplay("html", (value, options)=> {
    // console.log("Display html "+value)
    return new Handlebars.SafeString(value)
})

registerDisplay("percentage", (value, options)=> {
    // console.log("Display html "+value)
    return (value*100).toFixed(2)+" %"
})

registerDisplay("fixed", (value, options)=> {
    // console.log("Display html "+value)
    return parseFloat(value.toFixed(2))
})
registerDisplay("precision", (value, options)=> {
    // console.log("Display html "+value)
    return (value).toPrecision(2)
})

