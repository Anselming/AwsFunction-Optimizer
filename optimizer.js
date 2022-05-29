'use strict';
const AWS = require('aws-sdk');
const {basename, extname} = require('path');
const S3 = new AWS.S3();
const sharp = require("sharp");


module.exports.handle = async ({Records: records}, context) => {

  console.log('1 - nem começou!');
  try{
    await Promise.all(records.map(async record => {

      console.log('2 - começando!');

      // Código principal aqui
      const { key } = record.s3.object;
      console.log('3 - pegou o objeto bruto! ->' + key);

      const image = await S3.getObject({
        Bucket: process.env.bucket,
        Key: key,
      }).promise();
      console.log('4 - pegou o objeto de verdade! ->' + process.env.bucket);

      const optimized = await sharp(image.Body)
                                .resize(1280,720, {fit: 'inside', withoutEnlargement: true})
                                .toFormat('jpeg', {progressive: true, quality: 50})
                                .toBuffer();
      console.log('5 - transformou o objeto! ->' + image.Body);
                              
      await S3.putObject({
        Body: optimized,
        Bucket: process.env.bucket,
        ContentType: 'image/jpeg',
        Key: `compressed/${basename(key, extname(key))}.jpg`
      },
      (err, data)=>
      {
        console.log('err do putObject: ' + err);
        console.log('data do putObject: ' + data);

      });

      console.log('6 - jogou pra pasta COMPRESSED! ->'+ `compressed/${basename(key, extname(key))}.jpg`);

    }));

    console.log('7 - Tudo finalizado, indo para o sucesso!');

    return{
      statusCode: 301,
      body: "Sucesso!"
    };

  }catch(err)
  {
    console.log('! Erro! ' + err);
    return {
      statusCode: 400,
      body : err
    };
  }


};
