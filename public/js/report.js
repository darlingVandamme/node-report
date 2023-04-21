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
    event.target.classList.toggle("toggled")
}

document.addEventListener("DOMContentLoaded", (event) => {
    document.querySelectorAll('.toggle_hide').forEach(toggler => toggler.addEventListener('click', classToggle))
});

document.addEventListener("DOMContentLoaded", (event) => {
    document.querySelectorAll('input[type=checkbox]').forEach(toggler => toggler.addEventListener('click', classToggle))
});


