function classToggle(event) {
    let target = event.target.dataset.target || "*"
    let level = parseInt(event.target.dataset.level) || 0
    let from = event.target
    if (level > 0){
        for (let i=0;i<level;i++){
            from = from.parentNode
        }
    } else {
        from = document
    }
    from.querySelectorAll(target)
        .forEach(collapsable => collapsable.classList.toggle('hide'));
    event.target.classList.toggle("clicked")
}



document.addEventListener("DOMContentLoaded", (event) => {
    document.querySelectorAll('.toggle_hide').forEach( element => {
        element.addEventListener('click', classToggle)
    })
});
