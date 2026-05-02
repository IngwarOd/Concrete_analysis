/**
 * ImagehandlerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

module.exports = {

  upload: async function (req, res) {
    req.file('image').upload({
      dirname: path.resolve(sails.config.appPath, '.tmp/public/images/temp'),
      maxBytes: 15000000 // 15MB
    }, async function whenDone(err, uploadedFiles) {

      if (err) {
        return res.serverError(err);
      }
      if (uploadedFiles.length === 0) {
        return res.badRequest('Файл не загружен');
      }

      const file = uploadedFiles[0];
      const filename = path.basename(file.fd);

      const grayscalePath = path.resolve(sails.config.appPath, '.tmp/public/images/temp', 'gray_' + filename);

      if (!fs.existsSync(path.dirname(grayscalePath))) {
        fs.mkdirSync(path.dirname(grayscalePath), { recursive: true });
      }

      try {
        await sharp(file.fd)
          .grayscale()
          .toFile(grayscalePath);

        req.session.tempFilePath = grayscalePath;
        req.session.originalFileName = file.filename;
        req.session.fileSize = file.size;

      } catch (sharpErr) {
        console.error('Ошибка при обработке изображения библиотекой sharp:', sharpErr);
        return res.serverError('Не удалось обработать изображение');
      }


      return res.json({
        size: file.size
      });
    });
  },


  saveAnalysis: async function(req, res) {
    const threshold = parseInt(req.body.threshold) || 128;
    const tempPath = req.session.tempFilePath;
    const originalName = req.session.originalFileName;

    if (!tempPath || !fs.existsSync(tempPath) || !originalName) {
      return res.badRequest('Исходный файл не найден. Пожалуйста, загрузите картинку заново.');
    }

    try {
      // 1. Получаем расширение из оригинального имени файла (например, '.jpg' или '.png')
      // переводим в нижний регистр на всякий случай (.JPG -> .jpg)
      const ext = path.extname(originalName).toLowerCase() || '.png';

      // 2. Генерируем уникальный хэш для файла (используем имя и текущее время для уникальности)
      const hash = crypto.createHash('md5').update(originalName + Date.now()).digest('hex');

      // 3. Формируем финальное имя файла: ХЭШ + РАСШИРЕНИЕ (например: 7cfca9b...1cb.jpg)
      const finalFileName = hash + ext;

      const finalDirPath = path.resolve(sails.config.appPath, 'assets/images/analysis_result');
      const finalFilePath = path.join(finalDirPath, finalFileName);

      // Создаем папку для готовых анализов, если ее нет
      if (!fs.existsSync(finalDirPath)) {
        fs.mkdirSync(finalDirPath, { recursive: true });
      }

      // 4. Физически сохраняем ч/б картинку на диск
      // Sharp достаточно умный, чтобы понять формат сохранения по расширению в finalFilePath
      await sharp(tempPath)
        .threshold(threshold)
        .toFile(finalFilePath);

      // 5. Сохраняем метаданные в базу данных
      const record = await Analysis.create({
        hash: hash,
        originalName: originalName,
        size: req.session.fileSize || 0,
        threshold: threshold,
        finalPath: '/images/analysis_result/' + finalFileName
      }).fetch();

      // Очищаем пути в сессии
      req.session.tempFilePath = null;
      req.session.originalFileName = null;
      req.session.fileSize = null;

      // Возвращаем успешный ответ ВМЕСТЕ с записью из БД
      return res.json({
        message: 'Анализ успешно сохранен и добавлен в базу данных',
        record: record
      });

    } catch (err) {
      console.error('Ошибка сохранения файла или записи в БД:', err);
      return res.serverError('Ошибка при сохранении итогового файла');
    }
  }

};
