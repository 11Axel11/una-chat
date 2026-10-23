var val = require('../libs/unalib');
var assert = require('assert');


describe('unalib', function(){


  describe('funcion is_valid_phone', function(){

    it('deberia devolver true para 8297-8547', function(){

      assert.equal(val.is_valid_phone('8297-8547'), true);

    });

    it('deberia devolver false para 8297p-8547', function(){

      assert.equal(val.is_valid_phone('8297p-8547'), false);

    });

  });


  describe('funcion is_valid_url_image', function(){

    it('deberia devolver true para http://image.com/image.jpg', function(){

      assert.equal(val.is_valid_url_image('http://image.com/image.jpg'), true);

    });

    it('deberia devolver true para http://image.com/image.gif', function(){

      assert.equal(val.is_valid_url_image('http://image.com/image.gif'), true);

    });

    it('deberia aceptar imagenes con mayusculas, HTTPS y parametros', function(){
      assert.equal(val.is_valid_url_image('https://cdn.example.com/photo.JPEG?width=800'), true);
    });

    it('deberia rechazar extensiones no permitidas o esquemas inseguros', function(){
      assert.equal(val.is_valid_url_image('https://example.com/page.html'), false);
      assert.equal(val.is_valid_url_image('javascript:alert(1).jpg'), false);
      assert.equal(val.is_valid_url_image('data:image/png;base64,abc'), false);
    });
    
  });

  describe('funcion is_valid_yt_video', function(){

    it('deberia devolver true para http://image.com/image.jpg', function(){

      assert.equal(val.is_valid_yt_video('https://www.youtube.com/watch?v=qYwlqx-JLok'), true);

    });

  });

  describe('funcion is_valid_url_video', function(){

    it('deberia aceptar videos directos en formatos permitidos', function(){
      assert.equal(val.is_valid_url_video('https://cdn.example.com/video.mp4'), true);
      assert.equal(val.is_valid_url_video('https://cdn.example.com/video.WEBM?autoplay=false'), true);
    });

    it('deberia rechazar archivos que no sean videos', function(){
      assert.equal(val.is_valid_url_video('https://cdn.example.com/video.txt'), false);
    });

  });

  describe('funcion validateMessage', function(){

    it('deberia eliminar scripts y normalizar datos del mensaje', function(){
      var result = JSON.parse(val.validateMessage(JSON.stringify({
        nombre: '<b>Ana</b>',
        mensaje: '<script>alert(1)</script>Hola',
        color: 'red'
      })));

      assert.equal(result.nombre, 'Ana');
      assert.equal(result.mensaje, 'Hola');
      assert.equal(result.color, '#000000');
      assert.equal(result.tipo, 'texto');
    });

    it('deberia rechazar URLs que no sean multimedia o usen esquemas peligrosos', function(){
      var invalidUrl = JSON.parse(val.validateMessage(JSON.stringify({ mensaje: 'https://example.com/page.html' })));
      var scriptUrl = JSON.parse(val.validateMessage(JSON.stringify({ mensaje: 'javascript:alert(1)' })));

      assert.equal(invalidUrl.mensaje, '');
      assert.equal(scriptUrl.mensaje, '');
    });

    it('deberia clasificar una imagen valida', function(){
      var result = JSON.parse(val.validateMessage(JSON.stringify({ mensaje: 'https://example.com/photo.png?size=large' })));
      assert.equal(result.tipo, 'imagen');
    });

    it('deberia clasificar un video directo y conservar su URL para el reproductor', function(){
      var url = 'https://cdn.example.com/video.mp4';
      var result = JSON.parse(val.validateMessage(JSON.stringify({ mensaje: url })));

      assert.equal(result.tipo, 'video');
      assert.equal(result.mensaje, url);
    });

    it('deberia clasificar YouTube y generar el codigo de reproductor', function(){
      var url = 'https://www.youtube.com/watch?v=qYwlqx-JLok';
      var result = JSON.parse(val.validateMessage(JSON.stringify({ mensaje: url })));

      assert.equal(result.tipo, 'video');
      assert.match(val.getEmbeddedCode(url), /youtube\.com\/embed\/qYwlqx-JLok/);
    });

    it('deberia bloquear intentos de inyeccion de scripts', function(){
      var script = JSON.parse(val.validateMessage(JSON.stringify({
        nombre: '<img src=x onerror=alert(1)>Usuario',
        mensaje: '<script>alert(document.cookie)</script><b>Texto</b>'
      })));
      var javascriptUrl = JSON.parse(val.validateMessage(JSON.stringify({
        mensaje: 'javascript:alert(document.cookie)'
      })));
      var dataUrl = JSON.parse(val.validateMessage(JSON.stringify({
        mensaje: 'data:text/html,<script>alert(1)</script>'
      })));

      assert.equal(script.nombre, 'Usuario');
      assert.equal(script.mensaje, 'Texto');
      assert.equal(script.tipo, 'texto');
      assert.equal(javascriptUrl.mensaje, '');
      assert.equal(dataUrl.mensaje, '');
    });

  });

});







