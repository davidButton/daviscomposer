/* ============================================================
   SCRIPT.JS — единственная задача этого файла:
   следить, какая секция сейчас видна на экране,
   и подсвечивать её пункт в меню жёлтым (класс .active).
   Это называется scroll-spy («шпион за прокруткой»).

   Синтаксис JS похож на Python, но:
   - блоки выделяются {фигурными скобками}, а не отступами
   - переменные объявляются через const (константа) или let
   - в конце строк ставится ; (не обязательно, но принято)
   ============================================================ */

// Собираем все секции и все ссылки меню.
// document — это вся страница; querySelectorAll ищет элементы по CSS-селектору
// (как find_all в BeautifulSoup, если ты его трогал в Python)
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');

// IntersectionObserver — встроенный в браузер «наблюдатель».
// Мы говорим ему: «сообщай мне, когда секция входит в определённую зону экрана».
// Это эффективнее, чем проверять позицию скролла вручную на каждый пиксель.
const observer = new IntersectionObserver(
  (entries) => {
    // entries — список секций, у которых только что изменилась видимость
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Секция вошла в зону → берём её id (например "soundtracks")
        const id = entry.target.id;

        // Снимаем подсветку со всех пунктов меню...
        navLinks.forEach((link) => link.classList.remove('active'));

        // ...и вешаем класс .active на пункт, чья ссылка ведёт на эту секцию.
        // В CSS уже написано: .nav-link.active { color: жёлтый }
        const activeLink = document.querySelector(`.nav-link[href="#${id}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
        }
      }
    });
  },
  {
    // rootMargin сужает «зону срабатывания»: секция считается активной,
    // когда она пересекает горизонтальную полосу примерно в центре экрана.
    // -40% сверху и -55% снизу → остаётся узкая полоса на уровне глаз.
    rootMargin: '-40% 0px -55% 0px',
  }
);

// Просим наблюдателя следить за каждой секцией
sections.forEach((section) => observer.observe(section));



/* ============================================================
   ПАРАЛЛАКС ФОНОВЫХ КАРТИНОК
   Фон движется в ту же сторону, что и скролл, но медленнее.
   ============================================================ */

// Скорость параллакса: 0 = фон неподвижен в блоке, 1 = приклеен к экрану.
// 0.15 = фон проезжает 15% от скорости прокрутки. Крути на вкус: 0.1–0.3.
const PARALLAX_SPEED = 0.15;

// Собираем все помеченные блоки
const parallaxBlocks = document.querySelectorAll('[data-parallax]');

function updateParallax() {
  // Высота окна — понадобится, чтобы считать положение секции относительно центра
  const viewportHeight = window.innerHeight;

  parallaxBlocks.forEach((block) => {
    // getBoundingClientRect() отдаёт положение блока относительно ОКНА:
    // .top — сколько пикселей от верха экрана до верха блока
    const rect = block.getBoundingClientRect();

    // Пропускаем блоки далеко за пределами экрана — незачем их трогать
    if (rect.bottom < 0 || rect.top > viewportHeight) return;

    // Насколько центр блока смещён от центра экрана (в пикселях).
    // Когда блок ровно в центре экрана — 0, выше — минус, ниже — плюс.
    const offsetFromCenter = rect.top + rect.height / 2 - viewportHeight / 2;

    // Сдвигаем фон на долю этого смещения.
    // 'center calc(50% + Npx)' = по горизонтали центр, по вертикали центр + сдвиг
    const shift = -offsetFromCenter * PARALLAX_SPEED;
    block.style.backgroundPosition = `center calc(50% + ${shift}px)`;
  });
}

// requestAnimationFrame — «выполни перед следующей отрисовкой кадра».
// Это правильный способ анимировать на скролле: не чаще 60 раз в секунду
// и без подтормаживаний, в отличие от голого события scroll.
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(() => {
      updateParallax();
      ticking = false;
    });
  }
});

// И один раз при загрузке, чтобы фоны сразу встали в правильные позиции
updateParallax();




/* ============================================================
   DAW-СЦЕНА: плейхед + подсветка клипов под ним
   ============================================================ */

const playhead = document.querySelector('.playhead');
const clips = document.querySelectorAll('.clip');

// Параметры движения (в координатах SVG, viewBox 1920x900)
const PH_START = 120;    // старт плейхеда
const PH_END = 1800;     // конец
const PH_DURATION = 40;  // секунд на проход

// Заранее считываем у каждого клипа его границы по X.
// Первый rect внутри группы .clip — тело клипа: берём его x и width
const clipZones = [];
clips.forEach((clip) => {
  const body = clip.querySelector('rect');
  const x = parseFloat(body.getAttribute('x'));
  const w = parseFloat(body.getAttribute('width'));
  clipZones.push({ element: clip, from: x, to: x + w });
});

function animatePlayhead(timestamp) {
  // timestamp — миллисекунды с загрузки страницы, даёт сам браузер.
  // % — остаток от деления: превращает бесконечное время в цикл 0..40с
  const seconds = (timestamp / 1000) % PH_DURATION;
  const progress = seconds / PH_DURATION;                // 0..1
  const x = PH_START + (PH_END - PH_START) * progress;   // позиция плейхеда

  playhead.setAttribute('transform', `translate(${x}, 0)`);

  // Подсветка: класс playing тем клипам, внутри которых сейчас линия
  clipZones.forEach((zone) => {
    zone.element.classList.toggle('playing', x >= zone.from && x <= zone.to);
  });

  requestAnimationFrame(animatePlayhead); // просим следующий кадр — вечный цикл
}

if (playhead) {
  requestAnimationFrame(animatePlayhead);
}