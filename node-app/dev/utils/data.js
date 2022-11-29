const parseRawDataPacket = data => Object.values(JSON.parse(JSON.stringify(data))[0])[0];

module.exports = {parseRawDataPacket}