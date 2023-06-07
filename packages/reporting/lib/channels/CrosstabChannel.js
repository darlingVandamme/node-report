import {Accumulator} from "../accumulator.js";

class CrosstabChannel {
    constructor(options, engine) {
        this.options = options.options
        this.name = options.name
    }

    async load(ds, connection, params) {
        // make async? setImmediate?
        //return new Promise((resolve,reject) => {
        // ds.addColumn(params.y,{order:10})
        let sourceDS = await ds.require(params.from)

        let x = new Set()
        let y = new Set()
        let d = sourceDS.getData([params.crosstab.x,params.crosstab.y,params.crosstab.column])
        d.forEach((r=>{
            x.add(r[params.crosstab.x])
            y.add(r[params.crosstab.y])
        }))
        console.log("crosstab x ",x)
        console.log("crosstab y "+params.crosstab.y,y)

        let matrix = {} // Map???
        y.forEach(valy=>{
            let r = { }
            r[params.crosstab.y]=valy // ??
            x.forEach(valx=> {
                r[valx] = new Accumulator()
            })
            matrix[valy] = r
        })
        d.forEach((r=>{
            let acc = matrix[r[params.crosstab.y]][r[params.crosstab.x]]
            acc.add({x:r[params.crosstab.column]})  // hmmmm...
        }))
        console.log("crosstab Matrix ",matrix)
        y.forEach(valy =>{
            let result = {}
            result[params.crosstab.y]=valy
            x.forEach(valx=> {
                let acc = matrix[valy][valx]
                result[valx] = acc.get(params.crosstab.parameter,"x")
            })
            ds.addRow(result)
        })

        //})
    }

}

export default CrosstabChannel
