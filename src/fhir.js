const { FHIRObject, load } = require('cql-exec-fhir');
const FHIRv401XML = require('../modelInfos/fhir-modelinfo-4.0.1.xml.js');

/**
 * Iterator for the patients provided to the execution engine
 */
class PatientSource {
  constructor(filePathOrXML, mongoConnection, shouldCheckProfile = false) {
    this._index = 0;
    this._patientIds = [];
    this._mongoConnection = mongoConnection;
    this._shouldCheckProfile = shouldCheckProfile;
    this._modelInfo = load(filePathOrXML);
  }

  // Convenience factory method for getting a FHIR 4.0.1 (R4) Patient Source
  static FHIRv401(mongoConnection, shouldCheckProfile = false) {
    return new PatientSource(FHIRv401XML, mongoConnection, shouldCheckProfile);
  }

  loadPatientIds(ids) {
    this._patientIds = this._patientIds.concat(ids);
  }

  /**
   * @return new Patient instance with patient data for current index
   */
  async currentPatient() {
    if (this._index < this._patientIds.length) {
      // assume Mongo collections named after FHIR resource types
      const patients = this._mongoConnection.db().collection('Patient');
      const results = await patients.findOne({ id: this._patientIds[this._index] }, { projection: { _id: 0 } });
      return new Patient(results, this._modelInfo, this._mongoConnection, this._shouldCheckProfile);
    }
  }

  /**
   * Advance the current index to go to the next patient Id
   * @return call to currentPatient()
   */
  async nextPatient() {
    if (this._index < this._patientIds.length) {
      this._index++;
      return this.currentPatient();
    }
  }
  reset() {
    this._index = 0;
  }
}

/**
 * Patient data object that implements logic for searching for records based on the Patient
 */
class Patient extends FHIRObject {
  constructor(patientData, modelInfo, mongoConnection, shouldCheckProfile = false) {
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

    this._mongoConnection = mongoConnection;
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
