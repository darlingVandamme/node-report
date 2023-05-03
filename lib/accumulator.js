

// object to calculate basic statistics

function accumulator(){
    this.values = true // keep info to calculate ordered stats
    this.cross = true // keep info to calculate cross stats (correlations)

    this.n = 0
    this.dims = {}

    this.add = function(data, dimensions ){
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
                dim.ss += (value**2)

                dim.max = Math.max(value,dim.max)
                dim.min = Math.min(value,dim.min)

                if (this.values){
                    // keep ordered stats
                    dim.sorted=false
                    dim.values.push(value)
                }
                if (this.cross){
                    // keep cross stats
                }
            }
        })
    }

    this.getValues = function(dimension){
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
    this.median = function(dimension){
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

    this.getDim = function(dimension) {
        let dim = this.dims[dimension]
        if (!dim) {
            dim = {
                n: 0,
                sum: 0,
                ss:0,
                min:Number.MAX_SAFE_INTEGER,
                max:Number.MIN_SAFE_INTEGER,
                values:[]
            }
            this.dims[dimension] = dim
        }
        return dim
    }

    this.average = (dimension)=> {
        let dim = this.getDim(dimension)
        return (dim.sum/dim.n)
    }
    this.variance = (dimension)=> {
        let dim = this.getDim(dimension)
        // return ((dim.ss/dim.n) - ((dim.sum/dim.n)**2))  varP
        return ((dim.ss/dim.n) - ((dim.sum/dim.n)**2)) * (dim.n/(dim.n-1))
    }
    this.std = (dimension)=> Math.sqrt(this.variance(dimension))

    this.rank = (dimension,val)=> this.getValues(dimension).indexOf(val)+1

    this.min =(dimension)=>(this.getDim(dimension).min)
    this.max =(dimension)=>(this.getDim(dimension).max)



}

function test(){
    const acc = new accumulator()

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

    console.log("rank y " +acc.rank("y",3 ))

}

test()
