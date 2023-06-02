// move to separate package?

import * as Plot from "@observablehq/plot"
import { JSDOM } from  "jsdom";
// https://stackoverflow.com/questions/74573576/how-to-use-observable-plot-in-nodejs?rq=1

function renderPlot(report,options){

    const dom = new JSDOM(`<!DOCTYPE html>`);
// console.log(options)
    let data = report.getDataset(options.include[0]).getData()
    let graph = Plot.plot({
        marks: [
            Plot.ruleY([0]),
            Plot.line(data, {x: options.x, y: options.y}),
            Plot.circle(data, {x: options.x, y: options.y, stroke:"red",r:2,class:"info" })
        ],
        y: {grid: true},
        document:dom.window.document
    })
    return Promise.resolve(graph.outerHTML)
}


export {renderPlot}