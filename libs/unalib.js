// modulo de ejemplo.

module.exports = {


    // logica que valida si un telefono esta correcto...
    is_valid_phone: function (phone) {
      // inicializacion lazy
      var isValid = false;
      // expresion regular copiada de StackOverflow
      var re = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/i;
  
      // validacion Regex
      try {
        isValid = re.test(phone);
      } catch (e) {
        console.log(e);
      } finally {
          return isValid;
      }
      // fin del try-catch block
    },
  
    is_valid_url_image: function (url) {
      // SVG se excluye porque puede contener JavaScript embebido.
      return hasExtension(url, ['jpg', 'jpeg', 'gif', 'png', 'bmp', 'webp']);
    },
  
    is_valid_yt_video: function (url) {
      return getYouTubeId(url) !== null;
    },

    is_valid_url_video: function (url) {
      return hasExtension(url, ['mp4', 'webm', 'ogg', 'mov', 'm4v']);
    },
  
    getYTVideoId: function(url){
  
      return getYouTubeId(url);
    },
  
    getEmbeddedCode: function (url){
      var id = this.getYTVideoId(url);
      if (!id) return '';
      var code = '<iframe width="560" height="315" src="https://www.youtube.com/embed/'+id+ '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
      return code;
    },
  
    validateMessage: function(msg){
      // Nunca devolvemos HTML recibido del cliente ni conservamos propiedades
      // arbitrarias que puedan usarse para inyectar datos en otros clientes.
      if (!msg || typeof msg !== 'string') {
        return createSafeMessage();
      }

      try {
        var obj = JSON.parse(msg);

        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
          return createSafeMessage();
        }

        var rawMessage = typeof obj.mensaje === 'string' ? obj.mensaje : '';
        var rawTrimmedMessage = rawMessage.trim();
        var message = isDangerousUrl(rawTrimmedMessage)
          ? ''
          : sanitizeText(rawMessage, 2000);
        var type = 'texto';

        // Si parece una URL, debe ser una URL multimedia permitida. Esto evita
        // aceptar javascript:, data:, file: u otros esquemas peligrosos.
        if (isUrl(message)) {
          if (this.is_valid_url_image(message)) {
            type = 'imagen';
          } else if (this.is_valid_url_video(message) || this.is_valid_yt_video(message)) {
            type = 'video';
          } else {
            message = '';
          }
        }

        var safeMessage = {
          nombre: sanitizeText(obj.nombre, 80) || 'Anonimo',
          mensaje: message,
          color: isSafeColor(obj.color) ? obj.color : '#000000',
          tipo: type
        };

        return JSON.stringify(safeMessage);
      } catch (e) {
        return createSafeMessage();
      }
    }
  
  
  
    
    
  
  // fin del modulo
  };

  function hasExtension(url, extensions) {
    if (!isSafeHttpUrl(url)) return false;

    try {
      var parsed = new URL(url);
      var pathname = parsed.pathname.toLowerCase();
      return extensions.some(function (extension) {
        return pathname.endsWith('.' + extension);
      });
    } catch (e) {
      return false;
    }
  }

  function getYouTubeId(url) {
    if (!isSafeHttpUrl(url)) return null;

    try {
      var parsed = new URL(url);
      var host = parsed.hostname.toLowerCase().replace(/^www\./, '');
      if (host === 'youtu.be') return parsed.pathname.slice(1).split('/')[0] || null;
      if (host !== 'youtube.com' && host !== 'm.youtube.com') return null;
      var id = parsed.pathname === '/watch'
        ? parsed.searchParams.get('v')
        : (/^\/(embed|v)\//.test(parsed.pathname) ? parsed.pathname.split('/')[2] : null);
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    } catch (e) {
      return null;
    }
  }

  function isSafeHttpUrl(value) {
    if (typeof value !== 'string' || value.length > 2048 || !/^https?:\/\//i.test(value)) return false;

    try {
      var parsed = new URL(value);
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
        parsed.hostname && !parsed.username && !parsed.password;
    } catch (e) {
      return false;
    }
  }

  function isUrl(value) {
    return typeof value === 'string' && /^(?:https?:\/\/|javascript:|data:|file:|blob:)/i.test(value);
  }

  function isDangerousUrl(value) {
    return /^(?:javascript|data|file|blob):/i.test(value);
  }

  function sanitizeText(value, maxLength) {
    if (typeof value !== 'string') return '';
    return value
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript\s*:/gi, '')
      .trim()
      .slice(0, maxLength);
  }

  function isSafeColor(value) {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
  }

  function createSafeMessage() {
    return JSON.stringify({
      nombre: 'Anonimo',
      mensaje: '',
      color: '#000000',
      tipo: 'texto'
    });
  }
  
