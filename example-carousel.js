export const nextExample = (index, step, count) => (index + step + count) % count;

if (typeof document !== 'undefined') {
  document.addEventListener('click', event => {
    const button = event.target.closest('.example-step');
    if (!button || button.disabled) return;
    const carousel = button.closest('.example-carousel');
    const slides = [...carousel.querySelectorAll('.example-slide')];
    if (!slides.length) return;
    const next = nextExample(Number(carousel.dataset.index || 0), Number(button.dataset.step), slides.length);
    slides.forEach((slide, index) => {
      slide.querySelectorAll('video,audio').forEach(media => media.pause());
      slide.hidden = index !== next;
    });
    carousel.dataset.index = String(next);
    carousel.querySelector('.example-count').textContent = `${next + 1} / ${slides.length}`;
  });
  document.addEventListener('toggle', event => {
    if (event.target.matches?.('.listing-examples') && !event.target.open) {
      event.target.querySelectorAll('video,audio').forEach(media => media.pause());
    }
  }, true);
}
