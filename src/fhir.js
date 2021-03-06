const { FHIRObject, load } = require('cql-exec-fhir');
const FHIRv401XML = require('../modelInfos/fhir-modelinfo-4.0.1.xml.js');
const patientReferences = require('./patient-references.json');

/**
 * Iterator for the patients provided to the execution engine
 */
class PatientSource {
  constructor(filePathOrXML, mongoDb, shouldCheckProfile = false) {
    this._index = 0;
    this._patientIds = [];
    this._mongoDb = mongoDb;
    this._shouldCheckProfile = shouldCheckProfile;
    this._modelInfo = load(filePathOrXML);
  }

  // Convenience factory method for getting a FHIR 4.0.1 (R4) Patient Source
  static FHIRv401(mongoDb, shouldCheckProfile = false) {
    return new PatientSource(FHIRv401XML, mongoDb, shouldCheckProfile);
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
      const patients = this._mongoDb.collection('Patient');
      const results = await patients.findOne({ id: this._patientIds[this._index] }, { projection: { _id: 0 } });
      return new Patient(results, this._modelInfo, this._mongoDb, this._shouldCheckProfile);
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
  constructor(patientData, modelInfo, mongoDb, shouldCheckProfile = false) {
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

    this._shouldCheckProfile = shouldCheckProfile;

    // Define as un-enumerable to allow serializability of FHIR objects
    Object.defineProperty(this, '_mongoDb', {
      value: mongoDb,
      enumerable: false
    });
  }

  /**
   * Gets class info and finds records for the given patient
   * @param {string} profile link to a FHIR profile
   * @param {Object} retrieveDetails Structure of the information about an ELM retrieve
   */
  async findRecords(profile, retrieveDetails) {
    const classInfo = getClassInfo(profile, retrieveDetails, this._modelInfo);
    if (classInfo == null) {
      console.error(`Failed to find type info for ${profile}`);
      return [];
    }

    const resourceType = classInfo.name.replace(/^FHIR\./, '');
    // If the patient resource type is requested, return array with just this resource
    if (resourceType === 'Patient') {
      return [this];
    }

    const refKeys = patientReferences[resourceType];

    // Assumption here that the collection will be named the resource type
    const dbCollection = this._mongoDb.collection(resourceType);
    let records = [];
    // If the resource cannot reference Patient, return all resources in the collection
    if (!refKeys) {
      records = await dbCollection.find({}, { projection: { _id: 0 } }).toArray();
    } else {
      const allQueries = [];
      records = refKeys.map(searchTerm => {
        const query = {};
        query[`${searchTerm}.reference`] = `Patient/${this._json.id}`;
        allQueries.push(query);
      });
      records = await dbCollection.find({ $or: allQueries }, { projection: { _id: 0 } }).toArray();
    }
    return records.map(r => new FHIRObject(r, classInfo, this._modelInfo));
  }
}

/**
 * Retrieves the class information from the modelInfo
 * @param {String} profile link to a FHIR profile
 * @param {Object} retrieveDetails structure of the information about an ELM resource
 * @param {Object} _modelInfo The modelInfo including information on the passed-in profile
 * @returns {Object} the class information as stored in the modelInfo
 */
function getClassInfo(profile, retrieveDetails, _modelInfo) {
  let classInfo = null;
  if (retrieveDetails) {
    classInfo = _modelInfo.findClass(retrieveDetails.datatype);
  } else {
    classInfo = _modelInfo.findClass(profile);
  }

  return classInfo;
}

module.exports = {
  Patient,
  PatientSource
};
