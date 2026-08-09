import * as params from '@params';

const searchRoot = document.getElementById('header-search');
const searchBox = document.getElementById('headerSearchBox');
const sInput = document.getElementById('headerSearchInput');
const resList = document.getElementById('headerSearchResults');

let fuse;
let indexLoaded = false;
let indexLoading = false;
let currentElement = null;
let firstResult = null;
let lastResult = null;

const defaultFuseOptions = {
    distance: 100,
    threshold: 0.4,
    ignoreLocation: true,
    keys: ['title', 'permalink', 'summary', 'content']
};

const buildFuseOptions = () => {
    if (!params.fuseOpts) {
        return defaultFuseOptions;
    }

    return {
        isCaseSensitive: params.fuseOpts.iscasesensitive ?? false,
        includeScore: params.fuseOpts.includescore ?? false,
        includeMatches: params.fuseOpts.includematches ?? false,
        minMatchCharLength: params.fuseOpts.minmatchcharlength ?? 1,
        shouldSort: params.fuseOpts.shouldsort ?? true,
        findAllMatches: params.fuseOpts.findallmatches ?? false,
        keys: params.fuseOpts.keys ?? defaultFuseOptions.keys,
        location: params.fuseOpts.location ?? 0,
        threshold: params.fuseOpts.threshold ?? defaultFuseOptions.threshold,
        distance: params.fuseOpts.distance ?? defaultFuseOptions.distance,
        ignoreLocation: params.fuseOpts.ignorelocation ?? defaultFuseOptions.ignoreLocation
    };
};

const debounce = (fn, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = window.setTimeout(() => fn(...args), delay);
    };
};

const isDropdownOpen = () => searchRoot?.classList.contains('is-open');

const clearResults = () => {
    currentElement = null;
    firstResult = null;
    lastResult = null;
    if (resList) {
        resList.innerHTML = '';
        resList.hidden = true;
    }
    sInput?.setAttribute('aria-expanded', 'false');
};

const resetInput = () => {
    if (sInput) {
        sInput.value = '';
    }
    clearResults();
};

const setActiveResult = (element) => {
    document.querySelectorAll('#headerSearchResults .focus').forEach((item) => item.classList.remove('focus'));

    if (!element) {
        return;
    }

    element.focus();
    element.parentElement?.classList.add('focus');
    currentElement = element;
};

const renderResults = (results) => {
    if (!resList) {
        return;
    }

    if (!Array.isArray(results) || results.length === 0) {
        clearResults();
        searchRoot?.classList.remove('is-open');
        return;
    }

    const fragment = document.createDocumentFragment();

    for (const result of results) {
        const li = document.createElement('li');
        const titleText = document.createTextNode(result.item.title);
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.classList.add('feather', 'feather-chevrons-right');
        svg.innerHTML = '<polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline>';

        const link = document.createElement('a');
        link.className = 'entry-link';
        link.href = result.item.permalink;
        link.setAttribute('aria-label', result.item.title);

        li.appendChild(titleText);
        li.appendChild(svg);
        li.appendChild(link);
        fragment.appendChild(li);
    }

    resList.innerHTML = '';
    resList.appendChild(fragment);
    firstResult = resList.firstElementChild;
    lastResult = resList.lastElementChild;
    resList.hidden = false;
    searchRoot?.classList.add('is-open');
    sInput?.setAttribute('aria-expanded', 'true');
};

const performSearch = () => {
    if (!fuse || !sInput) {
        return;
    }

    const query = sInput.value.trim();
    if (!query) {
        renderResults([]);
        return;
    }

    const searchOptions = params.fuseOpts?.limit ? { limit: params.fuseOpts.limit } : undefined;
    const results = searchOptions ? fuse.search(query, searchOptions) : fuse.search(query);
    renderResults(results);
};

const loadIndex = async () => {
    const indexUrl = searchRoot?.dataset.indexUrl;
    if (indexLoaded || indexLoading || !indexUrl) {
        return;
    }

    indexLoading = true;

    try {
        const response = await fetch(indexUrl);
        if (!response.ok) {
            throw new Error(`Search index load failed: ${response.status}`);
        }

        const data = await response.json();
        if (data) {
            fuse = new Fuse(data, buildFuseOptions());
            indexLoaded = true;
        }
    } catch (error) {
        console.error(error);
    } finally {
        indexLoading = false;
    }
};

const openSearch = async () => {
    if (!searchRoot || !sInput) {
        return;
    }

    await loadIndex();
    sInput.focus();
    sInput.select();

    if (sInput.value.trim()) {
        performSearch();
    }
};

const closeSearch = () => {
    if (!searchRoot) {
        return;
    }

    searchRoot.classList.remove('is-open');
    clearResults();
};

const shouldIgnoreShortcut = (target) => {
    if (!target) {
        return false;
    }

    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return !searchBox?.contains(target);
    }

    return target.isContentEditable;
};

const inSearch = (target) => searchBox?.contains(target);

sInput?.addEventListener('focus', async () => {
    await loadIndex();
});

sInput?.addEventListener('input', debounce(performSearch, 150));

sInput?.addEventListener('search', () => {
    if (!sInput.value) {
        closeSearch();
    }
});

document.addEventListener('click', (event) => {
    if (!searchRoot || !isDropdownOpen()) {
        return;
    }

    if (!searchRoot.contains(event.target)) {
        closeSearch();
    }
});

document.addEventListener('keydown', (event) => {
    const { key } = event;
    const active = document.activeElement;
    const focused = inSearch(active);

    if ((event.metaKey || event.ctrlKey) && key.toLowerCase() === 'k') {
        event.preventDefault();
        if (focused && isDropdownOpen()) {
            closeSearch();
            sInput?.blur();
        } else if (!shouldIgnoreShortcut(active)) {
            openSearch();
        }
        return;
    }

    if (key === 'Escape' && (focused || isDropdownOpen())) {
        event.preventDefault();
        closeSearch();
        sInput?.blur();
        return;
    }

    if (!isDropdownOpen() || !firstResult || !focused) {
        return;
    }

    if (key === 'ArrowDown') {
        event.preventDefault();

        if (active === sInput) {
            setActiveResult(firstResult.querySelector('.entry-link'));
        } else if (active?.parentElement !== lastResult) {
            setActiveResult(active?.parentElement?.nextElementSibling?.querySelector('.entry-link'));
        }
    } else if (key === 'ArrowUp') {
        event.preventDefault();

        if (active?.parentElement === firstResult) {
            setActiveResult(sInput);
        } else if (active !== sInput) {
            setActiveResult(active?.parentElement?.previousElementSibling?.querySelector('.entry-link'));
        }
    } else if (key === 'Enter' && active?.matches?.('.entry-link')) {
        event.preventDefault();
        active.click();
    }
});
