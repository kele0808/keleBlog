#!/usr/bin/env python3
"""检查 Hugo 构建产物中的站内链接与图片。

用法：hugo --gc --minify -d /tmp/kb && python3 scripts/check_links.py /tmp/kb
失败条件：空 href、缺少 /keleBlog/ 前缀的站内绝对路径、指向不存在文件的站内链接。
"""
import glob
import os
import re
import sys
import urllib.parse

BASE = "/keleBlog/"
HOSTS = ("https://kele0808.github.io/keleBlog/", "http://localhost:1313/keleBlog/")


def main(root: str) -> int:
    broken, unprefixed, empty = set(), set(), set()
    checked = 0
    for path in glob.glob(os.path.join(root, "**", "*.html"), recursive=True):
        page = path[len(root):]
        html = open(path, encoding="utf-8").read()
        for attr, raw in re.findall(r'\b(href|src)=("[^"]*"|[^\s>]+)', html):
            url = raw.strip('"')
            if attr == "href" and url in ("", "#"):
                empty.add(page)
                continue
            for host in HOSTS:
                if url.startswith(host):
                    url = BASE + url[len(host):]
            if url.startswith("//") or not url.startswith("/"):
                continue
            if not url.startswith(BASE):
                unprefixed.add((page, url))
                continue
            rel = urllib.parse.unquote(url.split("#")[0].split("?")[0])[len(BASE):]
            target = os.path.join(root, rel)
            if rel == "" or rel.endswith("/"):
                target = os.path.join(target, "index.html")
            checked += 1
            if not os.path.exists(target):
                broken.add((page, url))

    print(f"checked {checked} internal refs")
    for name, items in (("empty href", empty), ("missing base path", unprefixed), ("broken", broken)):
        print(f"{name}: {len(items)}")
        for item in sorted(items)[:20]:
            print("  ", item)
    return 1 if (empty or unprefixed or broken) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "public"))
