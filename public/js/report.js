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
    document.querySelectorAll('.table_info').forEach(div => div.innerHTML = body);
    document.querySelectorAll('#overlay').forEach(div => div.style.display = 'block');
    document.addEventListener('click', (event) => {
        var overlay = document.getElementById('overlay');
        if (!overlay.contains(event.target)) {
            overlay.style.display = 'none';
        }
    });
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

function darkMode(event) {
    let root = document.documentElement;
    let checked = document.getElementById("dark_mode").checked;
    if (checked) {
        root.style.setProperty("--color-1", "var(--color-1-dark)");
        root.style.setProperty("--color-2", "var(--color-2-dark)");
        root.style.setProperty("--color-2-alpha", "var(--color-2-alpha-dark)");
        root.style.setProperty("--color-3", "var(--color-3-dark)");
        root.style.setProperty("--color-4", "var(--color-4-dark)");
        root.style.setProperty("--color-5", "var(--color-5-dark)");
        root.style.setProperty("--color-text", "var(--color-text-light)");
        root.style.setProperty("--xmark", "var(--xmark-dark)");
        root.style.setProperty("--arrow", "var(--arrow-dark)");  
    } else {
        root.style.setProperty("--color-1", "var(--color-1-light)");
        root.style.setProperty("--color-2", "var(--color-2-light)");
        root.style.setProperty("--color-2-alpha", "var(--color-2-alpha-light)");
        root.style.setProperty("--color-3", "var(--color-3-light)");
        root.style.setProperty("--color-4", "var(--color-4-light)");
        root.style.setProperty("--color-5", "var(--color-5-light)");
        root.style.setProperty("--color-text", "var(--color-text-dark)");
        root.style.setProperty("--xmark", "var(--xmark-light)");
        root.style.setProperty("--arrow", "var(--arrow-light)");
    }
}

document.addEventListener("DOMContentLoaded", (event) => {
    document.querySelectorAll('.toggle_hide').forEach(toggler => toggler.addEventListener('click', classToggle));
    document.querySelectorAll('checkboxes>input[type=checkbox]').forEach(toggler => toggler.addEventListener('click', classToggle));
    document.querySelectorAll('tbody>tr').forEach(row => row.addEventListener('click', showHiddenColumns));
    document.querySelectorAll('.tabs>.tab').forEach(tab => tab.addEventListener('click', tabs));
    document.getElementById("dark_mode").addEventListener('click', darkMode);
    document.querySelectorAll('.overlay_hide').forEach(x => x.addEventListener('click', overlayHide));
});