import {generateTimestamps} from "./parsers";
import GPSConverter from "./gps-converter";
import TrackletsConverter from "./tracklets-converter";
import {XVIZBuilder, XVIZMetadataBuilder} from "@xviz/builder";
import {getDeclarativeUI} from "./declarative-ui";

export class ApolloConverter {
    constructor(
        //inputDir,
        //outputDir,
        data) {
        this.inputDir = 'inputDir';
        this.outDir = 'outputDir';
        this.data = data;
    }

    initialize() {
        this.timestamps = generateTimestamps(this.data);
        //this.numMessages = this.timestamps.length;

        const gpsConverter = new GPSConverter(this.inputDir, 'pose.json',this.data);

        const trackletsConverter = new TrackletsConverter(this.inputDir, 'object.json');

        this.converters = [
            gpsConverter,
            //trackletsConverter
        ];

        this.converters.forEach(converter => converter.load());

        this.metadata = this.getMetaData();

        //console.log(this.numMessages);
    }

    async convertMessage(messageIndex) {
        const xvizBuilder = new XVIZBuilder({
                metadata: this.metadata
        });

        // As builder instance is shared across all the converters, to avoid race conditions,
        // Need wait for each converter to finish

        for (let i = 0; i < this.converters.length; i++) {
            await this.converters[i].convertMessage(messageIndex, xvizBuilder);
        }

        //console.log(xvizBuilder);

        return xvizBuilder.getMessage();
    }

    getMetaData() {
        // The XVIZMetadataBuilder provides a fluent API to collect
        // metadata about the XVIZ streams produced during conversion.
        //
        // This include type, category, and styling information.
        //
        // Keeping this general data centralized makes it easy to find and change.
        const xb = new XVIZMetadataBuilder();
        //console.log(this.timestamps[0] + ' -> '+this.timestamps[this.timestamps.length - 1]);
        xb.startTime(this.timestamps[0]).endTime(this.timestamps[this.timestamps.length - 1]);

        this.converters.forEach(converter => converter.getMetadata(xb));
        xb.ui(getDeclarativeUI());

        xb.logInfo({
            description: 'Conversion of Apollo data set into XVIZ',
            license: 'CC BY-NC-SA 3.0',
            'license link':
                '<a href="http://creativecommons.org/licenses/by-nc-sa/3.0/">http://creativecommons.org/licenses/by-nc-sa/3.0/</a>',
            uri: '<a href="https://github.com/uber/xviz-data">https://github.com/uber/xviz-data</a>',
            source: {
                title: 'Apollo',
                author: 'Baidu',
                link:
                    '<a href="https://apollo.baidu.com/">https://apollo.baidu.com/</a>',
                copyright: ''
            }
        });

        return xb.getMetadata();
    }
}