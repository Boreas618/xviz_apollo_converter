import BaseConverter from "./base-converter";
import {parseJsonFile} from "./common";
import {_getPoseTrajectory} from "@xviz/builder";

export default class GPSConverter extends BaseConverter {
    constructor(rootDir, streamFile, data) {
        super(data);
        this.rootDir = rootDir;
        this.streamFile = streamFile;
        this.VEHICLE_ACCELERATION = '/vehicle/acceleration';
        this.VEHICLE_VELOCITY = '/vehicle/velocity';
        this.VEHICLE_TRAJECTORY = '/vehicle/trajectory';
        this.VEHICLE_WHEEL = '/vehicle/wheel_angle';
        //this.VEHICLE_WHEEL = '/vehicle/wheel_angle';
        this.VEHICLE_AUTONOMOUS = '/vehicle/autonomy_state';
    }

    load() {
        super.load();
        this.poses = this._convertPose();
    }

    async convertMessage(messageIndex, xvizBuilder) {
        const originX = this.poses[0].pose.positionX;
        const originY = this.poses[0].pose.positionX;
        const originZ = 0;

        const info = this.poses[messageIndex];

        const {pose, velocity, acceleration} = info;

        console.log(`processing message ${messageIndex+1}/${this.timestamps.length}\r`);

        console.log(originX);
        console.log(originY);
        //console.log(velocity.val);
        //console.log(acceleration.val);

        xvizBuilder
            .timestamp(parseInt(pose.index));

        xvizBuilder
            .pose('/vechile_pose')
            .timestamp(parseInt(pose.index))
            .mapOrigin(originX, originY, originZ)
            .position(pose.positionX, pose.positionY, 0)
            .orientation(pose.heading, 0, 0);

        xvizBuilder
            .timeSeries(this.VEHICLE_VELOCITY)
            .timestamp(parseInt(pose.index))
            .value(velocity.val);

        xvizBuilder
            .timeSeries(this.VEHICLE_ACCELERATION)
            .timestamp(parseInt(pose.index))
            .value(acceleration.val);

        xvizBuilder
            .timeSeries(this.VEHICLE_WHEEL)
            .timestamp(parseInt(pose.index))
            .value(0);

        // apollo dataset is always under autonomous mode
        xvizBuilder
            .timeSeries(this.VEHICLE_AUTONOMOUS)
            .timestamp(parseInt(pose.index))
            .value('autonomous');

        const poseTrajectory = this._getPoseTrajectory(
            messageIndex,
            Math.min(messageIndex + 10, this.poses.length)
        );

        console.log(poseTrajectory);

        xvizBuilder.primitive(this.VEHICLE_TRAJECTORY).polyline(poseTrajectory);

        console.log(xvizBuilder);
    }

    _convertPose(){
        const poses = [];
        const data = parseJsonFile("/Users/sunyi/WebstormProjects/apollo-converter/src/data", "data.json");
        for(const index in data){
            const resMap = {};

            //console.log(data[index]['gps'])

            resMap.pose = {
                index,
                positionX:data[index]['gps']['positionX'],
                positionY:data[index]['gps']['positionY'],
                heading:data[index]['gps']['heading']
            };

            resMap.velocity = {
                index,
                val:data[index]['autoDrivingCar']['speed']
            };

            resMap.acceleration = {
                index,
                val:data[index]['autoDrivingCar']['speedAcceleration']
            };

            poses.push(resMap);
        }
        return poses;
    }

    getMetadata(xvizMetaBuilder) {
        // You can see the type of metadata we allow to define.
        // This helps validate data consistency and has automatic
        // behavior tied to the viewer.
        const xb = xvizMetaBuilder;
        xb.stream('/vehicle_pose')
            .category('pose')

            .stream(this.VEHICLE_ACCELERATION)
            .category('time_series')
            .type('float')
            .unit('m/s^2')

            .stream(this.VEHICLE_VELOCITY)
            .category('time_series')
            .type('float')
            .unit('m/s')

            .stream(this.VEHICLE_AUTONOMOUS)
            .category('time_series')
            .type('string')

            .stream(this.VEHICLE_TRAJECTORY)
            .category('primitive')
            .type('polyline')
            .coordinate('IDENTITY')
            .streamStyle({
                stroke_color: '#57AD57AA',
                stroke_width: 1.4,
                stroke_width_min_pixels: 1
            })

            .stream(this.VEHICLE_WHEEL)
            .category('time_series')
            .type('float')
            .unit('deg/s');

            // This styling information is applied to *all* objects for this stream.
            // It is possible to apply inline styling on individual object
    }

    _getPoseTrajectory(startFrame, endFrame) {
        const originX = this.poses[0].pose.positionX;
        const originY = this.poses[0].pose.positionX;
        const originZ = 0;
        const futurePoses = [];
        for (let i = startFrame; i < endFrame; i++) {
            const currPose = this.poses[i];
            //console.log(this.poses[i].pose);
            futurePoses.push([currPose.pose.positionX-originX, currPose.pose.positionY-originY, 0]);
        }
        return futurePoses;
    }
}