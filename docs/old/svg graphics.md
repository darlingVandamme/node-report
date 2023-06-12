## generate svg graphs

- added a graphposition hbsHelper to calculate svg positions
````///  graph helpers
  function graphPosition(report,rtOptions){ // block helper
      return function( context, graphVariable,  options ) {
          // console.log("graph Helper " +graphVariable)
          // console.log("graph Helper " +JSON.stringify(context,null,2))
          //console.log("graph options " +JSON.stringify(options,null,2))
          const ds = report.getDataset(options.name)
          let margin = 30
          let graphWidth = 500 - (2*margin) // todo
          let graphHeight = 200 - (2*margin) //
          let points = ds.rows()
          let max = ds.accumulator().max(graphVariable)
          let rowNr = context.rowNr
          let value = context.data[graphVariable].value
          // console.log("graph " +points + " "+max+" "+rowNr+" "+context.column)
  
          let coord ={
              x1:((graphWidth/points)*rowNr )+margin,
              x2:((graphWidth/points)*(rowNr+1))+margin,
              y1: (graphHeight - ((graphHeight/max)*value) + margin),
              y2: (graphHeight - ((graphHeight/max)*value) + margin)
          }
  
          context.coord=coord
          return options.fn(context)
          // let col = ds.columns[context.column]
          /*
          context.columnOptions = col
          let template = col.template || "td"
          if (elements[template]) {
              return new hbsInstance.SafeString(elements[template](context, rtOptions))
          } else {
              // template not found
              return context.display
          }*/
      }
  }
````

- added hbs dataset templates

- LineGraph with hover info
````
{{#with dataset}}
    <svg width="{{options.graph.width}}" height="{{options.graph.height}}" viewBox="0 0 {{options.graph.width}} {{options.graph.height}}" xmlns="http://www.w3.org/2000/svg">
        <style>
            .small {
                font: 15px sans-serif;
            }
            .info{
                opacity:0%;
            }
            .info:hover{
                opacity:70%;
            }
            .zone{
                fill: transparent;
                stroke: transparent;
            }
        </style>
        <g fill="white" stroke="green" stroke-width="2">
            <line x1="30" y1="170" x2="30" y2="30" />
            <line x1="30" y1="170" x2="470" y2="170" />
        </g>
        {{#each options.graph.dimensions}}
            <polyline
                {{#with (lookup ../columns this)}}
                fill="transparent" stroke="{{color}}"
                {{/with}}
                points="
    {{#each ../displayData}}
                    {{#graph this ../this}}{{coord.x1}},{{coord.y2}}
                    {{/graph}}
    {{/each}} "/>
    {{#each ../displayData}}
        {{#graph this ../this}}
            <g class="info">
                <rect class="zone" x="{{coord.x1}}" y="0" width="10" height="100"></rect>
                <rect fill="lightgray" x="{{coord.x1}}" y="{{coord.y2}}" width="50" height="50"></rect>
                <text class="small" x="{{coord.x1}}" y="{{coord.y2}}" dx="10" dy="20">{{this.data.posts.display}}</text>
                <text class="small" x="{{coord.x1}}" y="{{coord.y2}}" dx="10" dy="40">{{this.data.d.display}}</text>
            </g>
        {{/graph}}
    {{/each}} "/>

        {{/each}}
    </svg>
{{/with}}
````

- Bargraph

````
{{#with dataset}}
    <svg width="200" height="200" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g fill="white" stroke="green" stroke-width="5">
        <line x1="0" y1="100" x2="0" y2="0" />
        <line x1="0" y1="100" x2="100" y2="100" />
    </g>
    {{#each options.graph.dimensions}}
            <path
            {{#with (lookup ../columns this)}}
                fill="{{color}}" stroke="{{color}}"
            {{/with}}
            d="M0 100
    {{#each ../displayData}}
        {{#graph this ../this}}
L{{coord.x1}} 100
L{{coord.x1}} {{coord.y2}}
L{{coord.x2}} {{coord.y2}}
L{{coord.x2}} 100
        {{/graph}}
    {{/each}}L100,100 Z"/>
    {{/each}}
</svg>
{{/with}}
````




Create server side graphics  with Plot and JSDom

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