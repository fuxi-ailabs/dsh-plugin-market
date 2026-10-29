// dt-verify docs: mobile menu, copy buttons, "on this page" highlight.
(function () {
  var menu = document.querySelector(".menu");
  if (menu) {
    menu.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      menu.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".side a").forEach(function (a) {
      a.addEventListener("click", function () { document.body.classList.remove("nav-open"); });
    });
  }

  document.querySelectorAll(".code .copy").forEach(function (button) {
    button.addEventListener("click", function () {
      var code = button.closest(".code").querySelector("pre");
      var reset = function (label) { button.textContent = label; setTimeout(function () { button.textContent = "复制"; }, 1500); };
      var select = function () {
        var range = document.createRange(); range.selectNodeContents(code);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        reset("已选中");
      };
      try { navigator.clipboard.writeText(code.textContent).then(function () { reset("已复制"); }, select); }
      catch (e) { select(); }
    });
  });

  // The demo loops muted; respect the reduced-motion setting by leaving it paused.
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll("video[autoplay]").forEach(function (video) { video.removeAttribute("autoplay"); video.pause(); });
  }

  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
  if (links.length && "IntersectionObserver" in window) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var visible = {};
    var mark = function () {
      var first = null;
      document.querySelectorAll(".doc h2[id]").forEach(function (h) { if (!first && visible[h.id]) first = h.id; });
      if (!first) return;
      links.forEach(function (a) { a.classList.toggle("on", a === byId[first]); });
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      mark();
    }, { rootMargin: "-110px 0px -55% 0px" });
    document.querySelectorAll(".doc h2[id]").forEach(function (h) { io.observe(h); });
  }
})();
