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

document.querySelectorAll('[data-open-search="true"]').forEach((link) => {
    link.addEventListener('click', (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
            return;
        }

        const openBtn = document.getElementById('search-open');
        if (!openBtn) {
            return;
        }

        event.preventDefault();
        openBtn.click();
    });
});
