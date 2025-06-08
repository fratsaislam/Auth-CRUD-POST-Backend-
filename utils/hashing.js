const {hash, compare} = require("bcryptjs");
const {createHmac} = require("crypto");

exports.doHash = async(value, saltValue) => {
    const result = await hash(value, saltValue);
    return result;
}


exports.doHashValidator = async (value, hashedValue) => {
    const result = compare(value, hashedValue);
    return result;
}

exports.hmacProcess = (value, key) => {
    const result = createHmac(`sha256`, key).update(value).digest('hex');
    return result;
}
