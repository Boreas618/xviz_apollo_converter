import fs from "fs";
import path from "path";

export function parseJsonFile(dirPath, fileName) {
    return JSON.parse(fs.readFileSync(path.join(dirPath, fileName), 'utf8'));
}

export function getPoseTrajectory(_ref) {
    let {
        poses,
        startFrame,
        endFrame
    } = _ref;
    const positions = [];
    const iterationLimit = Math.min(endFrame, poses.length);

    for (let i = startFrame; i < iterationLimit; i++) {
        positions.push(poses[i].pose);
    }

    const startPose = poses[startFrame].pose;
    const worldToStartPoseTransformMatrix = new Pose(startPose).getTransformationMatrix().invert();
    return positions.map(currPose => {
        const offset = getGeospatialVector(startPose, currPose);
        const relativeOffset = worldToStartPoseTransformMatrix.transform(offset);
        return relativeOffset;
    });
}