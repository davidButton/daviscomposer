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
