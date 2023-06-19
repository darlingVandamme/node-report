// Data and report related functions

function filterDataset(dataset,filter) {
    // set all hidden
    document.querySelectorAll("#dataset_" + dataset + "  [data-rownr]").forEach(item => {
        item.classList.add("hidden")
    })
    // filter on dataset => unset hidden
    report.data.menu.data.forEach((item, i) => {
        if (filter(item)) {
            document.querySelector("#dataset_menu  [data-rownr='" + i + "']").classList.remove("hidden")
        }
    })
}

function sortDataset(dataset,sort,asc) {
    if (typeof sort =="string"){
        let sortColunm = sort
        if (asc && asc=="desc"){
            sort = (a,b)=>{if (a[sortColunm]<b[sortColunm]) return 1;if (a[sortColunm]>b[sortColunm]) return -1;return 0}
        } else {
            sort = (a,b)=>{if (a[sortColunm]>b[sortColunm]) return 1;if (a[sortColunm]<b[sortColunm]) return -1;return 0}
        }
    }
    let c = [...report.data[dataset].data]
    c.forEach((item,i)=>{item.rowNr=i})
    c.sort(sort)
    let table = document.getElementById("dataset_"+dataset)
    let rows = [...document.getElementById("dataset_"+dataset).querySelectorAll("[data-rowNr]")]
    rows.sort((a,b) => {return a.dataset.rownr - b.dataset.rownr})
    let tbody = table.querySelector("tbody")
    let sorted = []
    c.forEach(item=>{ sorted.push(rows[item.rowNr]) })
    tbody.replaceChildren(...sorted)
}


//  find data from DOM element
function getDatasetName(element){
    let id = element.closest(".dataset").getAttribute("id")
    if (id && id.startsWith("dataset_") ){
        return id.substr(8)
    }
}

function getRowNr(element){
    let parent = element.closest("[data-rownr]")
    if (parent) {
        return parseInt(element.closest("[data-rownr]").dataset.rownr)
    }
}

function getData(element){
    let dsName = getDatasetName(element)
    let rowNr = getRowNr(element)
    if (dsName){
        return report.data[dsName].data[rowNr]
    }
}

function getDatasetElement(name){
    return document.querySelector("#dataset_"+name)
}

function reloadReport( extension, dataset){
//     import reload  from "/report/inlineTest.js"
    // or multiple datasets?
    const url = new URL(report.url)
    // select dataset
    // change extension ??
    if (extension) {
        if (url.pathname.indexOf(".") > 0) {
            // search for  last .
            url.pathname = url.pathname.replace(/\.([^.]*$)/, "." + extension)
        } else {
            url.pathname = url.pathname + "." + extension
        }
    }
    // add timing to force reload?
    url.searchParams.set("report.forceReload", Date.now())
    if (dataset) {url.searchParams.set("report.dataset", dataset)}
    const relative = url.pathname+url.search
    console.log(relative)
    import(relative).then(mod=>{
        console.log(mod.report.name + " "+mod.report.data.length)
        //console.log(JSON.stringify(mod.report))
        Object.keys(mod.report.data).forEach(name=>{
            let d = mod.report.data[name]
            if (d.html){
                getDatasetElement(d.name).outerHTML = d.html // or replaceElement createElemant?
            }
            report.data[d.name] = d
        })
    }).catch(error=>{
        console.log(error)
    })

}

function datacheckbox(event){
    const dataset = event.target.dataset.dataset
    const column = event.target.dataset.column
    const rownr = parseInt(event.target.dataset.rownr) // getRowNr(event.target)
    // console.log("selected "+dataset+" "+column+" "+rownr+ " "+event.target.checked)
    let d = report.data[dataset].data[rownr]
    if (d){
        d[column] = event.target.checked
        // change displayValue???
    }
    // recalculate
}

function classToggle(event) {
    let target = event.target.dataset.target || "*"
    let level = parseInt(event.target.dataset.level) || 0
    let hidename = event.target.dataset.toggleclass || "hidden"
    let from = event.target
    if (level > 0){
        for (let i=0;i<level;i++){
            from = from.parentNode
        }
    } else {
        from = document
    }
    from.querySelectorAll(target)
        .forEach(collapsable => collapsable.classList.toggle(hidename));
    event.target.classList.toggle("toggled");
}

function showOverlay(body){
    document.removeEventListener("click",clickClosePopup)

    document.querySelectorAll('.table_info').forEach(div => div.innerHTML = body);
    document.querySelectorAll('#overlay').forEach(div => div.style.display="block");
    // todo hide by click on document
    setTimeout(()=> {
        document.addEventListener("click", clickClosePopup);
    },200)
}

function closeOverlay(){
    document.querySelectorAll("#overlay").forEach(
        p => {
            p.style.display="none"
        }
    )
    document.removeEventListener("click",clickClosePopup)
}

function clickClosePopup(e) {
    const isClosest = e.target.closest("#overlay");
    // console.log(" click "+isClosest)
    if (!isClosest) {
        closeOverlay()
    }
}

function dialog(url){
    const dialog = document.createElement("DIALOG");
    document.body.append(dialog)
    fetch(url).then(res=>{return res.text()}).then(text=>{dialog.innerHTML=text})
    dialog.showModal()
}

async function fetchDataset(url) {
    let resp = await fetch(url)
    if (resp.ok) {
        let html = await resp.text()
        // todo split javascript portion
        // integrate new dataset script into report
        // split the response
        // let b = new Blob([script])
        // let url = URL.createObjectURL(b)
        // createElement("script")
        // set source url
        // document.addElement
        return html
    }
}


function fetchOverlay(url){
    fetch(url).then(resp=>{return resp.text()}).then(body=>{showOverlay(body)})
}

function showHidden(dsName){
    let body = document.querySelector("#dataset_"+dsName).innerHTML
    showOverlay(body)
}

function overlayHide(event){
    let target = event.target.dataset.target;
    document.querySelectorAll(target).forEach(overlay => overlay.style.display = 'none');
}


// click & hover functions
function showHiddenColumns(event) {
    let row = event.target.closest('tr');
    let body = row.querySelector('.hidden').innerHTML;
    showOverlay(body)
}


function tabs(event) {
    let selectedTab = event.target.dataset.target;
    document.querySelectorAll('.dataset_tab').forEach(dataset => 
        {if (dataset.id !== selectedTab) {
            dataset.style.display = "none";
        } else {
            dataset.style.display = "block";
        }    
    })
}

document.addEventListener("DOMContentLoaded", (event) => {
    document.querySelectorAll('.toggle_hide').forEach(toggler => toggler.addEventListener('click', classToggle));
    document.querySelectorAll('checkboxes>input[type=checkbox]').forEach(toggler => toggler.addEventListener('click', classToggle));
    document.querySelectorAll('tbody>tr').forEach(row => row.addEventListener('click', showHiddenColumns));
    document.querySelectorAll('.tabs>.tab').forEach(tab => tab.addEventListener('click', tabs));
    console.log("report loaded "+report.name)
});