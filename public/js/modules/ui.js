const addEventListeners = () => {
    openFilters.addEventListener('click', () => {
        openFilters.classList.toggle('active');
        filters.classList.toggle('hidden');

        if (openFilters.classList.contains('active')) {
            openTimes.classList.remove('active');
            times.classList.add('hidden');
        }
    });

    openTimes.addEventListener('click', () => {
        openTimes.classList.toggle('active');
        times.classList.toggle('hidden');

        if (openTimes.classList.contains('active')) {
            openFilters.classList.remove('active');
            filters.classList.add('hidden');
        }
    });

    rangeInput.addEventListener('input', (e) => {
        let target = e.target;
        numberInput.value = target.value;

        const min = target.min;
        const max = target.max;
        const val = target.value;

        target.style.backgroundSize = (val - min) * 100 / (max - min) + '% 100%';

        let setSliderSize = Number(target.style.backgroundSize.split('%')[0]) / 50;
        if (setSliderSize === 0) {
            setSliderSize = 1;
        } else if (setSliderSize === 0.4) {
            setSliderSize = 1.2;
        } else if (setSliderSize === 0.8) {
            setSliderSize = 1.4;
        } else if (setSliderSize === 1.2) {
            setSliderSize = 1.6;
        } else if (setSliderSize === 1.6) {
            setSliderSize = 1.8;
        } else if (setSliderSize === 2) {
            setSliderSize = 2;
        }
        rangeInput.style.setProperty('--slider-size', `${setSliderSize}rem`)
    });
}