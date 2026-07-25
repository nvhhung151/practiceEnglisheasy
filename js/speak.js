// ===== English Easy — Phát âm (file riêng, tránh lỗi syntax app.js cache) =====
(function (global) {
  'use strict';

  var speakAudio = null;
  var resumeTimer = null;
  var audioCtx = null;
  var voicesCache = [];

  function refreshVoices() {
    try {
      if (!global.speechSynthesis) return;
      var v = global.speechSynthesis.getVoices() || [];
      if (v.length) voicesCache = v;
    } catch (e) {}
  }

  function pickEnglishVoice() {
    var list = [];
    try {
      list = (global.speechSynthesis && global.speechSynthesis.getVoices()) || voicesCache || [];
    } catch (e) {
      list = voicesCache || [];
    }
    if (!list.length) return null;
    var i;
    for (i = 0; i < list.length; i++) {
      if (/en-US/i.test(list[i].lang) && /Google|Microsoft|Zira|Natural|David|Mark/i.test(list[i].name || '')) {
        return list[i];
      }
    }
    for (i = 0; i < list.length; i++) {
      if (/en-US/i.test(list[i].lang)) return list[i];
    }
    for (i = 0; i < list.length; i++) {
      if (/^en(-|_)/i.test(list[i].lang)) return list[i];
    }
    return null;
  }

  function unlockAudio() {
    try {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (AC) {
        if (!audioCtx) audioCtx = new AC();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        var buf = audioCtx.createBuffer(1, 1, 22050);
        var src = audioCtx.createBufferSource();
        src.buffer = buf;
        src.connect(audioCtx.destination);
        src.start(0);
      }
    } catch (e) {}
    try {
      if (global.speechSynthesis) {
        global.speechSynthesis.resume();
        refreshVoices();
      }
    } catch (e) {}
  }

  function stopAudioEl() {
    try {
      if (speakAudio) {
        speakAudio.pause();
        speakAudio.removeAttribute('src');
        speakAudio.load();
        speakAudio = null;
      }
    } catch (e) {}
  }

  function speakTTS(text) {
    if (!global.speechSynthesis || typeof global.SpeechSynthesisUtterance === 'undefined') {
      return false;
    }
    var synth = global.speechSynthesis;
    refreshVoices();
    try {
      synth.cancel();
    } catch (e) {}
    try {
      synth.resume();
    } catch (e) {}

    setTimeout(function () {
      try {
        var utter = new SpeechSynthesisUtterance(String(text));
        utter.lang = 'en-US';
        utter.rate = 0.88;
        utter.pitch = 1;
        utter.volume = 1;
        var voice = pickEnglishVoice();
        if (voice) {
          utter.voice = voice;
          if (voice.lang) utter.lang = voice.lang;
        }
        if (resumeTimer) clearInterval(resumeTimer);
        resumeTimer = setInterval(function () {
          try {
            if (!synth.speaking) {
              clearInterval(resumeTimer);
              resumeTimer = null;
              return;
            }
            if (synth.paused) synth.resume();
          } catch (e) {}
        }, 250);
        utter.onend = function () {
          if (resumeTimer) {
            clearInterval(resumeTimer);
            resumeTimer = null;
          }
        };
        utter.onerror = function (ev) {
          console.error('TTS error', ev && ev.error);
        };
        synth.speak(utter);
      } catch (e) {
        console.error('TTS throw', e);
      }
    }, 0);
    return true;
  }

  function audioCandidates(text) {
    var q = encodeURIComponent(text);
    return [
      'https://dict.youdao.com/dictvoice?audio=' + q + '&type=2',
      'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=' + q
    ];
  }

  /**
   * Phát âm tiếng Anh.
   * Gọi: speak('hello') hoặc onclick="speak('hello', event)"
   */
  function speak(text, event) {
    if (event) {
      try {
        event.preventDefault();
        event.stopPropagation();
      } catch (e) {}
    }

    var raw = String(text == null ? '' : text).trim();
    if (!raw) return false;

    console.log('[speak]', raw);

    var btn = event && (event.currentTarget || event.target);
    if (btn && btn.classList) {
      btn.classList.add('speaking');
      setTimeout(function () {
        try {
          btn.classList.remove('speaking');
        } catch (e) {}
      }, 1800);
    }

    unlockAudio();
    stopAudioEl();
    try {
      if (global.speechSynthesis) global.speechSynthesis.cancel();
    } catch (e) {}

    var isEnglish = /^[A-Za-z0-9]+(?:[ '\-,.!?A-Za-z0-9]+)*$/.test(raw);
    var useDirect = isEnglish && raw.length <= 80;
    var state = { audio: false, done: false };

    if (useDirect) {
      var urls = audioCandidates(raw);
      var idx = 0;

      function tryNext() {
        if (state.audio || state.done) return;
        if (idx >= urls.length) {
          state.done = true;
          speakTTS(raw);
          return;
        }
        var url = urls[idx++];
        var audio = new Audio();
        speakAudio = audio;
        audio.preload = 'auto';
        audio.src = url;

        var settled = false;
        function fail() {
          if (settled || state.audio) return;
          settled = true;
          console.warn('[speak] audio fail', url);
          tryNext();
        }

        audio.onerror = fail;
        var watchdog = setTimeout(function () {
          if (!state.audio && (audio.paused || audio.currentTime === 0)) {
            try {
              audio.pause();
            } catch (e) {}
            fail();
          }
        }, 2800);

        audio.onplaying = function () {
          if (state.audio) return;
          state.audio = true;
          settled = true;
          clearTimeout(watchdog);
          try {
            if (global.speechSynthesis) global.speechSynthesis.cancel();
          } catch (e) {}
          console.log('[speak] playing', url);
        };
        audio.onended = function () {
          clearTimeout(watchdog);
          state.done = true;
        };

        var p = audio.play();
        if (p && typeof p.then === 'function') p.catch(fail);
      }

      tryNext();

      setTimeout(function () {
        if (state.audio || state.done) return;
        try {
          if (global.speechSynthesis && (global.speechSynthesis.speaking || global.speechSynthesis.pending)) {
            return;
          }
        } catch (e) {}
        state.done = true;
        speakTTS(raw);
      }, 3000);
    } else {
      speakTTS(raw);
    }

    return true;
  }

  // public API
  global.speak = speak;
  global.eeSpeak = speak;

  // Click [data-speak="..."] — an toàn, không dùng onclick inline (tránh SyntaxError)
  function onDocClick(e) {
    var t = e.target;
    if (!t) return;
    var btn = t.closest ? t.closest('[data-speak]') : null;
    if (!btn) {
      // fallback nếu closest không có
      while (t && t !== document && t !== document.body) {
        if (t.getAttribute && t.getAttribute('data-speak') != null) {
          btn = t;
          break;
        }
        t = t.parentNode;
      }
    }
    if (!btn) return;
    var text = btn.getAttribute('data-speak');
    if (!text) return;
    e.preventDefault();
    e.stopPropagation();
    speak(text, e);
  }

  // preload voices + delegation
  try {
    if (global.speechSynthesis) {
      refreshVoices();
      if (global.speechSynthesis.addEventListener) {
        global.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
      } else {
        global.speechSynthesis.onvoiceschanged = refreshVoices;
      }
    }
    document.addEventListener('click', onDocClick, true);
    document.addEventListener(
      'click',
      function once() {
        unlockAudio();
        refreshVoices();
        document.removeEventListener('click', once, true);
      },
      true
    );
  } catch (e) {}
})(typeof window !== 'undefined' ? window : this);
