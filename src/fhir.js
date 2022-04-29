const { FHIRObject, load } = require('cql-exec-fhir');

/**
 * Iterator for the patients provided to the execution engine
 */
class PatientSource {
  constructor(filePathOrXML, connectionUrl, shouldCheckProfile = false) {
    // TODO: use connectionUrl to create instance of MongoClient
    this._index = 0;
    this._patientIds = [];
    this._shouldCheckProfile = shouldCheckProfile;
    this._modelInfo = load(filePathOrXML);
  }

  loadPatientIds(ids) {
    this._patientIds = this._patientIds.concat(ids);
  }

  /**
   * @return new Patient instance with patient data for current index
   */
  async currentPatient() {
    // assume Mongo collections named after FHIR resource types
  }

  /**
   * Advance the current index to go to the next patient Id
   * @return call to currentPatient()
   */
  async nextPatient() {
    this._index += 1;
    return this.currentPatient();
  }
}

/**
 * Patient data object that implements logic for searching for records based on the Patient
 */
class Patient extends FHIRObject {
  constructor(patientData, modelInfo, connectionUrl, shouldCheckProfile = false) {
    // TODO: use connectionUrl to create instance of MongoClient
    const patientClass = modelInfo.patientClassIdentifier
      ? modelInfo.patientClassIdentifier
      : modelInfo.patientClassName;
    const ptClass = modelInfo.findClass(patientClass);
    super(patientData, ptClass, modelInfo);

    // Define a "private" un-enumerable property to hold the patient data
    Object.defineProperty(this, '_patientData', {
      value: patientData,
      enumerable: false
    });

    this._connectionUrl = connectionUrl;
    this._shouldCheckProfile = shouldCheckProfile;
  }

  /**
   * Gets class info and finds records for the given patient
   * @param {string} profile link to a FHIR profile
   * @param {Object} retrieveDetails Structure of the information about an ELM retrieve
   */
  // eslint-disable-next-line no-unused-vars
  findRecords(profile, retrieveDetails) {}

  // add current pat, next pat, for patient source, find records for patient class, load patient ids to pop array w strings (same as asyncpatsource)
  // https://github.com/cqframework/cql-execution/blob/master/src/types/cql-patient.interfaces.ts
}

module.exports = {
  Patient,
  PatientSource
};
