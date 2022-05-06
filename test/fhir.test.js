const { PatientSource } = require('../src/fhir');
const testPatients = require('./fixtures/testPatients.json');
const { testSetup, connection } = require('./setup');

const TEST_PATIENT_IDS = testPatients.map(e => e.id);
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

  afterAll(async () => await connection.close());
});
