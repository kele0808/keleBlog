const openDrawer = (drawer) => {
    if (!drawer) {
        return;
    }

    drawer.hidden = false;
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('series-doc-drawer-open');

    const trigger = document.querySelector(`[data-drawer-target="${drawer.id}"]`);
    trigger?.setAttribute('aria-expanded', 'true');
};

const closeDrawer = (drawer) => {
    if (!drawer) {
        return;
    }

    drawer.hidden = true;
    drawer.setAttribute('aria-hidden', 'true');

    const openDrawers = document.querySelectorAll('.series-doc-drawer:not([hidden])');
    if (openDrawers.length === 0) {
        document.body.classList.remove('series-doc-drawer-open');
    }

    const trigger = document.querySelector(`[data-drawer-target="${drawer.id}"]`);
    trigger?.setAttribute('aria-expanded', 'false');
    trigger?.focus();
};

const closeAllDrawers = () => {
    document.querySelectorAll('.series-doc-drawer:not([hidden])').forEach((drawer) => {
        closeDrawer(drawer);
    });
};

document.querySelectorAll('[data-drawer-target]').forEach((button) => {
    button.addEventListener('click', () => {
        const drawer = document.getElementById(button.dataset.drawerTarget);
        if (!drawer) {
            return;
        }

        if (drawer.hidden) {
            closeAllDrawers();
            openDrawer(drawer);
        } else {
            closeDrawer(drawer);
        }
    });
});

document.querySelectorAll('[data-drawer-close]').forEach((el) => {
    el.addEventListener('click', () => {
        const drawer = el.closest('.series-doc-drawer');
        closeDrawer(drawer);
    });
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeAllDrawers();
    }
});
