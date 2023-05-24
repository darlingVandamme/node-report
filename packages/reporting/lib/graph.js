// move to separate package?

import * as Plot from "@observablehq/plot"
import { JSDOM } from  "jsdom";
// https://stackoverflow.com/questions/74573576/how-to-use-observable-plot-in-nodejs?rq=1

function renderPlot(report,options){

    const dom = new JSDOM(`<!DOCTYPE html>`);

    let data = report.getDataset("main").getData()
    let dim = options.dimension
    let graph = Plot.plot({
        marks: [
            Plot.ruleY([0]),
            Plot.line(data, {x: "d", y: dim}),
            Plot.circle(data, {x: "d", y: dim,stroke:"red",r:2,class:"info" })
        ],
        y: {grid: true},
        document:dom.window.document
    })
    return Promise.resolve(graph.outerHTML)
}


export {renderPlot}