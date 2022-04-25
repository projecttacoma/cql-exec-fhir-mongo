# cql-exec-fhir-mongo

A FHIR-based data source module for use with the CQL Execution Engine that interacts with a Mongo database.

- [Installation](#installation)

  - [Prerequisites](#prerequisites)
  - [Local Installation](#local-installation)
  - [Testing](#testing)

- [Usage](#usage)

- [License](#license)

## Installation

### Prerequisites

- [Node.js >=11.15.0](https://nodejs.org/en/)
- [Git](https://git-scm.com/)

### Local Installation

Clone the source code:

```bash
git clone https://github.com/projecttacoma/cql-exec-fhir-mongo.git
```

Install dependencies:

```bash
npm install
```

### Testing

Unit tests can be running using the following `npm` command:

```bash
npm run test
```

## Usage

The FHIR Data Source expects each patient and their accompanying data exist in the Mongo database that is provided to the patient source. The FHIR Data Source queries Mongo to get FHIR data for execution.

## License

Copyright 2022 The MITRE Corporation

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

```bash
http://www.apache.org/licenses/LICENSE-2.0
```

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
