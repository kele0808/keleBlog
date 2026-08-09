const initTocScrollSpy = () => {
    const tocInners = document.querySelectorAll('.series-doc-toc-inner');
    const content = document.querySelector('.series-doc-article .post-content');
    if (!tocInners.length || !content) {
        return;
    }

    const headings = [...content.querySelectorAll('h2[id], h3[id], h4[id], h5[id], h6[id]')];
    if (!headings.length) {
        return;
    }

    const links = [];
    tocInners.forEach((tocInner) => {
        links.push(...tocInner.querySelectorAll('a[href^="#"]'));
    });
    if (!links.length) {
        return;
    }

    const linksById = new Map();
    links.forEach((link) => {
        const id = decodeURIComponent(link.getAttribute('href').slice(1));
        if (!linksById.has(id)) {
            linksById.set(id, []);
        }
        linksById.get(id).push(link);
    });

    let activeId = null;
    const scrollOffset = 96;

    const getScrollContainer = (link) => {
        const tocInnerEl = link.closest('.series-doc-toc-inner');
        return tocInnerEl?.closest('.series-doc-series-collapse-body')
            || tocInnerEl?.closest('.series-doc-toc-sticky')
            || tocInnerEl?.closest('.series-doc-drawer-panel')
            || tocInnerEl;
    };

    const setActive = (id) => {
        if (!id || activeId === id) {
            return;
        }

        activeId = id;
        links.forEach((link) => link.classList.remove('is-active'));

        const activeLinks = linksById.get(id);
        if (!activeLinks?.length) {
            return;
        }

        activeLinks.forEach((link) => link.classList.add('is-active'));

        const primaryLink = activeLinks[0];
        const tocContainer = getScrollContainer(primaryLink);
        if (!tocContainer) {
            return;
        }

        const containerRect = tocContainer.getBoundingClientRect();
        const linkRect = primaryLink.getBoundingClientRect();
        if (linkRect.top < containerRect.top || linkRect.bottom > containerRect.bottom) {
            primaryLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    };

    const resolveActiveId = () => {
        let current = headings[0];

        for (const heading of headings) {
            if (heading.getBoundingClientRect().top <= scrollOffset) {
                current = heading;
            } else {
                break;
            }
        }

        return current.id;
    };

    let ticking = false;
    const updateActive = () => {
        setActive(resolveActiveId());
        ticking = false;
    };

    const onScroll = () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(updateActive);
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateActive();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTocScrollSpy);
} else {
    initTocScrollSpy();
}
