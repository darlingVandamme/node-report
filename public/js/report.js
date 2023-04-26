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

function tableOverlay(event) {
    let row = event.target.closest('tr');
    let body = row.querySelector('.hidden').innerHTML;
    document.querySelectorAll('.table_info').forEach(div => div.innerHTML = body);
    document.querySelectorAll('#overlay').forEach(div => div.classList.toggle('hidden'));
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
    document.querySelectorAll('.toggle_hide').forEach(toggler => toggler.addEventListener('click', classToggle))
});

document.addEventListener("DOMContentLoaded", (event) => {
    document.querySelectorAll('input[type=checkbox]').forEach(toggler => toggler.addEventListener('click', classToggle))
});

document.addEventListener("DOMContentLoaded", (event) => {
    document.querySelectorAll('tbody>tr').forEach(row => row.addEventListener('click', tableOverlay))
});

document.addEventListener("DOMContentLoaded", (event) => {
    document.querySelectorAll('.tabs>.tab').forEach(tab => tab.addEventListener('click', tabs))
});
