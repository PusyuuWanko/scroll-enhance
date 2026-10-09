# scroll-enhance

IntersectionObserver を使ったスクロール演出と、紹介動画の再生制御を行うスクリプトです。
必要な CSS と HTML はスクリプトが自分で生成します。

## 使い方

```html
<main>
  <section>…</section>
  <div class="intro">
    <video data-variant="desktop" muted playsinline loop><source src="desktop.mp4"></video>
    <video data-variant="mobile"  muted playsinline loop><source src="mobile.mp4"></video>
  </div>
</main>
<script src="scroll-enhance.js"></script>
```

- `main > section` や `.product` などの要素が、画面に入ったときにふわっと表示されます
- `video[data-variant]` を `desktop` と `mobile` の2本用意すると、画面幅(900px 以下はモバイル)に合う方だけを再生します。画面外にある間は再生を止めます

## ライセンス

[MIT License](LICENSE) © 2026 ISAMI ABE
