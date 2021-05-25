var UIComp = {
  drawElement: function (payload, compressionAlgo, metric, qrMode) {
    return `<td style="text-align: right;" id="qr-${payload.id}-${compressionAlgo.id}-${metric.id}-${qrMode.id}"></td>\n`; 
  },

  drawLine: function (payload, compressionAlgo, metric, qrModes) {
    let line = '<tr>\n'; 
    line += `<td style="text-align: right;" id="qr-${payload.id}-${compressionAlgo.id}-${metric.id}-header">${compressionAlgo.label}</td>\n`;
    
    qrModes.forEach(qrMode => {
      if (qrMode.id !== "header")
        line += this.drawElement(payload, compressionAlgo, metric, qrMode)
    });

    line += `</tr>\n`;
    return line;
  },

  drawTable: function (payload, compressionAlgos, metric, qrModes, numberOfPayloads) {
    let line = '';
    if (numberOfPayloads == 3)
      line += `<div class="third">\n`;
    else if (numberOfPayloads == 2) {
      line += `<div class="two-halfs">\n`;
    } else if (numberOfPayloads == 1) {
      line += `<div class="four-quarter">\n`;
    }

    line += `<h4 style="text-align: center;">${payload.label}</h4>\n`; 
    line += `<table class="comparison">\n`;

    // Header
    line += `<tr>\n`;
    qrModes.forEach(qrMode => {
           line += `<th style="text-align: right;">${qrMode.label}</th>\n`
    });
    line += `</tr>\n`;

    // Each line 
    compressionAlgos.forEach(compressionAlgo => {
           line += this.drawLine(payload, compressionAlgo, metric, qrModes)
    });

    line += `</table>\n`;
    line += `</div>\n`;
    return line;
  },

  drawBlock: function (payloads, compressionAlgos, metric, qrModes) {
    let line = `<div class="four-quarter">\n`
    line += `  <h4>${metric.label}</h4>\n`
    line += `</div>\n`
    line += `<div class="full-div">\n`

    payloads.forEach(payload => {
      line += this.drawTable(payload, compressionAlgos, metric, qrModes, payloads.length);
    });

    line += `</div>\n`
    return line;
  },

  drawSection: function (payloads, compressionAlgos, metrics) {
    let line = '';

    line += '<div class="four-quarter">';
    line += "<h2>Comparison Tables</h2>"
    line += "</div>"

    metrics.forEach(metric => {
      line += this.drawBlock(payloads, compressionAlgos, metric, metric.over);
    });
    return line;
  },

  init: function(payloads, compressionAlgos, metrics) {
    return this.drawSection(payloads, compressionAlgos, metrics);
  }
};


