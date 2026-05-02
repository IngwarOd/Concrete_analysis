/* global axios */

document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('uploadForm');

  // 🔴 Daca nu avem nicio forma — iesim (nu trebuim eroare)
  if (!form) {
    console.warn('uploadForm не найден на странице');
    return;
  }

  let originalPixels = null; // переменная для хранения серых пикселей

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fileInput = document.querySelector('input[type="file"]');

    if (!fileInput || fileInput.files.length === 0) {
      alert('Выбери файл!');
      return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('image', file);

    const resultText = document.getElementById('result');
    if (resultText) {resultText.innerText = 'Загрузка...';}

    axios.post('/upload-image', formData)
      .then((response) => {
        if (resultText) {
          resultText.innerText = 'Размер: ' + response.data.size + ' байт. Настройте порог белого.';
        }

        // читаем файл, чтобы сразу отрисовать в канвас
        // (работает даже если бэкенд пока не отдает ссылку на файл)
        const reader = new FileReader();
        reader.onload = function(event) {
          initCanvas(event.target.result);
        };
        reader.readAsDataURL(file);
      })
      .catch((error) => {
        console.error('Ошибка загрузки:', error);
        if (resultText) {resultText.innerText = 'Ошибка загрузки!';}
      });
  });

  // Функция инициализации Canvas и перевода в Ч/Б
  function initCanvas(imageSrc) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function() {
      // подгоняем размер
      canvas.width = img.width;
      canvas.height = img.height;

      // рисуем исходник
      ctx.drawImage(img, 0, 0);

      // переводим в оттенки серого
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i+1] + data[i+2]) / 3;
        data[i] = avg;     // R
        data[i+1] = avg;   // G
        data[i+2] = avg;   // B
      }
      ctx.putImageData(imageData, 0, 0);

      //
      // eslint-disable-next-line no-undef
      originalPixels = new Uint8ClampedArray(ctx.getImageData(0, 0, canvas.width, canvas.height).data);

      // шоу блок с ползунком
      document.getElementById('analysis-section').style.display = 'block';

      // алаинг стандрт порог
      applyThreshold(128);
    };
    img.src = imageSrc;
  }

  // Threshold
  function applyThreshold(threshold) {
    const canvas = document.getElementById('canvas');
    if (!canvas || !originalPixels) {return;}

    const ctx = canvas.getContext('2d');
    // eslint-disable-next-line no-undef
    const newImageData = new ImageData(new Uint8ClampedArray(originalPixels), canvas.width, canvas.height);
    const data = newImageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // БЕРЕМ Р И СРАВНИВАЕМ С ПОРОГОМ
      const color = data[i] >= threshold ? 255 : 0;
      data[i] = color;       // R
      data[i+1] = color;     // G
      data[i+2] = color;     // B
      // data[i+3] - прозрачность, НЕ ТРОГАТЬ
    }

    ctx.putImageData(newImageData, 0, 0);
  }

  // Обработчик ползунка
  const thresholdRange = document.getElementById('thresholdRange');
  if (thresholdRange) {
    thresholdRange.addEventListener('input', (e) => {
      const val = e.target.value;
      document.getElementById('thresholdValue').innerText = val; // Обновляем цифру на экране
      applyThreshold(parseInt(val)); // Перерисовываем canvas
    });
  }

  // сохранить
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const threshold = document.getElementById('thresholdRange').value;
      const resultText = document.getElementById('result');

      if (resultText) {resultText.innerText = 'Сохранение результата и запись в БД...';}

      // белый ---> бэкенд
      axios.post('/save-analysis', { threshold: threshold })
        .then((res) => {
          //  вывод данных
          if (resultText) {
            resultText.innerHTML = `
              <span style="color: #73f873;"><b>Анализ успешно сохранён в БД!</b></span><br>
                Путь к файлу: <b>${res.data.record.finalPath}</b><br>
                Хэш: <b>${res.data.record.hash}</b><br>
                Порог белого: <b>${res.data.record.threshold}</b>
            `;
          }
          document.getElementById('analysis-section').style.display = 'none';
          console.log('Данные успешно улетели в БД:', res.data.record);
        })
        .catch((err) => {
          console.error('Ошибка сохранения:', err);
          if (resultText) {resultText.innerText = 'Ошибка при сохранении или записи в БД!';}
        });
    });
  }

});
