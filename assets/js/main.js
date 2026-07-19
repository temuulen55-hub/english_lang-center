/* Tenger English Academy — interactions.
   No framework, no backend. Progressive enhancement over server-rendered MN. */

(function () {
  'use strict';

  var I18N = window.I18N;
  var DATA = window.SITE_DATA;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = 'mn';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  function t(key) {
    var dict = I18N[lang] || {};
    return dict[key] != null ? dict[key] : (I18N.mn[key] != null ? I18N.mn[key] : key);
  }

  /* ============ Language ============ */

  function applyLang(next) {
    lang = next;
    var doc = document.documentElement;

    document.body.classList.add('lang-switching');

    window.setTimeout(function () {
      doc.setAttribute('lang', lang === 'mn' ? 'mn' : 'en');

      $$('[data-i18n]').forEach(function (el) {
        var v = t(el.getAttribute('data-i18n'));
        if (typeof v === 'string') el.textContent = v;
      });
      $$('[data-i18n-html]').forEach(function (el) {
        var v = t(el.getAttribute('data-i18n-html'));
        if (typeof v === 'string') { el.innerHTML = v; }
      });
      $$('[data-i18n-alt]').forEach(function (el) { el.setAttribute('alt', t(el.getAttribute('data-i18n-alt'))); });
      $$('[data-i18n-ph]').forEach(function (el) { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))); });
      $$('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });

      // re-run count-ups that just got reset by innerHTML swap
      primeCounters();

      // language toggle chrome
      $$('.lang-btn').forEach(function (b) {
        var on = b.getAttribute('data-lang') === lang;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      $('.lang-switch').setAttribute('data-active', lang);

      // dynamic surfaces
      renderLevel(currentLevel, true);
      resetChat();

      window.setTimeout(function () { document.body.classList.remove('lang-switching'); }, 20);
    }, reduceMotion ? 0 : 180);

    try { localStorage.setItem('tenger-lang', lang); } catch (e) {}
  }

  $$('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = btn.getAttribute('data-lang');
      if (next !== lang) applyLang(next);
    });
  });

  /* ============ Nav scroll state + scrollspy ============ */

  var nav = $('.nav');
  var sections = $$('main section[id]');
  var navLinks = $$('.nav-links a');

  function onScroll() {
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.getAttribute('id');
        navLinks.forEach(function (a) {
          a.classList.toggle('is-current', a.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ============ Mobile menu ============ */

  var burger = $('.burger');
  var mobileMenu = $('#mobile-menu');

  function setMenu(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : t('a11y.openMenu'));
    if (open) { mobileMenu.hidden = false; requestAnimationFrame(function () { mobileMenu.classList.add('is-open'); }); }
    else { mobileMenu.classList.remove('is-open'); window.setTimeout(function () { mobileMenu.hidden = true; }, 300); }
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('#mobile-menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  $('#mobile-menu [data-open-quiz]').addEventListener('click', function () { setMenu(false); });

  /* ============ Reveal on scroll ============ */

  var reveals = $$('.reveal');
  reveals.forEach(function (el, i) {
    var siblings = $$('.reveal', el.parentElement);
    el.style.setProperty('--stagger', siblings.indexOf(el));
  });
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in-view'); obs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { revObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ============ Hero rotating word ============ */

  var rotateEl = $('[data-rotate]');
  if (rotateEl && !reduceMotion) {
    var ri = 0;
    window.setInterval(function () {
      var words = t('hero.rotate');
      if (!Array.isArray(words) || words.length < 2) return;
      ri = (ri + 1) % words.length;
      var next = words[ri];
      rotateEl.classList.add('is-leaving');
      window.setTimeout(function () {
        rotateEl.textContent = next;
        rotateEl.classList.remove('is-leaving');
        rotateEl.classList.add('is-entering');
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { rotateEl.classList.remove('is-entering'); });
        });
      }, 340);
    }, 2600);
  }

  /* ============ Count-up ============ */

  function animateCount(el) {
    if (el.dataset.counted) return;
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (reduceMotion) { el.textContent = target.toLocaleString(); el.dataset.counted = '1'; return; }
    el.dataset.counted = '1';
    var start = performance.now(), dur = 1400;
    function step(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var countObs = null;
  function primeCounters() {
    var counters = $$('.count');
    if ('IntersectionObserver' in window) {
      if (countObs) countObs.disconnect();
      countObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { animateCount(e.target); countObs.unobserve(e.target); } });
      }, { threshold: 0.6 });
      counters.forEach(function (c) { delete c.dataset.counted; countObs.observe(c); });
    } else {
      counters.forEach(animateCount);
    }
  }
  primeCounters();

  /* ============ Marquee duplication (seamless loop) ============ */

  // Duplicate each track once so the row holds two identical copies side by side.
  // The -100% marquee translate then loops seamlessly.
  $$('.strip-row').forEach(function (row) {
    var track = $('.strip-track', row);
    if (track) {
      var clone = track.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      row.appendChild(clone);
    }
  });

  /* ============ Program peek (cursor-follow thumbnail) ============ */

  var peek = $('.program-peek');
  var peekActive = false;
  if (peek && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.program-row').forEach(function (row) {
      var src = row.getAttribute('data-peek');
      row.addEventListener('mouseenter', function () {
        peek.src = src; peekActive = true;
        peek.classList.add('is-visible');
      });
      row.addEventListener('mouseleave', function () {
        peekActive = false; peek.classList.remove('is-visible');
      });
    });
    window.addEventListener('mousemove', function (e) {
      if (!peekActive) return;
      peek.style.left = (e.clientX + 22) + 'px';
      peek.style.top = (e.clientY - 90) + 'px';
    }, { passive: true });
  }

  /* ============ Program dialog ============ */

  var programDialog = $('#program-dialog');
  var programBody = $('[data-program-body]');

  function openProgram(key) {
    var p = DATA.programs[key];
    if (!p) return;
    var bullets = p.bullets[lang].map(function (b) { return '<li>' + b + '</li>'; }).join('');
    programBody.innerHTML =
      '<div class="program-hero"><img src="' + p.img + '" alt="' + p.name[lang] + '">' +
      '<span class="level-tag">' + p.level + '</span></div>' +
      '<div class="program-detail">' +
        '<h2 id="program-dialog-title">' + p.name[lang] + '</h2>' +
        '<p>' + p.about[lang] + '</p>' +
        '<ul>' + bullets + '</ul>' +
        '<dl class="program-facts">' +
          '<div><dt>' + (lang === 'mn' ? 'Хуваарь' : 'Schedule') + '</dt><dd>' + p.schedule[lang] + '</dd></div>' +
          '<div><dt>' + (lang === 'mn' ? 'Төлбөр' : 'Price') + '</dt><dd class="mono">' + p.price[lang] + '</dd></div>' +
        '</dl>' +
        '<button type="button" class="btn btn-primary" data-open-quiz>' + t('pricing.cta') + '</button>' +
      '</div>';
    showDialog(programDialog);
  }

  $$('.program-row').forEach(function (row) {
    row.addEventListener('click', function () { openProgram(row.getAttribute('data-program')); });
  });

  /* ============ CEFR levels ============ */

  var currentLevel = 'b1';
  var levelPanel = $('#level-panel');

  function renderLevel(key, instant) {
    var lv = DATA.levels[key];
    if (!lv) return;
    currentLevel = key;
    var apply = function () {
      $('[data-level-code]').textContent = lv.code;
      $('[data-level-name]').textContent = lv.name[lang];
      $('[data-level-cando]').textContent = lv.cando[lang];
      $('[data-level-duration]').textContent = lv.duration[lang];
      $('[data-level-ielts]').textContent = lv.ielts;
    };
    if (instant) { apply(); return; }
    levelPanel.classList.add('is-switching');
    window.setTimeout(function () {
      apply();
      levelPanel.classList.remove('is-switching');
    }, reduceMotion ? 0 : 140);
  }

  $$('.level-dot').forEach(function (dot) {
    dot.addEventListener('click', function () {
      $$('.level-dot').forEach(function (d) {
        d.classList.remove('is-active');
        d.setAttribute('aria-selected', 'false');
      });
      dot.classList.add('is-active');
      dot.setAttribute('aria-selected', 'true');
      renderLevel(dot.getAttribute('data-level'));
    });
  });
  renderLevel('b1', true);

  /* ============ FAQ ============ */

  $$('.faq-item').forEach(function (item) {
    var q = $('.faq-q', item);
    q.addEventListener('click', function () {
      var open = item.classList.toggle('is-open');
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ============ Dialog helpers ============ */

  var lastFocus = null;

  function showDialog(dlg) {
    lastFocus = document.activeElement;
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
    document.body.style.overflow = 'hidden';
  }
  function hideDialog(dlg) {
    if (typeof dlg.close === 'function') dlg.close();
    else dlg.removeAttribute('open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  $$('[data-close-dialog]').forEach(function (btn) {
    btn.addEventListener('click', function () { hideDialog(btn.closest('.dialog')); });
  });
  $$('.dialog').forEach(function (dlg) {
    // click on backdrop closes
    dlg.addEventListener('click', function (e) {
      var r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) hideDialog(dlg);
    });
    dlg.addEventListener('cancel', function () { document.body.style.overflow = ''; });
  });

  // delegate any [data-open-quiz] (some are injected)
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-open-quiz]');
    if (trigger) {
      if (programDialog.open) hideDialog(programDialog);
      openQuiz();
    }
  });

  /* ============ Placement quiz ============ */

  var quizDialog = $('#quiz-dialog');
  var quizBody = $('[data-quiz-body]');
  var quizBar = $('[data-quiz-bar]');
  var quizStep = $('[data-quiz-step]');
  var quizState = { idx: 0, score: 0 };

  function openQuiz() {
    quizState = { idx: 0, score: 0 };
    renderQuizQuestion();
    showDialog(quizDialog);
  }

  function renderQuizQuestion() {
    var q = DATA.quiz.questions[quizState.idx];
    var total = DATA.quiz.questions.length;
    quizStep.textContent = (quizState.idx + 1) + ' / ' + total;
    quizBar.style.width = ((quizState.idx) / total * 100) + '%';

    var intro = quizState.idx === 0 ? '<p class="quiz-intro">' + DATA.quiz.intro[lang] + '</p>' : '';
    var letters = ['A', 'B', 'C', 'D'];
    var opts = q.options.map(function (opt, i) {
      return '<button type="button" class="quiz-option" data-choice="' + i + '">' +
        '<span class="mono">' + letters[i] + '</span>' + opt + '</button>';
    }).join('');
    opts += '<button type="button" class="quiz-option" data-choice="-1">' +
      '<span class="mono">?</span>' + DATA.quiz.dontKnow[lang] + '</button>';

    quizBody.innerHTML = intro +
      '<p class="quiz-question">' + q.q + '</p>' +
      '<div class="quiz-options">' + opts + '</div>';

    $$('.quiz-option', quizBody).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var choice = parseInt(btn.getAttribute('data-choice'), 10);
        if (choice === q.correct) quizState.score++;
        quizState.idx++;
        quizBar.style.width = (quizState.idx / total * 100) + '%';
        if (quizState.idx < total) renderQuizQuestion();
        else renderQuizResult();
      });
    });
  }

  function renderQuizResult() {
    var score = quizState.score;
    var levelKey = DATA.quiz.levelMap[score] || 'b1';
    var lv = DATA.levels[levelKey];
    var progKey = DATA.quiz.programByLevel[levelKey] || 'general';
    var prog = DATA.programs[progKey];

    quizStep.textContent = t('quiz.title');
    quizBar.style.width = '100%';

    quizBody.innerHTML =
      '<div class="quiz-result">' +
        '<p class="quiz-result-level mono">' + lv.code + '</p>' +
        '<p class="quiz-result-name">' + DATA.quiz.resultTitle[lang] + ': ' + lv.name[lang] + '</p>' +
        '<p class="quiz-result-note">' + DATA.quiz.resultNote[lang] + '</p>' +
        '<div class="quiz-recommend"><span>' + DATA.quiz.recommendLabel[lang] + '</span><b>' + prog.name[lang] + '</b></div>' +
        '<form class="quiz-form" data-quiz-form novalidate>' +
          '<h3>' + DATA.quiz.formTitle[lang] + '</h3>' +
          '<label>' + DATA.quiz.nameLabel[lang] + '<input type="text" name="name" required autocomplete="name"></label>' +
          '<label>' + DATA.quiz.phoneLabel[lang] + '<input type="tel" name="phone" required autocomplete="tel" placeholder="+976 ..."></label>' +
          '<button type="submit" class="btn btn-primary">' + DATA.quiz.submit[lang] + '</button>' +
        '</form>' +
        '<button type="button" class="quiz-restart" data-quiz-restart>' + DATA.quiz.restart[lang] + '</button>' +
      '</div>';

    $('[data-quiz-form]', quizBody).addEventListener('submit', function (e) {
      e.preventDefault();
      var name = this.name.value.trim();
      if (!name) { this.name.focus(); return; }
      hideDialog(quizDialog);
      showToast(DATA.quiz.success[lang]);
    });
    $('[data-quiz-restart]', quizBody).addEventListener('click', openQuiz);
  }

  /* ============ Toast ============ */

  var toast = $('[data-toast]');
  var toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove('is-visible'); }, 4200);
  }

  /* ============ Global ESC ============ */

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (burger.getAttribute('aria-expanded') === 'true') setMenu(false);
    if (chatOpen) toggleChat(false);
  });

  /* ============ Chatbot ============ */

  var chatLauncher = $('.chat-launcher');
  var chatPanel = $('#chat-panel');
  var chatLog = $('[data-chat-log]');
  var chatQuick = $('[data-chat-quick]');
  var chatForm = $('[data-chat-form]');
  var chatInput = $('[data-chat-input]');
  var chatOpen = false;
  var chatSeeded = false;

  function toggleChat(open) {
    chatOpen = open;
    chatLauncher.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      chatPanel.hidden = false;
      requestAnimationFrame(function () { chatPanel.hidden = false; });
      if (!chatSeeded) { seedChat(); chatSeeded = true; }
      window.setTimeout(function () { chatInput.focus(); }, 260);
    } else {
      chatPanel.hidden = true;
    }
  }
  chatLauncher.addEventListener('click', function () { toggleChat(!chatOpen); });

  function addMsg(text, who) {
    var el = document.createElement('div');
    el.className = 'chat-msg chat-msg-' + who + ' is-new';
    el.textContent = text;
    chatLog.appendChild(el);
    requestAnimationFrame(function () { el.classList.remove('is-new'); });
    chatLog.scrollTop = chatLog.scrollHeight;
    return el;
  }

  function renderQuickChips() {
    chatQuick.innerHTML = '';
    Object.keys(DATA.chat.intents).forEach(function (k) {
      var intent = DATA.chat.intents[k];
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chat-chip';
      chip.textContent = intent.label[lang];
      chip.addEventListener('click', function () { handleUser(intent.label[lang], k); });
      chatQuick.appendChild(chip);
    });
  }

  function seedChat() {
    chatLog.innerHTML = '';
    addMsg(DATA.chat.greeting[lang], 'bot');
    renderQuickChips();
  }
  function resetChat() {
    if (!chatSeeded) return;
    seedChat();
  }

  function matchIntent(text) {
    var low = text.toLowerCase();
    var keys = Object.keys(DATA.chat.intents);
    for (var i = 0; i < keys.length; i++) {
      var intent = DATA.chat.intents[keys[i]];
      for (var j = 0; j < intent.keywords.length; j++) {
        if (low.indexOf(intent.keywords[j].toLowerCase()) !== -1) return keys[i];
      }
    }
    return null;
  }

  function botReply(intentKey) {
    var typing = document.createElement('div');
    typing.className = 'chat-msg chat-msg-bot chat-typing';
    typing.innerHTML = '<i></i><i></i><i></i>';
    chatLog.appendChild(typing);
    chatLog.scrollTop = chatLog.scrollHeight;

    window.setTimeout(function () {
      typing.remove();
      if (intentKey && DATA.chat.intents[intentKey]) {
        var intent = DATA.chat.intents[intentKey];
        addMsg(intent.reply[lang], 'bot');
        if (intent.action === 'quiz') {
          var cta = document.createElement('button');
          cta.type = 'button';
          cta.className = 'chat-chip';
          cta.style.marginTop = '2px';
          cta.textContent = t('nav.cta');
          cta.addEventListener('click', function () { toggleChat(false); openQuiz(); });
          chatQuick.innerHTML = '';
          chatQuick.appendChild(cta);
          window.setTimeout(renderQuickChips, 60);
          return;
        }
      } else {
        addMsg(DATA.chat.fallback[lang], 'bot');
      }
      renderQuickChips();
    }, reduceMotion ? 120 : 620);
  }

  function handleUser(text, forcedIntent) {
    addMsg(text, 'user');
    chatQuick.innerHTML = '';
    var intentKey = forcedIntent || matchIntent(text);
    botReply(intentKey);
  }

  chatForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    handleUser(text);
  });

  /* ============ Restore saved language ============ */

  try {
    var saved = localStorage.getItem('tenger-lang');
    if (saved === 'en') applyLang('en');
  } catch (e) {}

})();
