# Adding a post

1. Copy `test-post.html` to a new file in this folder, named with a short slug, for example `a-new-post.html`. GitHub Pages will serve it at `/posts/a-new-post` (no trailing slash). The preview worker does the same.

2. In the new file, change the title, date, meta description, canonical URL (`https://oscarkalid.com/posts/a-new-post`) and the article body. Keep the shared header, tabs, and `#panel` wrapper so tab transitions still work.

3. Add an item at the top of the list in `../posts.html` (newest first):

```html
<li class="about-unit">
  <a class="title-link" href="/posts/a-new-post">Your title</a>
  <p class="stats">17 Nov 2026</p>
</li>
```

For an image, use a figure with the existing `.shot` frame. A caption is optional:

```html
<figure class="about-unit">
  <div class="shot">
    <img src="/images/your-image.webp" width="1280" height="720" alt="Describe the image." decoding="async">
  </div>
  <figcaption class="stats">An optional caption.</figcaption>
</figure>
```

`test-post.html` is only a sample, so you can see typography and images. Delete it, and its row in `posts.html`, when it is no longer needed.
