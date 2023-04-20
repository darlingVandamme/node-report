function classToggle() {
    const collapsables = document.querySelectorAll('.hideable')
    
    collapsables.forEach(collapsable => collapsable.classList.toggle('hide'));
}
    
document.querySelector('.toggle_hide')
.addEventListener('click', classToggle)
