function showGraph(evt){
    let clickedData = getData(evt.target)
    if (clickedData){
        let month = clickedData.month
        let year = clickedData.year
        let data = report.data["main"].data.filter((d)=>{return (d.d.getMonth() == (month-1) && d.d.getFullYear() == year)})
        let graph = Plot.plot({
            marks: [
                ()=>{let style =  document.createElement("style")
                    style.appendChild(document.createTextNode(' .info { stroke: "red"} '))
                    return style
                },
                Plot.ruleY([0]),
                Plot.line(data, {x: "d", y: "posts"}),
                Plot.circle(data, {x: "d", y: "posts",stroke:"red",r:2,class:"info" })
            ],
            y: {grid: true}
        })
        const div = document.querySelector("#dataset_detail .dataset_div");
        div.replaceChild(graph,div.firstChild )
    }
}

export {showGraph}