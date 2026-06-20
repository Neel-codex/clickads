/* =========================================================================
   DogeHash - Main JavaScript
   ========================================================================= */
(function () {
  'use strict';

  // Base URL injected by PHP via <body data-base="...">
  function baseUrl() {
    return document.body.getAttribute('data-base') || '';
  }

  // ---- Animated counters (homepage stats) ----
  function animateCounters() {
    document.querySelectorAll('[data-counter]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-counter')) || 0;
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var duration = 1500;
      var start = 0;
      var startTime = null;

      function step(ts) {
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var value = start + (target - start) * progress;
        el.textContent = formatNumber(value, decimals);
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function formatNumber(num, decimals) {
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  // ---- Hashrate calculator (homepage + buy page) ----
  function initCalculator() {
    var input = document.getElementById('calcGhs');
    var result = document.getElementById('calcResult');
    if (!input || !result) return;

    var perDoge = parseFloat(input.getAttribute('data-per-doge')) || 100;

    function recalc() {
      var ghs = parseFloat(input.value) || 0;
      var cost = ghs / perDoge;
      result.textContent = formatNumber(cost, 4) + ' DOGE';
    }
    input.addEventListener('input', recalc);
    recalc();
  }

  // ---- Buy hashrate page calculator ----
  function initBuyCalculator() {
    var input = document.getElementById('buyGhs');
    var costEl = document.getElementById('buyCost');
    if (!input || !costEl) return;
    var perDoge = parseFloat(input.getAttribute('data-per-doge')) || 100;
    function recalc() {
      var ghs = parseFloat(input.value) || 0;
      costEl.textContent = formatNumber(ghs / perDoge, 4);
    }
    input.addEventListener('input', recalc);
    recalc();
  }

  // ---- Live mining panel (dashboard) ----
  function initLiveMining() {
    var panel = document.getElementById('miningPanel');
    if (!panel) return;

    var balanceEl = document.getElementById('liveBalance');
    var dailyRate = parseFloat(panel.getAttribute('data-daily')) || 0; // DOGE/day
    var balance = parseFloat(panel.getAttribute('data-balance')) || 0;
    var perSecond = dailyRate / 86400;
    var lastTick = Date.now();

    // Smooth client-side increment for a "live" feel.
    function tick() {
      var now = Date.now();
      var elapsed = (now - lastTick) / 1000;
      lastTick = now;
      balance += perSecond * elapsed;
      if (balanceEl) balanceEl.textContent = formatNumber(balance, 8) + ' DOGE';
      requestAnimationFrame(tick);
    }
    if (dailyRate > 0) requestAnimationFrame(tick);

    // Periodically sync real balance from server.
    setInterval(function () {
      fetch(baseUrl() + '/ajax/mining-status.php', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.success) {
            balance = parseFloat(data.balance);
            dailyRate = parseFloat(data.daily);
            perSecond = dailyRate / 86400;
            var hrEl = document.getElementById('liveHashrate');
            if (hrEl) hrEl.textContent = data.hashrate_formatted + ' GH/s';
          }
        })
        .catch(function () {});
    }, 30000);
  }

  // ---- Copy to clipboard ----
  function initCopy() {
    document.querySelectorAll('[data-copy]').forEach(function (el) {
      el.addEventListener('click', function () {
        var text = el.getAttribute('data-copy') || el.value;
        navigator.clipboard.writeText(text).then(function () {
          var original = el.getAttribute('data-original') || el.innerHTML;
          el.setAttribute('data-original', original);
          if (el.tagName === 'INPUT') {
            el.classList.add('border-success');
            setTimeout(function () { el.classList.remove('border-success'); }, 1200);
          } else {
            el.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
            setTimeout(function () { el.innerHTML = original; }, 1200);
          }
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    animateCounters();
    initCalculator();
    initBuyCalculator();
    initLiveMining();
    initCopy();
  });
})();
