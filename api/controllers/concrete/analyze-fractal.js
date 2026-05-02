const Jimp = require('jimp');

// Убрали "async" у главной функции, чтобы Sails не отправлял ответ раньше времени
module.exports = function (req, res) {

  // 1. Загружаем файл
  req.file('image').upload({
    maxBytes: 10000000, // ограничение 10 МБ
    dirname: require('path').resolve(sails.config.paths.tmp, 'uploads')
  }, async (err, uploadedFiles) => {
    // Если ошибка загрузки файла
    if (err) return res.serverError(err);
    if (uploadedFiles.length === 0) return res.badRequest('Изображение не загружено');

    const filePath = uploadedFiles[0].fd;
    const threshold = req.body.threshold ? parseInt(req.body.threshold) : 128;

    try {
      // 2. Читаем изображение с помощью Jimp
      const image = await Jimp.read(filePath);
      const width = image.bitmap.width;
      const height = image.bitmap.height;

      // Создаем бинарную матрицу (0 - бетон, 1 - пора)
      const binaryMatrix = new Uint8Array(width * height);

      let idx = 0;
      image.scan(0, 0, width, height, function (x, y, idxData) {
        const r = this.bitmap.data[idxData + 0];
        const g = this.bitmap.data[idxData + 1];
        const b = this.bitmap.data[idxData + 2];
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        binaryMatrix[idx++] = brightness < threshold ? 1 : 0;
      });

      // 3. Алгоритм Box-Counting
      const boxSizes = [];
      let currentSize = 2;
      const minDimension = Math.min(width, height);

      while (currentSize < minDimension) {
        boxSizes.push(currentSize);
        currentSize *= 2;
      }

      const logS = [];
      const logN = [];

      boxSizes.forEach(size => {
        let boxesWithPixels = 0;
        for (let y = 0; y < height; y += size) {
          for (let x = 0; x < width; x += size) {
            let hasPixel = false;
            checkBlock: for (let by = 0; by < size && (y + by) < height; by++) {
              for (let bx = 0; bx < size && (x + bx) < width; bx++) {
                const matrixIdx = (y + by) * width + (x + bx);
                if (binaryMatrix[matrixIdx] === 1) {
                  hasPixel = true;
                  break checkBlock;
                }
              }
            }
            if (hasPixel) boxesWithPixels++;
          }
        }
        logS.push(Math.log(1 / size));
        logN.push(Math.log(boxesWithPixels));
      });

      // 4. Линейная регрессия
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      const count = logS.length;

      for (let i = 0; i < count; i++) {
        sumX += logS[i];
        sumY += logN[i];
        sumXY += logS[i] * logN[i];
        sumXX += logS[i] * logS[i];
      }

      const slope = Math.abs((count * sumXY - sumX * sumY) / (count * sumXX - sumX * sumX));
      // 5. Возвращаем результат браузеру
      return res.json({
        success: true,
        dimension: slope.toFixed(4),
        graphData: {
          x: logS,
          y: logN
        }
      });

    } catch (error) {
      // Теперь эта ошибка не обрушит сервер!
      return res.serverError('Ошибка при обработке изображения: ' + error.message);
    }
  });
};
