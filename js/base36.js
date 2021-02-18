function addLeadZeros(str, pegLength) {
    if (str.length == 0) str = '0'
    while ((str.length % pegLength) > 0) {
        str = '0' + str;
    }
    return str;
}

function stripLeadZeros(str) {
    while (str.length > 1 && str[0] == '0') {
        str = str.substr(1);
    }
    return str;
}

function to36(base16) {
    if (typeof base16 != 'string') return;
    if (base16 == '') return '0';

    base16 = addLeadZeros(base16, 5);
    let base36 = '';
    let len = base16.length;
    while (len > 0) {
        let val = parseInt(base16.substr(0,5), 16)
        base16  = base16.substr(5)
        len    -= 5
        base36 += addLeadZeros(val.toString(36), 4)
    }
    return stripLeadZeros(base36)
}

function to16(base36) {
    if (typeof base36 != 'string') return;
    if (base36 == '') return '0';

    base36 = addLeadZeros(base36, 4)
    
    let base16 = ''
    let len = base36.length
    while (len > 0) {
        let val = parseInt(base36.substr(0,4), 36)
        base36  = base36.substr(4)
        len    -= 4
        base16 += addLeadZeros(val.toString(16), 5)
    }
    return stripLeadZeros(base16)
}