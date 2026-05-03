(function () {
  const FEATURES = [
    { icon: '✦', titleKey: 'AI-Powered Feed', descKey: 'Your feed learns what you love. Articles ranked by relevance, not recency - so you always read what matters.', premium: false },
    { icon: '⌘', titleKey: 'Smart Semantic Search', descKey: 'Find articles by meaning, not just keywords. Ask in plain language and surface exactly what you need.', premium: false },
    { icon: '◌', titleKey: 'Global Trend Map', descKey: 'See what every country is reading in real-time. Explore regional knowledge patterns on an interactive world map.', premium: true },
    { icon: '≈', titleKey: 'Trend Radar', descKey: 'Emerging topics detected before they go mainstream. Know what the world will talk about - before it does.', premium: false },
    { icon: '♪', titleKey: 'AI Podcast Player', descKey: 'Every article transformed into a natural podcast. Choose your voice, speed, and style - listen on the go.', premium: true },
    { icon: '▣', titleKey: 'Professional Templates', descKey: '9 expert article layouts - from listicles to case studies. Start from structure, not a blank page.', premium: true },
  ];

  function translateExact(value) {
    const locale = IBlog.I18n?.getLocale?.() || 'en';
    const exact = {
      fr: {
        'AI-Powered Feed': 'Fil alimente par l\'IA',
        'Your feed learns what you love. Articles ranked by relevance, not recency - so you always read what matters.': 'Votre fil apprend ce que vous aimez. Les articles sont classes par pertinence et non par recence.',
        'Smart Semantic Search': 'Recherche semantique',
        'Find articles by meaning, not just keywords. Ask in plain language and surface exactly what you need.': 'Trouvez des articles par intention et non par simples mots-cles.',
        'Global Trend Map': 'Carte mondiale des tendances',
        'See what every country is reading in real-time. Explore regional knowledge patterns on an interactive world map.': 'Voyez ce que chaque pays lit en temps reel sur une carte interactive.',
        'Trend Radar': 'Radar des tendances',
        'Emerging topics detected before they go mainstream. Know what the world will talk about - before it does.': 'Reperez les sujets emergents avant qu\'ils ne deviennent evidents.',
        'AI Podcast Player': 'Lecteur podcast IA',
        'Every article transformed into a natural podcast. Choose your voice, speed, and style - listen on the go.': 'Chaque article devient un podcast naturel avec voix et rythme au choix.',
        'Professional Templates': 'Modeles professionnels',
        '9 expert article layouts - from listicles to case studies. Start from structure, not a blank page.': '9 mises en page expertes pour partir d\'une structure plutot que d\'une page vide.',
        'Explore feature ->': 'Voir la fonction ->',
      },
      de: {
        'AI-Powered Feed': 'KI-gestuetzter Feed',
        'Your feed learns what you love. Articles ranked by relevance, not recency - so you always read what matters.': 'Dein Feed lernt, was dich interessiert, und priorisiert Relevanz statt nur Aktualitaet.',
        'Smart Semantic Search': 'Semantische Suche',
        'Find articles by meaning, not just keywords. Ask in plain language and surface exactly what you need.': 'Finde Inhalte nach Bedeutung statt nur nach Schlagwoertern.',
        'Global Trend Map': 'Globale Trendkarte',
        'See what every country is reading in real-time. Explore regional knowledge patterns on an interactive world map.': 'Sieh in Echtzeit, was in jedem Land gelesen wird.',
        'Trend Radar': 'Trendradar',
        'Emerging topics detected before they go mainstream. Know what the world will talk about - before it does.': 'Erkenne kommende Themen, bevor sie ueberall auftauchen.',
        'AI Podcast Player': 'KI-Podcast-Player',
        'Every article transformed into a natural podcast. Choose your voice, speed, and style - listen on the go.': 'Jeder Artikel wird zu einem natuerlichen Podcast.',
        'Professional Templates': 'Professionelle Vorlagen',
        '9 expert article layouts - from listicles to case studies. Start from structure, not a blank page.': '9 professionelle Layouts fuer strukturierte Artikel.',
        'Explore feature ->': 'Funktion ansehen ->',
      },
      ar: {
        'AI-Powered Feed': 'خلاصة مدعومة بالذكاء الاصطناعي',
        'Your feed learns what you love. Articles ranked by relevance, not recency - so you always read what matters.': 'الخلاصة تتعلم ما تحب، وتعرض المقالات حسب الصلة لا حسب الوقت فقط.',
        'Smart Semantic Search': 'بحث دلالي ذكي',
        'Find articles by meaning, not just keywords. Ask in plain language and surface exactly what you need.': 'ابحث بالمعنى لا بالكلمات المفتاحية فقط.',
        'Global Trend Map': 'خريطة الاتجاهات العالمية',
        'See what every country is reading in real-time. Explore regional knowledge patterns on an interactive world map.': 'اكتشف ما يقرؤه كل بلد في الوقت الحقيقي عبر خريطة تفاعلية.',
        'Trend Radar': 'رادار الاتجاهات',
        'Emerging topics detected before they go mainstream. Know what the world will talk about - before it does.': 'التقط المواضيع الصاعدة قبل أن تصبح سائدة.',
        'AI Podcast Player': 'مشغل بودكاست بالذكاء الاصطناعي',
        'Every article transformed into a natural podcast. Choose your voice, speed, and style - listen on the go.': 'كل مقال يتحول إلى بودكاست طبيعي مع تحكم كامل في الصوت والسرعة.',
        'Professional Templates': 'قوالب احترافية',
        '9 expert article layouts - from listicles to case studies. Start from structure, not a blank page.': 'تسعة تخطيطات احترافية تبدأ منها مباشرة بدل الصفحة الفارغة.',
        'Explore feature ->': 'استكشف الميزة ->',
      },
      ja: {
        'AI-Powered Feed': 'AIフィード',
        'Your feed learns what you love. Articles ranked by relevance, not recency - so you always read what matters.': 'フィードは興味を学習し、新しさより関連性で記事を並べます。',
        'Smart Semantic Search': '意味検索',
        'Find articles by meaning, not just keywords. Ask in plain language and surface exactly what you need.': 'キーワードだけでなく意味から記事を探せます。',
        'Global Trend Map': 'グローバルトレンドマップ',
        'See what every country is reading in real-time. Explore regional knowledge patterns on an interactive world map.': '各国で読まれている内容をリアルタイムで可視化します。',
        'Trend Radar': 'トレンドレーダー',
        'Emerging topics detected before they go mainstream. Know what the world will talk about - before it does.': '一般化する前の話題を先に捉えます。',
        'AI Podcast Player': 'AIポッドキャスト',
        'Every article transformed into a natural podcast. Choose your voice, speed, and style - listen on the go.': 'すべての記事を自然なポッドキャストとして聴けます。',
        'Professional Templates': 'プロ向けテンプレート',
        '9 expert article layouts - from listicles to case studies. Start from structure, not a blank page.': '9種類のテンプレートで空白から始めずに書けます。',
        'Explore feature ->': '機能を見る ->',
      }
    };

    return exact[locale]?.[value] || value;
  }

  function init() {
    const root = document.getElementById('features-root');
    if (!root) return;

    root.innerHTML = `
      <section class="features-section" id="features">
        <div class="features-header reveal">
          <span class="section-eyebrow">${IBlog.I18n?.t?.('nav.features') || 'Features'}</span>
          <h2 class="section-headline">${IBlog.I18n?.t?.('hero.kicker') || 'Driven by curiosity'}</h2>
          <div class="section-divider"></div>
        </div>
        <div class="feat-grid" id="feat-grid"></div>
      </section>
    `;

    const grid = document.getElementById('feat-grid');
    if (!grid) return;

    grid.innerHTML = FEATURES.map((feature) => `
      <div class="feat-card ${feature.premium ? 'premium-feat' : ''}" onclick="showSignup?.()">
        ${feature.premium ? `<div class="feat-premium-label">${IBlog.I18n?.t?.('nav.premium') || 'Premium'}</div>` : ''}
        <div class="feat-card-top"><span style="font-size:22px;color:var(--accent);font-weight:700">${feature.icon}</span></div>
        <h3>${translateExact(feature.titleKey)}</h3>
        <p>${translateExact(feature.descKey)}</p>
        <div class="feat-card-arrow">${translateExact('Explore feature ->')}</div>
      </div>
    `).join('');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  IBlog.Features = { init };
})();
