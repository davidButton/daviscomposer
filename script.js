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

/* ============================================================
   АУДИОПЛЕЕР
   Один код обслуживает все блоки .player на странице.
   ============================================================ */

const players = document.querySelectorAll('.player');
let currentAudio = null; // кто сейчас играет — чтобы ставить его на паузу

// Помощник: 95 секунд -> "1:35"
function formatTime(sec) {
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + String(s).padStart(2, '0'); // padStart добивает "5" до "05"
}

players.forEach((player) => {
  // Создаём невидимый аудио-элемент из data-src
  const audio = new Audio(player.dataset.src);
  audio.preload = 'metadata'; // скачать только заголовок (длительность), не весь файл

  // Находим детали ЭТОГО плеера (ищем внутри player, не по всей странице!)
  const btn = player.querySelector('.player-btn');
  const fill = player.querySelector('.player-progress-fill');
  const progress = player.querySelector('.player-progress');
  const timeCurrent = player.querySelector('.time-current');
  const timeTotal = player.querySelector('.time-total');

  // Когда браузер узнал длительность — показать её
  audio.addEventListener('loadedmetadata', () => {
    timeTotal.textContent = formatTime(audio.duration);
  });

  // Кнопка play/pause
  btn.addEventListener('click', () => {
    if (audio.paused) {
      // Правило хорошего тона: новый трек ставит предыдущий на паузу
      if (currentAudio && currentAudio !== audio) {
        currentAudio.pause();
      }
      audio.play();
      currentAudio = audio;
    } else {
      audio.pause();
    }
  });

  // Синхронизация вида со звуком.
  // События идут от самого audio — интерфейс просто отражает его состояние
  audio.addEventListener('play', () => player.classList.add('is-playing'));
  audio.addEventListener('pause', () => player.classList.remove('is-playing'));

  // Тикает время -> двигаем заливку и цифры
  audio.addEventListener('timeupdate', () => {
    const percent = (audio.currentTime / audio.duration) * 100 || 0;
    fill.style.width = percent + '%';
    timeCurrent.textContent = formatTime(audio.currentTime);
  });

  // Клик по полосе = перемотка
  progress.addEventListener('click', (event) => {
    const rect = progress.getBoundingClientRect();
    // Где кликнули относительно начала полосы, в долях 0..1
    const ratio = (event.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * audio.duration;
  });

  // Трек закончился — вернуть кнопку play и заливку в начало
  audio.addEventListener('ended', () => {
    player.classList.remove('is-playing');
    fill.style.width = '0%';
    audio.currentTime = 0;
  });
});

/* ============================================================
   БУРГЕР-МЕНЮ (мобильные)
   ============================================================ */

const burger = document.querySelector('.nav-burger');
const nav = document.querySelector('.nav');

burger.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open'); // toggle возвращает: класс теперь есть?
  burger.classList.toggle('open', isOpen);
  burger.setAttribute('aria-expanded', isOpen);
});

// Тап по пункту меню: закрыть панель (прокрутку сделает сам браузер по якорю)
navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  });
});