// 系列目录中当前文章的标题：点击折叠 / 展开其下的「本节内容」，每次打开页面默认展开。
document.querySelectorAll('a[data-toc-toggle]').forEach((link) => {
    const toc = link.parentElement?.querySelector(':scope > .series-doc-nav-toc');
    if (!toc) {
        link.removeAttribute('data-toc-toggle');
        return;
    }

    link.setAttribute('aria-expanded', 'true');
    link.setAttribute('role', 'button');

    const toggle = () => {
        const expanded = link.getAttribute('aria-expanded') === 'true';
        link.setAttribute('aria-expanded', String(!expanded));
        toc.hidden = expanded;
    };

    link.addEventListener('click', (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
            return;
        }
        event.preventDefault();
        toggle();
    });

    link.addEventListener('keydown', (event) => {
        if (event.key === ' ') {
            event.preventDefault();
            toggle();
        }
    });
});
