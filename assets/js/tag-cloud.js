// 标签页气泡：按名字散开后互相推开，避免排成网格。
(function () {
    const cloud = document.querySelector("[data-tag-cloud]");
    if (!cloud) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function hash(text) {
        let h = 2166136261;
        for (let i = 0; i < text.length; i++) {
            h ^= text.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    function rng(seed) {
        let a = seed >>> 0;
        return function () {
            a |= 0;
            a = (a + 0x6d2b79f5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function pack() {
        const bubbles = [...cloud.querySelectorAll(".tag-bubble")];
        if (!bubbles.length) return;

        const rect = cloud.getBoundingClientRect();
        const view = Math.min(window.innerWidth, document.documentElement.clientWidth);
        const width = Math.min(cloud.clientWidth, view - Math.max(rect.left, 0) - 28);
        if (width < 40) return;

        const pad = 16;
        const nodes = bubbles.map((el) => {
            const size = parseFloat(getComputedStyle(el).width) || 86;
            const rand = rng(hash(el.dataset.name || el.textContent || ""));
            return { el, r: size / 2, rand, size };
        });

        const maxR = Math.max(...nodes.map((n) => n.r));
        const area = nodes.reduce((sum, n) => sum + Math.PI * (n.r + pad) ** 2, 0);
        const estH = Math.max(width * 0.85, area / (width * 0.55));

        nodes.forEach((n) => {
            const spread = 1 - (n.r / maxR) * 0.72;
            n.tx = width / 2 + (n.rand() - 0.5) * width * 0.78 * spread;
            n.ty = estH / 2 + (n.rand() - 0.5) * estH * 0.72 * spread;
            n.x = n.tx + (n.rand() - 0.5) * 30;
            n.y = n.ty + (n.rand() - 0.5) * 30;
            if (!n.el.dataset.motion) {
                const dx = (n.rand() - 0.5) * 6;
                const dy = (n.rand() - 0.5) * 8;
                n.el.style.setProperty("--dx", dx.toFixed(1) + "px");
                n.el.style.setProperty("--dy", dy.toFixed(1) + "px");
                n.el.style.setProperty("--dur", (5.5 + n.rand() * 3.5).toFixed(2) + "s");
                n.el.style.setProperty("--delay", (-n.rand() * 6).toFixed(2) + "s");
                n.el.style.setProperty("--pop", (n.rand() * 0.35).toFixed(2) + "s");
                n.el.dataset.motion = "1";
            }
        });

        for (let step = 0; step < 240; step++) {
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const a = nodes[i];
                    const b = nodes[j];
                    let dx = b.x - a.x;
                    let dy = b.y - a.y;
                    let dist = Math.hypot(dx, dy) || 0.01;
                    const min = a.r + b.r + pad;
                    if (dist < min) {
                        const push = (min - dist) / 2;
                        const ux = dx / dist;
                        const uy = dy / dist;
                        a.x -= ux * push;
                        a.y -= uy * push;
                        b.x += ux * push;
                        b.y += uy * push;
                    }
                }
            }
            for (const n of nodes) {
                n.x += (n.tx - n.x) * 0.03;
                n.y += (n.ty - n.y) * 0.03;
                n.x = Math.min(width - n.r - 8, Math.max(n.r + 8, n.x));
            }
        }

        let minY = Infinity;
        let maxY = -Infinity;
        for (const n of nodes) {
            minY = Math.min(minY, n.y - n.r);
            maxY = Math.max(maxY, n.y + n.r);
        }
        const shiftY = 8 - minY;
        cloud.style.height = maxY - minY + 24 + "px";
        for (const n of nodes) {
            n.el.style.left = n.x - n.r + "px";
            n.el.style.top = n.y + shiftY - n.r + "px";
        }
        cloud.classList.add("is-packed");
    }

    if (reduceMotion) {
        cloud.classList.add("is-reduced");
    }

    pack();

    let timer = 0;
    const observer = new ResizeObserver(() => {
        window.clearTimeout(timer);
        timer = window.setTimeout(pack, 150);
    });
    observer.observe(cloud);
})();
