const { MongoClient } = require('mongodb');

const connection = new MongoClient('mongodb://localhost:27017');
const db = connection.db();

/**
 * Creates a fhir resource with the passed-in data in the passed-in resourceType collection
 * @param {Object} data the FHIR resource data to be uploaded
 * @param {string} resourceType the FHIR resource the type of the passed-in data
 */
const createTestResource = async (data, resourceType) => {
  const collection = db.collection(resourceType);
  await collection.insertOne(data);
};

/**
 * Opens a mongo db connection and uploads the passed in data
 * @param {Array} data The test data to be uploaded to mongo db
 */
const testSetup = async data => {
  await connection.connect();
  const promises = data.map(r => createTestResource(r, r.resourceType));
  await Promise.all(promises);
};

module.exports = { testSetup, connection };