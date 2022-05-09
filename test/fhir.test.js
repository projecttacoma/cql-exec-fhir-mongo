const { PatientSource } = require('../src/fhir');
const { testSetup, connection, testCleanup } = require('./setup');
const { FHIRObject } = require('cql-exec-fhir');
const testPatients = require('./fixtures/testPatients.json');
const testProcedures = require('./fixtures/testProcedures.json');
const testLibraries = require('./fixtures/testLibrary.json');

const TEST_PATIENT_IDS = testPatients.map(e => e.id);
const ALL_TEST_RESOURCES = [...testProcedures, ...testPatients, ...testLibraries];
describe('Patient Source', () => {
  beforeAll(async () => await testSetup(JSON.parse(JSON.stringify(testPatients))));

  test('Returns patient with current id on call to currentPatient()', async () => {
    const ps = PatientSource.FHIRv401(connection);
    ps.loadPatientIds(TEST_PATIENT_IDS);
    const currentPatient = await ps.currentPatient();
    expect(ps._index).toEqual(0);
    expect(currentPatient._patientData).toEqual(testPatients[0]);
  });

  test('Returns patient with next id on call to nextPatient()', async () => {
    const ps = PatientSource.FHIRv401(connection);
    ps.loadPatientIds(TEST_PATIENT_IDS);
    const currentPatient = await ps.nextPatient();
    expect(ps._index).toEqual(1);
    expect(currentPatient._patientData).toEqual(testPatients[1]);
  });

  test('Returns undefined on call to nextPatient() index is at end of patientIds array', async () => {
    const ps = PatientSource.FHIRv401(connection);
    ps.loadPatientIds(TEST_PATIENT_IDS);
    await ps.nextPatient();
    const undef = await ps.nextPatient();
    expect(undef).toBeUndefined();
  });

  test('Reset sets index back to 0', async () => {
    const ps = PatientSource.FHIRv401(connection);
    ps.loadPatientIds(TEST_PATIENT_IDS);
    await ps.nextPatient();
    ps.reset();
    expect(ps._index).toEqual(0);
  });

  afterAll(testCleanup);
});

describe('Patient', () => {
  beforeAll(async () => await testSetup(JSON.parse(JSON.stringify(ALL_TEST_RESOURCES))));
  test('findRecords on Procedure returns all valid procedure resources', async () => {
    const ps = PatientSource.FHIRv401(connection);
    ps.loadPatientIds(TEST_PATIENT_IDS);
    const patient = await ps.currentPatient();
    const records = await patient.findRecords('Procedure');

    expect(records).toHaveLength(2);
    expect(records[0]).toBeInstanceOf(FHIRObject);
    expect(records[1]).toBeInstanceOf(FHIRObject);

    const recordsJson = records.map(r => r._json);
    expect(recordsJson).toEqual(expect.arrayContaining([testProcedures[0], testProcedures[1]]));
  });

  test('findRecords on Procedure correctly returns no resources', async () => {
    const ps = PatientSource.FHIRv401(connection);
    ps.loadPatientIds(TEST_PATIENT_IDS);
    const patient = await ps.nextPatient();
    const records = await patient.findRecords('Procedure');

    expect(records).toHaveLength(0);
  });

  test('findRecords on Library correctly returns all Libraries', async () => {
    const ps = PatientSource.FHIRv401(connection);
    ps.loadPatientIds(TEST_PATIENT_IDS);
    const patient = await ps.currentPatient();
    const records = await patient.findRecords('Library');

    expect(records).toHaveLength(1);
  });

  test('findRecords on Patient returns the patient', async () => {
    const ps = PatientSource.FHIRv401(connection);
    ps.loadPatientIds(TEST_PATIENT_IDS);
    const patient = await ps.currentPatient();
    const records = await patient.findRecords('Patient');

    expect(records).toHaveLength(1);
    expect(records[0]).toBeInstanceOf(FHIRObject);
    expect(records[0]._json).toEqual(testPatients[0]);
  });
  afterAll(testCleanup);
});
