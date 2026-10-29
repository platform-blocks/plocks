---
title: Nested scroll container
category: usage
order: 20
tags: [toc, scroll-area, scrollHost]
status: stable
hidden: false
---

Pass the scrolling element (or its ref) as `scrollHost` when the headings live inside a nested scroll container: it becomes the IntersectionObserver root and scroll listener target, and headings are looked up inside it when `container` is not given.
