class PatientSource {
  constructor(filePathOrXML, serverUrl, shouldCheckProfile = false) {}
}

class Patient {
  constructor(modelInfo, serverUrl, shouldCheckProfile = false) {}
}

module.exports = {
  Patient,
  PatientSource
};
