document.addEventListener('DOMContentLoaded', () => {
    const slider = document.querySelector('.js-slider');
    if (!slider) return;

    const img = slider.querySelector('.js-slider-img');
    const nextBtn = slider.querySelector('.js-next');
    const prevBtn = slider.querySelector('.js-prev');
    const dotsContainer = slider.querySelector('.js-dots');
    const autoplayCheck = slider.querySelector('.js-autoplay');
    
    const images = JSON.parse(slider.dataset.images || '[]');
    let currentIndex = 0;
    let interval = null;

    const updateSlider = (index) => {
        currentIndex = (index + images.length) % images.length;
        
        img.style.opacity = '0';
        setTimeout(() => {
            img.src = images[currentIndex];
            img.style.opacity = '1';
        }, 200);

        slider.querySelectorAll('.dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    };

    const startAutoplay = () => {
        stopAutoplay();
        if (autoplayCheck.checked) {
            interval = setInterval(() => updateSlider(currentIndex + 1), 5000);
        }
    };

    const stopAutoplay = () => clearInterval(interval);

    nextBtn.onclick = () => { updateSlider(currentIndex + 1); startAutoplay(); };
    prevBtn.onclick = () => { updateSlider(currentIndex - 1); startAutoplay(); };
    
    dotsContainer.onclick = (e) => {
        if (e.target.classList.contains('dot')) {
            updateSlider(parseInt(e.target.dataset.index));
            startAutoplay();
        }
    };

    autoplayCheck.onchange = startAutoplay;
    
    startAutoplay();
});