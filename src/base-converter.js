import {generateTimestamps} from "./parsers";

export default class BaseConverter {
    constructor(data) {
        this.data = data;
    }

    load(){
        this.timestamps = generateTimestamps(this.data);
    }

    async loadMessage(index) {
        const data = this.data;
        const timestamp = this.timestamps[index];
        return {data, timestamp};
    }
}