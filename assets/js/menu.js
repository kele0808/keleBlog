const menu = document.getElementById('menu');
if (menu) {
    const active = menu.querySelector('.active');
    if (active) {
        active.closest('a')?.scrollIntoView({ block: 'nearest', inline: 'center' });
    }

    menu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            localStorage.removeItem('menu-scroll-position');
        });
    });
}
