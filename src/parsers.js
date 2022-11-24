export function generateTimestamps(data) {
    const timestamps = [];
    for(let i = 1; i <= data.length; i++){
        timestamps[i-1] = i;
    }
    console.log(timestamps);

    return timestamps;
}