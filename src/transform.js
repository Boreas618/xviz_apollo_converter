// Copyright (c) 2019 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* eslint-disable camelcase */
import fs from 'fs'
import {FileSink} from '@xviz/io/node';
import {XVIZBinaryWriter, XVIZJSONWriter, XVIZProtobufWriter} from '@xviz/io';

import {ApolloConverter} from './apollo-converter';

import process from 'process';

module.exports = async function main() {

  const data = JSON.parse(
      fs.readFileSync("/Users/sunyi/WebstormProjects/apollo-converter/src/data/data.json","utf8")
  );

  // This object orchestrates any data dependencies between the data sources
  // and delegates to the individual converters
  const converter = new ApolloConverter(data);

  converter.initialize();

  // This abstracts the details of the filenames expected by our server
  const sink = new FileSink("/Users/sunyi/WebstormProjects/apollo-converter/src/data_op");
  let xvizWriter = new XVIZBinaryWriter(sink);


  // Write metadata file
  const xvizMetadata = converter.getMetaData();
  xvizWriter.writeMetadata(xvizMetadata);

  // If we get interrupted make sure the index is written out
  signalWriteIndexOnInterrupt(xvizWriter);

  const start = Date.now();

  const limit = 105;
  // Convert each message and write it to a file
  //
  // A *message* is a point in time, where each message will contain
  // a *pose* and any number of XVIZ data sets.
  //
  // In the KITTI data set we are able to iterate directly by *message* number
  // since the data has been synchronized. However, another approach
  // would be to iterate over data sets by time.  Since dealing with synchronized
  // data is easier, we have choosen this path for the initial example to avoid
  // any unnecessary complications
  for (let i = 0; i < limit; i++) {
    const xvizMessage = await converter.convertMessage(i);
    console.log(JSON.stringify(xvizMessage));
    xvizWriter.writeMessage(i, xvizMessage);
  }

  xvizWriter.close();

  const end = Date.now();
  console.log(`Generate ${limit} messages in ${end - start}s`); // eslint-disable-line
};

function signalWriteIndexOnInterrupt(writer) {
  process.on('SIGINT', () => {
    console.log('Aborting, writing index file.'); // eslint-disable-line
    writer.close();
    process.exit(0); // eslint-disable-line no-process-exit
  });
}
