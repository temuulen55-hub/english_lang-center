/* Тэнгэр — Англи хэлний академи. Interactions.
   No framework, no backend. Mongolian ships in the markup; English is applied on toggle. */

(function () {
  'use strict';

  var I18N = window.I18N;
  var DATA = window.SITE_DATA;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = 'mn';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function t(key) {
    var d = I18N[lang] || {};
    if (d[key] != null) return d[key];
    return I18N.mn[key] != null ? I18N.mn[key] : key;
  }

  /* ================= Language ================= */

  function paintStaticStrings() {
    $$('[data-i18n]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n'));
      if (typeof v === 'string') el.textContent = v;
    });
    $$('[data-i18n-alt]').forEach(function (el) { el.setAttribute('alt', t(el.getAttribute('data-i18n-alt'))); });
    $$('[data-i18n-ph]').forEach(function (el) { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))); });
    $$('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
  }

  function paintDynamic() {
    renderExams();
    renderSchedule();
    renderLevel(currentLevel, true);
    resetChat();
    primeCounters();
  }

  function applyLang(next) {
    lang = next;
    document.body.classList.add('lang-switching');

    window.setTimeout(function () {
      document.documentElement.setAttribute('lang', lang);
      paintStaticStrings();
      paintDynamic();

      $$('.lang-btn').forEach(function (b) {
        var on = b.getAttribute('data-lang') === lang;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      $('.lang-switch').setAttribute('data-active', lang);

      window.setTimeout(function () { document.body.classList.remove('lang-switching'); }, 20);
    }, reduceMotion ? 0 : 190);

    try { localStorage.setItem('tenger-lang', lang); } catch (e) {}
  }

  $$('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = btn.getAttribute('data-lang');
      if (next !== lang) applyLang(next);
    });
  });

  /* ================= Nav ================= */

  var nav = $('.nav');
  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 60); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var navLinks = $$('.nav-links a');
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
    $$('main section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* ================= Mobile menu ================= */

  var burger = $('.burger');
  var mobileMenu = $('#mobile-menu');

  function setMenu(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', t(open ? 'a11y.closeMenu' : 'a11y.openMenu'));
    if (open) {
      mobileMenu.hidden = false;
      requestAnimationFrame(function () { mobileMenu.classList.add('is-open'); });
    } else {
      mobileMenu.classList.remove('is-open');
      window.setTimeout(function () { mobileMenu.hidden = true; }, 300);
    }
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  $$('#mobile-menu a, #mobile-menu button').forEach(function (el) {
    el.addEventListener('click', function () { setMenu(false); });
  });

  /* ================= Reveal ================= */

  var reveals = $$('.reveal');
  reveals.forEach(function (el) {
    var sibs = $$('.reveal', el.parentElement);
    el.style.setProperty('--stagger', sibs.indexOf(el));
  });
  function revealAll() { reveals.forEach(function (el) { el.classList.add('in-view'); }); }

  if ('IntersectionObserver' in window && !reduceMotion) {
    document.documentElement.classList.add('reveal-on');
    var revObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in-view'); obs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    reveals.forEach(function (el) { revObs.observe(el); });
    window.setTimeout(revealAll, 2500);
  } else {
    revealAll();
  }

  /* ================= Count up ================= */

  function animateCount(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (reduceMotion) { el.textContent = target.toLocaleString('en-US'); return; }
    var start = performance.now(), dur = 1500;
    (function step(now) {
      var p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  var countObs = null;
  function primeCounters() {
    var counters = $$('.count');
    if (!('IntersectionObserver' in window)) { counters.forEach(animateCount); return; }
    if (countObs) countObs.disconnect();
    countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); countObs.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { delete c.dataset.counted; countObs.observe(c); });
  }

  /* ================= Exams strip ================= */

  function renderExams() {
    var list = $('[data-exams]');
    if (!list) return;
    list.innerHTML = DATA.exams.map(function (name) { return '<li>' + name + '</li>'; }).join('');
  }

  /* ================= Schedule table ================= */

  function renderSchedule() {
    var body = $('[data-schedule-body]');
    if (!body) return;
    body.innerHTML = DATA.schedule.map(function (row) {
      var seats = row.seats;
      var badge;
      if (seats === 0) {
        badge = '<span class="seat-badge is-full">' + t('schedule.full') + '</span>';
      } else {
        var cls = seats <= 3 ? ' is-low' : '';
        badge = '<span class="seat-badge' + cls + '">' + seats + ' ' + t('schedule.seatsLeft') + '</span>';
      }
      return '<tr>' +
        '<td class="sched-time">' + row.time + '</td>' +
        '<td class="sched-program">' + t('schedule.' + row.p) + '</td>' +
        '<td class="sched-days">' + t('schedule.' + row.d) + '</td>' +
        '<td>' + badge + '</td>' +
        '</tr>';
    }).join('');
  }

  /* ================= Program peek + dialog ================= */

  var peek = $('.program-peek');
  var peekOn = false;
  if (peek && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.program-row').forEach(function (row) {
      var src = row.getAttribute('data-peek');
      row.addEventListener('mouseenter', function () {
        peek.src = src; peekOn = true; peek.classList.add('is-visible');
      });
      row.addEventListener('mouseleave', function () {
        peekOn = false; peek.classList.remove('is-visible');
      });
    });
    window.addEventListener('mousemove', function (e) {
      if (!peekOn) return;
      peek.style.left = (e.clientX + 24) + 'px';
      peek.style.top = (e.clientY - 85) + 'px';
    }, { passive: true });
  }

  var programDialog = $('#program-dialog');
  var programBody = $('[data-program-body]');

  function openProgram(key) {
    var p = DATA.programs[key];
    if (!p) return;
    var bullets = p.bullets[lang].map(function (b) { return '<li>' + b + '</li>'; }).join('');
    programBody.innerHTML =
      '<div class="program-hero"><img src="' + p.img + '" alt="">' +
        '<span class="level-tag">' + p.level + '</span></div>' +
      '<div class="program-detail">' +
        '<h2>' + p.name[lang] + '</h2>' +
        '<p>' + p.about[lang] + '</p>' +
        '<ul>' + bullets + '</ul>' +
        '<dl class="program-facts">' +
          '<div><dt>' + (lang === 'mn' ? 'Хуваарь' : 'Schedule') + '</dt><dd>' + p.schedule[lang] + '</dd></div>' +
          '<div><dt>' + (lang === 'mn' ? 'Төлбөр' : 'Price') + '</dt><dd class="mono">' + p.price[lang] + '</dd></div>' +
        '</dl>' +
        '<button type="button" class="btn btn-solid" data-open-quiz>' + t('nav.cta') + '</button>' +
      '</div>';
    showDialog(programDialog);
  }

  $$('.program-row').forEach(function (row) {
    row.addEventListener('click', function () { openProgram(row.getAttribute('data-program')); });
  });

  /* ================= Levels ================= */

  var currentLevel = 'b1';
  var levelPanel = $('.level-panel');

  function renderLevel(key, instant) {
    var lv = DATA.levels[key];
    if (!lv || !levelPanel) return;
    currentLevel = key;
    function apply() {
      $('[data-level-code]').textContent = lv.code;
      $('[data-level-name]').textContent = lv.name[lang];
      $('[data-level-cando]').textContent = lv.cando[lang];
      $('[data-level-duration]').textContent = lv.duration[lang];
      $('[data-level-ielts]').textContent = lv.ielts;
    }
    if (instant || reduceMotion) { apply(); return; }
    levelPanel.classList.add('is-switching');
    window.setTimeout(function () {
      apply();
      levelPanel.classList.remove('is-switching');
    }, 140);
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

  /* ================= FAQ ================= */

  $$('.faq-item').forEach(function (item) {
    var q = $('.faq-q', item);
    q.addEventListener('click', function () {
      var open = item.classList.toggle('is-open');
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ================= Dialog helpers ================= */

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
    dlg.addEventListener('click', function (e) {
      if (e.target !== dlg) return; // only the backdrop area of the dialog box itself
      var r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        hideDialog(dlg);
      }
    });
    dlg.addEventListener('close', function () { document.body.style.overflow = ''; });
  });

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-open-quiz]');
    if (!trigger) return;
    if (programDialog.open) hideDialog(programDialog);
    openQuiz();
  });

  /* ================= Quiz ================= */

  var quizDialog = $('#quiz-dialog');
  var quizBody = $('[data-quiz-body]');
  var quizBar = $('[data-quiz-bar]');
  var quizStep = $('[data-quiz-step]');
  var quiz = { idx: 0, score: 0 };

  function openQuiz() {
    quiz = { idx: 0, score: 0 };
    renderQuestion();
    showDialog(quizDialog);
  }

  function renderQuestion() {
    var total = DATA.quiz.questions.length;
    var q = DATA.quiz.questions[quiz.idx];
    quizStep.textContent = (quiz.idx + 1) + ' / ' + total;
    quizBar.style.width = (quiz.idx / total * 100) + '%';

    var letters = ['A', 'B', 'C', 'D'];
    var opts = q.options.map(function (opt, i) {
      return '<button type="button" class="quiz-option" data-choice="' + i + '">' +
        '<span class="mono">' + letters[i] + '</span><span>' + opt + '</span></button>';
    }).join('');
    opts += '<button type="button" class="quiz-option" data-choice="-1">' +
      '<span class="mono">?</span><span>' + DATA.quiz.dontKnow[lang] + '</span></button>';

    quizBody.innerHTML =
      (quiz.idx === 0 ? '<p class="quiz-intro">' + DATA.quiz.intro[lang] + '</p>' : '') +
      '<p class="quiz-question">' + q.q + '</p>' +
      '<div class="quiz-options">' + opts + '</div>';

    $$('.quiz-option', quizBody).forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (parseInt(btn.getAttribute('data-choice'), 10) === q.correct) quiz.score++;
        quiz.idx++;
        quizBar.style.width = (quiz.idx / total * 100) + '%';
        if (quiz.idx < total) renderQuestion();
        else renderResult();
      });
    });
  }

  function renderResult() {
    var levelKey = DATA.quiz.levelMap[quiz.score] || 'b1';
    var lv = DATA.levels[levelKey];
    var prog = DATA.programs[DATA.quiz.programByLevel[levelKey] || 'general'];

    quizStep.textContent = t('quiz.title');
    quizBar.style.width = '100%';

    quizBody.innerHTML =
      '<div class="quiz-result">' +
        '<p class="quiz-result-level">' + lv.code + '</p>' +
        '<p class="quiz-result-name">' + DATA.quiz.resultTitle[lang] + ': ' + lv.name[lang] + '</p>' +
        '<p class="quiz-result-note">' + DATA.quiz.resultNote[lang] + '</p>' +
        '<div class="quiz-recommend"><span>' + DATA.quiz.recommendLabel[lang] + '</span><b>' + prog.name[lang] + '</b></div>' +
        '<form class="quiz-form" data-quiz-form novalidate>' +
          '<h3>' + DATA.quiz.formTitle[lang] + '</h3>' +
          '<label>' + DATA.quiz.nameLabel[lang] + '<input type="text" name="name" autocomplete="name" required></label>' +
          '<label>' + DATA.quiz.phoneLabel[lang] + '<input type="tel" name="phone" autocomplete="tel" placeholder="+976 ..." required></label>' +
          '<button type="submit" class="btn btn-solid">' + DATA.quiz.submit[lang] + '</button>' +
        '</form>' +
        '<button type="button" class="quiz-restart" data-quiz-restart>' + DATA.quiz.restart[lang] + '</button>' +
      '</div>';

    $('[data-quiz-form]', quizBody).addEventListener('submit', function (e) {
      e.preventDefault();
      if (!this.name.value.trim()) { this.name.focus(); return; }
      hideDialog(quizDialog);
      showToast(DATA.quiz.success[lang]);
    });
    $('[data-quiz-restart]', quizBody).addEventListener('click', openQuiz);
  }

  /* ================= Toast ================= */

  var toast = $('[data-toast]');
  var toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove('is-visible'); }, 4500);
  }

  /* ================= Chat ================= */

  var chatLauncher = $('.chat-launcher');
  var chatPanel = $('#chat-panel');
  var chatLog = $('[data-chat-log]');
  var chatQuick = $('[data-chat-quick]');
  var chatInput = $('[data-chat-input]');
  var chatOpen = false;
  var chatSeeded = false;

  function toggleChat(open) {
    chatOpen = open;
    chatLauncher.setAttribute('aria-expanded', open ? 'true' : 'false');
    chatPanel.hidden = !open;
    if (open) {
      if (!chatSeeded) { seedChat(); chatSeeded = true; }
      window.setTimeout(function () { chatInput.focus(); }, 280);
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
  }

  function renderChips() {
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
    renderChips();
  }
  function resetChat() { if (chatSeeded) seedChat(); }

  function matchIntent(text) {
    var low = text.toLowerCase();
    var keys = Object.keys(DATA.chat.intents);
    for (var i = 0; i < keys.length; i++) {
      var kw = DATA.chat.intents[keys[i]].keywords;
      for (var j = 0; j < kw.length; j++) {
        if (low.indexOf(kw[j].toLowerCase()) !== -1) return keys[i];
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
      var intent = intentKey && DATA.chat.intents[intentKey];
      if (intent) {
        addMsg(intent.reply[lang], 'bot');
        if (intent.action === 'quiz') {
          chatQuick.innerHTML = '';
          var cta = document.createElement('button');
          cta.type = 'button';
          cta.className = 'chat-chip';
          cta.textContent = t('nav.cta');
          cta.addEventListener('click', function () { toggleChat(false); openQuiz(); });
          chatQuick.appendChild(cta);
          return;
        }
      } else {
        addMsg(DATA.chat.fallback[lang], 'bot');
      }
      renderChips();
    }, reduceMotion ? 120 : 640);
  }

  function handleUser(text, forced) {
    addMsg(text, 'user');
    chatQuick.innerHTML = '';
    botReply(forced || matchIntent(text));
  }

  $('[data-chat-form]').addEventListener('submit', function (e) {
    e.preventDefault();
    var text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    handleUser(text);
  });

  /* ================= Escape ================= */

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (burger.getAttribute('aria-expanded') === 'true') setMenu(false);
    if (chatOpen) toggleChat(false);
  });

  /* ================= Boot ================= */

  renderExams();
  renderSchedule();
  renderLevel('b1', true);
  primeCounters();

  try {
    if (localStorage.getItem('tenger-lang') === 'en') applyLang('en');
  } catch (e) {}

})();
