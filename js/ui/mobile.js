/**
 * 见仁建智 · 手机浏览器适配
 * ---------------------------------------------------------------------------
 * 这个文件只做手机端才有意义的三件事，不参与任何工程判定：
 *   1) 把左栏三块面板收进抽屉：点顶栏按钮展开，点遮罩 / Esc / 面板内的按钮后收起；
 *   2) 抽屉打开时锁住页面滚动，避免手指滑动时背景跟着跑；
 *   3) 抽屉收起后把焦点还给触发按钮，键盘与读屏用户不会迷失位置。
 *
 * 桌面布局完全不受影响：所有尺寸判断都走 matchMedia，宽屏下点击按钮直接放行。
 */
(function (root) {
  'use strict';

  var MOBILE_QUERY = '(max-width: 640px)';

  // 挂载点可能在脚本执行之后才出现（无头冒烟测试就是这种情况），
  // 因此把初始化做成可重复调用的幂等操作，绝不在任何浏览器里抛异常。
  function init() {
    var toggle = document.getElementById('navToggle');
    var backdrop = document.getElementById('navBackdrop');
    var panel = document.getElementById('navPanel') || document.querySelector('.col-left');

    // 结构缺失（例如被裁剪过的静态页面）时安静退出
    if (!toggle || !backdrop || !panel) return false;

    // 垫片 / 老浏览器可能没有 matchMedia：此时按桌面宽屏处理，抽屉永不自动打开
    var mq = null;
    if (typeof root.matchMedia === 'function') {
      try { mq = root.matchMedia(MOBILE_QUERY); } catch (e) { mq = null; }
    }

    function isMobile() { return mq ? !!mq.matches : false; }
    function isOpen() { return document.body.classList.contains('is-nav-open'); }

    function setOpen(open) {
      var next = !!open && isMobile();
      document.body.classList.toggle('is-nav-open', next);
      toggle.setAttribute('aria-expanded', next ? 'true' : 'false');
      toggle.setAttribute('aria-label', next ? '收起面板导航' : '打开面板导航');
      if (next) {
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-label', '面板导航');
      } else {
        panel.removeAttribute('role');
        panel.removeAttribute('aria-modal');
        panel.removeAttribute('aria-label');
        if (isMobile() && document.activeElement && panel.contains(document.activeElement)) toggle.focus();
      }
      return next;
    }

    // 每次 init 都重新绑定会叠加监听器；先解绑上一次的，保证幂等
    toggle.removeEventListener('click', toggle._jrNavToggle);
    toggle._jrNavToggle = function () { setOpen(!isOpen()); };
    toggle.addEventListener('click', toggle._jrNavToggle);

    backdrop.removeEventListener('click', backdrop._jrNavClose);
    backdrop._jrNavClose = function () { setOpen(false); };
    backdrop.addEventListener('click', backdrop._jrNavClose);

    panel.removeEventListener('click', panel._jrNavItem);
    panel._jrNavItem = function (event) {
      if (!isOpen()) return;
      var el = event.target;
      // 抽屉里点选场景 / 开始编排后自动收起，手指就不会被挡住内容
      if (el && el.closest && el.closest('button')) setOpen(false);
    };
    panel.addEventListener('click', panel._jrNavItem);

    // Esc 与断点变化对"被打开状态"的处理每次 init 都重新绑定，避免闭包里的状态过期
    document.removeEventListener('keydown', document._jrNavEsc);
    document._jrNavEsc = function (event) {
      if (event.key === 'Escape' && isOpen()) setOpen(false);
    };
    document.addEventListener('keydown', document._jrNavEsc);

    var onChange = function () { if (!isMobile()) setOpen(false); };
    if (mq) {
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }

    // 只暴露给无头冒烟测试用的最小接口，业务代码不依赖它
    root.JR_MOBILE = root.JR_MOBILE || {};
    root.JR_MOBILE.isMobile = isMobile;
    root.JR_MOBILE.isOpen = isOpen;
    root.JR_MOBILE.setOpen = setOpen;
    root.JR_MOBILE.init = init;
    return true;
  }

  // 无论挂载点是否已经存在，都先把入口暴露出去：无头冒烟测试会在挂载点就绪后
  // 再调用一次 init()，而真实页面里这次调用发生在 DOMContentLoaded。
  root.JR_MOBILE = root.JR_MOBILE || {};
  root.JR_MOBILE.init = init;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else if (document.readyState === 'interactive' || document.readyState === 'complete') init();
})(window);
