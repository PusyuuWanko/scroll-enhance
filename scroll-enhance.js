/*****************************************
  *----------------------------------
  |  ThisScriptVersion: 1.0.0     |
  |  © 2026 By ISAMI ABE          |
  |  LastUpdate: 2026-10-06       |
  |  License: MIT License         |
  |  scroll-enhance (スクロール演出と紹介動画の制御) |
----------------------------------*
******************************************/
/*****************************************
  *----------------------------------
  |  IntersectionObserverによる    |
  |  スクロール演出＆紹介動画制御    |
  |  ※JS専用のCSS/HTMLはすべて     |
  |    このファイル内で生成する    |
----------------------------------*
******************************************/

document.addEventListener('DOMContentLoaded', function () {
  var mq = window.matchMedia('(max-width: 900px)');

  function setupResponsiveVideoPair(container, observeVisibility) {
    var videos = Array.prototype.slice.call(container.querySelectorAll('video[data-variant]'));
    if (videos.length === 0) return null;

    var inView = !observeVisibility;

    function activeVariant() {
      return mq.matches ? 'mobile' : 'desktop';
    }

    function applyPlayState() {
      var active = activeVariant();
      videos.forEach(function (v) {
        var shouldPlay = inView && v.dataset.variant === active;
        if (shouldPlay) {
          if (v.paused) {
            var p = v.play();
            if (p && p.catch) p.catch(function () {});
          }
        } else if (!v.paused) {
          v.pause();
        }
      });
    }

    if (observeVisibility && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.target === container) inView = entry.isIntersecting;
        });
        applyPlayState();
      }, { threshold: 0.35 });
      io.observe(container);
    }

    if (mq.addEventListener) {
      mq.addEventListener('change', applyPlayState);
    } else if (mq.addListener) {
      mq.addListener(applyPlayState);
    }

    applyPlayState();
    return { videos: videos, activeVariant: activeVariant };
  }

  // ホーム背景動画：非表示側(desktop/mobile)が裏で再生され続けないようにする
  var heroShow = document.getElementsByTagName('show')[0];
  if (heroShow) {
    setupResponsiveVideoPair(heroShow, false);
  }

  // ---- スクロール連動リビール演出（プログレッシブエンハンスメント） ----
  // 旧: threshold 0.15（要素の面積の15%が可視領域に入るまで発火しない）
  // ホームなど1画面に収まらない縦長セクションでは、画面いっぱいに
  // 表示してもその15%にすら届かないケースがあり、スマホでは事実上
  // 永久に表示されない（消えたまま）状態になっていた。
  // threshold: 0 にして「1pxでも交差したら発火」に変更し、
  // 要素の高さに関係なく確実にリビールされるようにする。
  var revealStyle = document.createElement('style');
  revealStyle.textContent =
    '.js-reveal{opacity:0;will-change:opacity;}' +
    '.js-reveal.is-visible{opacity:1;}' +
    '.js-reveal-blur{filter:blur(18px);}' +
    '.js-reveal-blur.is-visible{filter:blur(0);transition:filter 1s cubic-bezier(.16,1,.3,1);}' +
    '.js-reveal-clip{clip-path:inset(0 0 100% 0);}' +
    '.js-reveal-clip.is-visible{clip-path:inset(0 0 0% 0);transition:clip-path .9s cubic-bezier(.16,1,.3,1);}';
  document.head.appendChild(revealStyle);

  var revealTargets = Array.prototype.slice.call(
    document.querySelectorAll('main > section, .product, .sougo, .saiyou')
  );
  revealTargets.forEach(function (el) {
    el.classList.add('js-reveal');
    // 演出の種類ごとに、開いた瞬間の見た目(ぼかし/クリップ)の初期状態だけを
    // ここでCSSとして付与する。実際の動き(拡縮・回転・移動)はすべてanime.jsで
    // JS側から与えるため、HTML/PHP側の変更は不要。
    if (el.classList.contains('saiyou')) {
      el.classList.add('js-reveal-blur');
    } else if (el.classList.contains('product')) {
      el.classList.add('js-reveal-clip');
    }
  });

  var hasAnime = typeof window.anime === 'function';

  // anime.js完了後もtransform/opacityがインラインstyleに残ると、hoverの
  // CSSトランジションより優先度が高くなってしまい効かなくなるため、
  // ワンショットの演出が終わったら後片付けする。
  function clearInlineMotionStyles(targets) {
    var list = Array.isArray(targets) ? targets : [targets];
    list.forEach(function (t) {
      t.style.transform = '';
      t.style.opacity = '';
    });
  }

  // バリエーションA(既定): 幾何学的なカスケードリビール。子要素をずらしながら
  // 回転・拡縮・斜め移動させて集約させる演出。主に main > section 向け。
  function geometricReveal(el, index) {
    el.classList.add('is-visible');
    if (!hasAnime) return;
    var dir = index % 2 === 0 ? 1 : -1;
    var pieces = Array.prototype.slice.call(el.children).filter(function (c) {
      return !c.classList.contains('modal');
    });
    if (!pieces.length) pieces = [el];
    anime.set(pieces, {
      opacity: 0,
      translateY: 34,
      translateX: dir * 26,
      rotate: dir * 4,
      scale: 0.94
    });
    anime({
      targets: pieces,
      opacity: 1,
      translateY: 0,
      translateX: 0,
      rotate: 0,
      scale: 1,
      duration: 750,
      delay: anime.stagger(70, { start: 40 }),
      easing: 'easeOutExpo',
      complete: function () { clearInlineMotionStyles(pieces); }
    });
  }

  // バリエーションB: Appleの製品ページ風「ぼかし解除＋ズームアウト」。
  // ぼかしの解除(filter)はCSS側(.js-reveal-blur)のtransitionに任せ、
  // ここでは拡縮だけをanime.jsで担当する。目立つ1枚パネル(.saiyou)向け。
  function focusPullReveal(el) {
    el.classList.add('is-visible');
    if (!hasAnime) return;
    anime.set(el, { scale: 1.08 });
    anime({
      targets: el,
      scale: 1,
      duration: 1100,
      easing: 'easeOutExpo',
      complete: function () { clearInlineMotionStyles(el); }
    });
  }

  // バリエーションC: カードが下から立ち上がりながら少し回転して収まる演出。
  // クリップパスのワイプ(CSS側 .js-reveal-clip)と組み合わせて使う。
  // 外枠(.product)にはcardFloatの常時ループがあるため、動きは内側の
  // リンク要素に与えて干渉させない。
  function riseAndSettleReveal(el, index) {
    el.classList.add('is-visible');
    if (!hasAnime) return;
    var inner = el.children.length ? el.children[0] : el;
    var dir = index % 2 === 0 ? 1 : -1;
    anime.set(inner, { opacity: 0, translateY: 46, rotate: dir * 6 });
    anime({
      targets: inner,
      opacity: 1,
      translateY: 0,
      rotate: 0,
      duration: 850,
      easing: 'easeOutBack',
      complete: function () { clearInlineMotionStyles(inner); }
    });
  }

  // バリエーションD: 回転しながら収束する、レーダー的な演出。相互リンク
  // カード(.sougo)向け。
  function spinConvergeReveal(el, index) {
    el.classList.add('is-visible');
    if (!hasAnime) return;
    var dir = index % 2 === 0 ? 1 : -1;
    anime.set(el, { opacity: 0, scale: 0.8, rotate: dir * 18 });
    anime({
      targets: el,
      opacity: 1,
      scale: 1,
      rotate: 0,
      duration: 900,
      easing: 'easeOutElastic(1, .7)',
      complete: function () { clearInlineMotionStyles(el); }
    });
  }

  function playReveal(el, index) {
    if (el.classList.contains('saiyou')) {
      focusPullReveal(el);
    } else if (el.classList.contains('product')) {
      riseAndSettleReveal(el, index);
    } else if (el.classList.contains('sougo')) {
      spinConvergeReveal(el, index);
    } else {
      geometricReveal(el, index);
    }
  }

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          playReveal(entry.target, revealTargets.indexOf(entry.target));
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -5% 0px' });
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealTargets.forEach(function (el, i) { playReveal(el, i); });
  }

  // ---- サービス紹介動画：画面内でのみ再生 ＋ 字幕キャプション ----
  var showcaseWrap = document.querySelector('.showcase-video-wrap');
  if (!showcaseWrap) return;

  var showcase = setupResponsiveVideoPair(showcaseWrap, true);
  if (!showcase) return;

  var captions = [
    { start: 0,    end: 4,     text: 'できるだけ依存せず、期待しすぎない。' },
    { start: 4,    end: 9.5,   text: 'PusyuuIPS ― SNSにも掲示板にもなるミニブログ' },
    { start: 9.5,  end: 19.1,  text: 'プシューメモ ― クラッシュに強いブラウザメモ帳' },
    { start: 19.1, end: 28.6,  text: 'ツールボックス ― 壁紙も変えられる万能アプリ集' },
    { start: 28.6, end: 38.2,  text: 'グアピーガエル ― あなたのグローバルIPを瞬時に確認' },
    { start: 38.2, end: 47.7,  text: 'プシューコント ― 弟制作のゆるいアニメ動画' },
    { start: 47.7, end: 53.7,  text: '効果音ダウンロード ― フリーのSE素材を配布中' },
    { start: 53.7, end: 57.75, text: 'プシューサービスに「完成」はありません。進化し続けます。' }
  ];

  var captionStyle = document.createElement('style');
  captionStyle.textContent =
    '.showcase-caption{position:absolute;left:0;right:0;bottom:0;padding:14px 18px;' +
    'background:linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0));color:#fff;' +
    'font-size:16px;line-height:1.5;text-align:center;opacity:0;transition:opacity .4s ease;pointer-events:none;}' +
    '.showcase-caption.is-active{opacity:1;}' +
    '.showcase-caption>span{color:#00ff00;}';
  document.head.appendChild(captionStyle);

  var captionEl = document.createElement('div');
  captionEl.className = 'showcase-caption';
  showcaseWrap.appendChild(captionEl);

  var currentText = null;
  function updateCaption(t) {
    var match = null;
    for (var i = 0; i < captions.length; i++) {
      if (t >= captions[i].start && t < captions[i].end) { match = captions[i]; break; }
    }
    if (match) {
      if (match.text !== currentText) {
        currentText = match.text;
        captionEl.innerHTML = '<span>▸</span> ' + match.text;
      }
      captionEl.classList.add('is-active');
    } else {
      captionEl.classList.remove('is-active');
    }
  }

  showcase.videos.forEach(function (video) {
    video.addEventListener('timeupdate', function () {
      if (video.dataset.variant === showcase.activeVariant()) {
        updateCaption(video.currentTime);
      }
    });
  });
});
