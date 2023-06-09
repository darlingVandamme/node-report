
// object to calculate basic statistics

const reducers = {
    sum : {initial:0, red:(acc,val)=>{return acc+val}},
    count : {initial:0, red:(acc,val)=>{return acc+1}},
    min : {initial:Number.MAX_SAFE_INTEGER, red:(acc,val)=>{return Math.min(acc,val)}},
    max : {initial:0, red:(acc,val)=>{return Math.max(acc,val)}},
    
}

class Accumulator{
    values = true // keep info to calculate ordered stats
    cross = true // keep info to calculate cross stats (correlations)
    n = 0
    dims = {}

    constructor(options = {values:true}) {
        this.values =  options.values
        this.cross = options.cross
    }

    get dimensions(){
        return Object.keys(this.dims)
    }

    get(param, dimension){
        if ( ["sum","count","min","max","first","last"].includes(param)) {
            return this[param](dimension)
        }
        /*switch(param){
            case "sum": return this.sum(dimension);break
            case "count": return this.count(dimension);break
            case "min": return this.min(dimension);break
            case "max": return this.max(dimension);break
            case "first": return this.first(dimension);break
            case "last": return this.last(dimension);break

        }*/
    }


    add(data, dimensions ){
        //console.log("add data "+JSON.stringify(data))
        if (!dimensions){
            dimensions = Object.keys(data)
        }
        this.n++
        dimensions.forEach(dimension =>{
            let value = data[dimension]
            if (typeof value == "number"){
                //console.log("add value "+value)
                let dim = this.getDim(dimension)
                dim.sum += value
                dim.n ++
                dim.last = value
                if (dim.n==1){
                    dim.first=value
                }
                dim.ss = dim.ss + value**2

                dim.max = Math.max(value,dim.max)
                dim.min = Math.min(value,dim.min)

                if (this.values){
                    // keep ordered stats
                    dim.sorted=false
                    dim.values.push(value)
                }
                if (this.cross){
                    dimensions.forEach(otherDimension => {
                        dim.cross[otherDimension] = (dim.cross[otherDimension] || 0 )+ value * data[otherDimension]
                    })
                }
            }
            if (typeof value == "string"){
                // if (this.options.alfa)
                let dim = this.getDim(dimension)
                // concat? dim.sum += value
                dim.n ++
                dim.last = value
                if (dim.n==1){
                    dim.first=value
                }

            }
            // date ???
        })
    }

    getValues(dimension){
        if (this.values){
            let dim = this.getDim(dimension)
            if (dim.sorted){
                return dim.values
            } else {
                dim.sorted = true
                //console.log("sort "+dimension)
                return dim.values.sort((a, b) => (a - b))
            }
        }
    }

    median(dimension){
        let v = this.getValues(dimension)
        let mid = Math.floor(v.length / 2)
        //console.log("mid "+mid + " "+(v.length % 2))
        if (v.length % 2){
            return (v[mid])
        } else {
            //console.log("avg "+v[mid] + " "+v[mid-1])
            return ((v[mid] + v[mid-1])/2)
        }

    }

    getDim(dimension) {
        let dim = this.dims[dimension]
        if (!dim) {
            dim = {
                n: 0,
                sum: 0.0,
                ss:   0.0,
                first: 0,
                last: 0,
                min:Number.MAX_SAFE_INTEGER,
                max:Number.MIN_SAFE_INTEGER,
                values:[],
                cross:{}
            }
            this.dims[dimension] = dim
        }
        return dim
    }

    average(dimension) {
        let dim = this.getDim(dimension)
        return (dim.sum/dim.n)
    }

    variance(dimension){
        let dim = this.getDim(dimension)
        // return ((dim.ss/dim.n) - ((dim.sum/dim.n)**2))  varP
        console.log("variance "+dimension+" "+dim.n+" "+dim.sum+" "+dim.ss)
        return ((dim.ss/dim.n) - ((dim.sum/dim.n)**2)) * (dim.n/(dim.n-1))
    }

    std(dimension){ return Math.sqrt(this.variance(dimension))}

    rank(dimension,val){ return  this.getValues(dimension).indexOf(val)+1}

    first(dimension){return  (this.getDim(dimension).first)}
    last(dimension){return  (this.getDim(dimension).last)}
    min(dimension){return  (this.getDim(dimension).min)}
    max(dimension) {return (this.getDim(dimension).max)}
    sum(dimension) {return (this.getDim(dimension).sum)}
    count(dimension){ return (this.getDim(dimension).n)}
    n(dimension) {
        if (this.getDim(dimension)) {
            return (this.getDim(dimension).n)
        } else {
            return this.count
        }
    }

    correl(dim1,dim2){
        const d1 = this.getDim(dim1)
        const d2 = this.getDim(dim2)
        let cov = (d1.cross[dim2]/d1.n) - ((d1.sum/d1.n)*(d2.sum/d2.n))
        console.log("covar "+cov)
        let std = (dim)=>{return Math.sqrt(((dim.ss/dim.n) - ((dim.sum/dim.n)**2)) * (dim.n/(dim.n)))}
        return cov / ( std(d1) * std(d2)) // population ?
    }
}

function test(){
    const acc = new Accumulator({values:true, cross:true})

    acc.add({x:1,y:16})
    acc.add({x:3,y:6})
    acc.add({x:5,y:6})
    acc.add({x:7,y:16})
    acc.add({x:11,y:16})


    console.log("count " +acc.n)
    console.log("avg x " +acc.getDim("x").sum)

    console.log("avg x " +acc.average("x"))
    console.log("avg y " +acc.average("y"))
    console.log("min x " +acc.min("x"))
    console.log("val x " +acc.getValues("x"))
    console.log("val y " +acc.getValues("y"))
    console.log("med x " +acc.median("x"))
    console.log("med y " +acc.median("y"))
    acc.add({x:11,y:3})
    console.log("med x " +acc.median("x"))
    console.log("med y " +acc.median("y"))
    console.log("val x " +acc.getValues("x"))
    console.log("val y " +acc.getValues("y"))
    console.log("var x " +acc.variance("x"))
    console.log("std y " +acc.std("y"))

    console.log("cross y " +JSON.stringify(acc.getDim("y").cross ))
    console.log("correl " +acc.correl("x","y"))

    // console.log("cross " +acc.rank("y",3 ))
}

// test()

export {Accumulator, reducers}