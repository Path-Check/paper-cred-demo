
var UIUtils = {
  drawVerifiedSymbol: function (element, result) {
    if (result) {
        const imgDim= {width:e(element).width/5,height:e(element).width/5}; //logo dimention
        var context = e(element).getContext('2d');
        var imageObj = new Image();  
        imageObj.src = './img/ok-256.png';      
        imageObj.onload = function() {
            context.drawImage(imageObj, 
            e(element).width / 2 - imgDim.width / 2 +1,
            e(element).height / 2 - imgDim.height / 2,imgDim.width,imgDim.height);
        }; 
    }
  },

  drawVerificationResult: function (element, result) {
    if (result.status === "verified") {
        const imgDim= {width:e(element).width/5,height:e(element).width/5}; //logo dimention
        var context = e(element).getContext('2d');
        var imageObj = new Image();  
        imageObj.src = './img/ok-256.png';      
        imageObj.onload = function() {
            context.drawImage(imageObj, 
            e(element).width / 2 - imgDim.width / 2 +1,
            e(element).height / 2 - imgDim.height / 2,imgDim.width,imgDim.height);
        }; 
    }
  },

  drawPicture: function (element, url) {
    if (url) {
        const imgDim= {width:e(element).width/3,height:e(element).width/3}; //logo dimention
        var context = e(element).getContext('2d');
        var imageObj = new Image();  
        imageObj.src = url.toLowerCase();      
        imageObj.onload = function() {
            context.drawImage(imageObj, 
            e(element).width / 2 - imgDim.width / 2,
            e(element).height / 5 - imgDim.height / 2,imgDim.width,imgDim.height);

            const imgDim2= {width:e(element).width/10,height:e(element).width/10}; //logo dimention
            var imageObj2 = new Image();  
            imageObj2.src = './img/ok-256.png';      
            imageObj2.onload = function() {
                context.drawImage(imageObj2, 
                e(element).width / 2 - imgDim.width / 2 + imgDim2.width * 2,
                e(element).height / 5 - imgDim.height / 2 + imgDim2.height * 2 , imgDim2.width,imgDim2.height);
            }; 
        }; 
    }
  },

  qrSizeBytes: function(qr) {
      return Math.round((qr.modules.size*qr.modules.size)/8);
  },

  describe: function(qr) {
      if (qr == null || qr === undefined) return "Data is too big to be stored in a QR";
      return qr.modules.size + "x" + qr.modules.size + " " + this.qrSizeBytes(qr) + " bytes";
  },

  renderQR: function(elemPref, value, ecc) {
      if (!ecc) {
          ecc = "Q";
      }

      const params = { margin:0, width:e(elemPref+'-code').scrollWidth, errorCorrectionLevel: ecc, color: {dark: '#3654DD' }};

      if (e(elemPref+"-code-label"))
        e(elemPref+"-code-label").style.display = '';

      // Builds QR Element
      QRCode.toCanvas(e(elemPref+'-code'), value, params, function (error) {
          if (error) {
            var canvas = e(elemPref+'-code');
            canvas.width  = canvas.clientWidth;
            canvas.height = canvas.clientWidth;
            //canvas.height = canvas.width;
            var ctx = canvas.getContext("2d");
            ctx.font = "30px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Too Big to Render", canvas.width/2, canvas.height/2 - 50);
          }
      });

      if (e(elemPref+"-pdf")) {
        if (PDF417.draw(value, e(elemPref+"-pdf")) === undefined) {
            e(elemPref+"-pdf-label").style.display = '';
            e(elemPref+"-pdf").style.display = '';
        } 
      }
  },

  tryBuildQR: function(uri, ecc) {
    try {
        return QRCode.create(uri, { margin:0, width:275, errorCorrectionLevel: ecc, color: {dark: '#3654DD' }});
    }  catch {}
    return undefined;
  },

  drawsQR: function(elemPref, value, debugURI, ecc) {
      this.renderQR(elemPref, value, ecc);

      let qrQ = this.tryBuildQR(value, 'Q');
      let qrH = this.tryBuildQR(value, 'H');
      let qrM = this.tryBuildQR(value, 'M');
      let qrL = this.tryBuildQR(value, 'L');
      
      e(elemPref+"-bytes").innerHTML = "URI in A/N (5.5bit/char): "+ Math.round(value.length * 5.5/8) + " bytes<br>";

      e(elemPref+"-bytes").innerHTML += "<br>QR Size Analysis: ";
      e(elemPref+"-bytes").innerHTML += "<br>-ECC L  7% "  + this.describe(qrL);
      e(elemPref+"-bytes").innerHTML += "<br>-ECC M 15% " + this.describe(qrM);
      e(elemPref+"-bytes").innerHTML += "<br>-ECC Q 25% " + this.describe(qrQ);
      e(elemPref+"-bytes").innerHTML += "<br>-ECC H 30% " + this.describe(qrH);
      
      e(elemPref+"-bytes").innerHTML += "<br><br>QR built with " + qrL.segments.length + " segments";
      for (i=0; i<qrL.segments.length; i++) {
          e(elemPref+"-bytes").innerHTML += "<br>- " + i + ": " + qrL.segments[i].mode.id + " " + qrL.segments[i].data;
      }

      if (e(elemPref+"-result")) {
        e(elemPref+"-result").innerHTML = debugURI;
      }
  }
}