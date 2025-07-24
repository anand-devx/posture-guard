#!/usr/bin/env python3
"""
Posture Guard - Posture Analysis System
Uses MediaPipe and OpenCV for real-time posture detection with facing direction
"""

import cv2
import mediapipe as mp
import numpy as np
import json
import sys
from pathlib import Path

class PostureAnalyzer:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.mp_draw = mp.solutions.drawing_utils

    def calculate_angle(self, a, b, c):
        a = np.array(a)
        b = np.array(b)
        c = np.array(c)

        ba = a - b
        bc = c - b

        cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
        # Clamp to avoid numerical errors
        cosine_angle = np.clip(cosine_angle, -1.0, 1.0)

        angle = np.arccos(cosine_angle)
        return np.degrees(angle)


    def detect_facing_direction(self, landmarks):
        left_shoulder = landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value].x
        right_shoulder = landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x
        nose = landmarks[self.mp_pose.PoseLandmark.NOSE.value].x

        if nose > right_shoulder or nose > left_shoulder:
            return "right"
        else:
            return "left"

    def analyze_squat_posture(self, landmarks, facing):
        pose = self.mp_pose

        if facing == "left":
            hip = [landmarks[pose.PoseLandmark.LEFT_HIP.value].x,
                   landmarks[pose.PoseLandmark.LEFT_HIP.value].y]
            knee = [landmarks[pose.PoseLandmark.LEFT_KNEE.value].x,
                    landmarks[pose.PoseLandmark.LEFT_KNEE.value].y]
            ankle = [landmarks[pose.PoseLandmark.LEFT_ANKLE.value].x,
                     landmarks[pose.PoseLandmark.LEFT_ANKLE.value].y]
            toe = [landmarks[pose.PoseLandmark.LEFT_FOOT_INDEX.value].x,
                     landmarks[pose.PoseLandmark.LEFT_FOOT_INDEX.value].y]
            shoulder = [landmarks[pose.PoseLandmark.LEFT_SHOULDER.value].x,
                        landmarks[pose.PoseLandmark.LEFT_SHOULDER.value].y]
        else:
            hip = [landmarks[pose.PoseLandmark.RIGHT_HIP.value].x,
                   landmarks[pose.PoseLandmark.RIGHT_HIP.value].y]
            knee = [landmarks[pose.PoseLandmark.RIGHT_KNEE.value].x,
                    landmarks[pose.PoseLandmark.RIGHT_KNEE.value].y]
            ankle = [landmarks[pose.PoseLandmark.RIGHT_ANKLE.value].x,
                     landmarks[pose.PoseLandmark.RIGHT_ANKLE.value].y]
            toe = [landmarks[pose.PoseLandmark.RIGHT_FOOT_INDEX.value].x,
                     landmarks[pose.PoseLandmark.RIGHT_FOOT_INDEX.value].y]
            shoulder = [landmarks[pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                        landmarks[pose.PoseLandmark.RIGHT_SHOULDER.value].y]

        knee_angle = self.calculate_angle(hip, knee, ankle)
        back_angle = self.calculate_angle(shoulder, hip, knee)

        warnings = []
        is_good_posture = True

        if (facing == "right" and knee[0] > toe[0]) or (facing == "left" and knee[0] < toe[0]):
            warnings.append("Knee extends beyond toe - risk of injury")
            is_good_posture = False

        if not (30 <= back_angle <= 60):
            warnings.append("Back angle too upright or too low - maintain natural forward lean (30° to 60° wrt thigh)")
            is_good_posture = False

        if not (80 <= knee_angle <= 120):
            warnings.append("Squat depth needs improvement - aim for 90-degree knee bend (80° to 120°)")
            is_good_posture = False

        feedback = "Good squat form" if is_good_posture else "Adjust your squat form"

        return {
            'isGoodPosture': is_good_posture,
            'feedback': feedback,
            'angles': {
                'knee': round(knee_angle, 1),
                'back': round(back_angle, 1)
            },
            'warnings': warnings
        }

    def analyze_sitting_posture(self, landmarks, facing):
        pose = self.mp_pose

        if facing == "left":
            ear = [landmarks[pose.PoseLandmark.LEFT_EAR.value].x,
                   landmarks[pose.PoseLandmark.LEFT_EAR.value].y]
            shoulder = [landmarks[pose.PoseLandmark.LEFT_SHOULDER.value].x,
                        landmarks[pose.PoseLandmark.LEFT_SHOULDER.value].y]
            hip = [landmarks[pose.PoseLandmark.LEFT_HIP.value].x,
                   landmarks[pose.PoseLandmark.LEFT_HIP.value].y]
            knee = [landmarks[pose.PoseLandmark.LEFT_KNEE.value].x,
                    landmarks[pose.PoseLandmark.LEFT_KNEE.value].y]
        else:
            ear = [landmarks[pose.PoseLandmark.RIGHT_EAR.value].x,
                   landmarks[pose.PoseLandmark.RIGHT_EAR.value].y]
            shoulder = [landmarks[pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                        landmarks[pose.PoseLandmark.RIGHT_SHOULDER.value].y]
            hip = [landmarks[pose.PoseLandmark.RIGHT_HIP.value].x,
                   landmarks[pose.PoseLandmark.RIGHT_HIP.value].y]
            knee = [landmarks[pose.PoseLandmark.RIGHT_KNEE.value].x,
                    landmarks[pose.PoseLandmark.RIGHT_KNEE.value].y]

        neck_angle = abs(ear[0] - shoulder[0]) * 100
        back_angle = self.calculate_angle(shoulder, hip, knee)

        warnings = []
        is_good_posture = True

        if neck_angle > 10:
            warnings.append("Adjust head posture - align ears over shoulders (20° max)")
            is_good_posture = False

        if not (80 <= back_angle <= 115):
            warnings.append("Back not straight - maintain neutral spine (80° to 115°)")
            is_good_posture = False

        feedback = "Good sitting posture" if is_good_posture else "Adjust your sitting position"

        return {
            'isGoodPosture': is_good_posture,
            'feedback': feedback,
            'angles': {
                'neck': round(neck_angle, 1),
                'back': round(back_angle, 1)
            },
            'warnings': warnings
        }

    def draw_custom_landmarks(self, image, landmarks, facing):
        h, w, _ = image.shape

        pose = self.mp_pose

        if facing == "left":
            back_pts = [pose.PoseLandmark.LEFT_SHOULDER.value,
                        pose.PoseLandmark.LEFT_HIP.value,
                        pose.PoseLandmark.LEFT_KNEE.value]
            knee_pts = [pose.PoseLandmark.LEFT_HIP.value,
                        pose.PoseLandmark.LEFT_KNEE.value,
                        pose.PoseLandmark.LEFT_ANKLE.value]
            neck_pts = [pose.PoseLandmark.LEFT_EAR.value,
                        pose.PoseLandmark.LEFT_SHOULDER.value]
        else:
            back_pts = [pose.PoseLandmark.RIGHT_SHOULDER.value,
                        pose.PoseLandmark.RIGHT_HIP.value,
                        pose.PoseLandmark.RIGHT_KNEE.value]
            knee_pts = [pose.PoseLandmark.RIGHT_HIP.value,
                        pose.PoseLandmark.RIGHT_KNEE.value,
                        pose.PoseLandmark.RIGHT_ANKLE.value]
            neck_pts = [pose.PoseLandmark.RIGHT_EAR.value,
                        pose.PoseLandmark.RIGHT_SHOULDER.value]

        for connection in pose.POSE_CONNECTIONS:
            start_idx, end_idx = connection
            start = landmarks[start_idx]
            end = landmarks[end_idx]
            x1, y1 = int(start.x * w), int(start.y * h)
            x2, y2 = int(end.x * w), int(end.y * h)
            cv2.line(image, (x1, y1), (x2, y2), (255, 255, 255), 2)

        for idx, lm in enumerate(landmarks):
            cx, cy = int(lm.x * w), int(lm.y * h)
            color = (255, 255, 255)
            if idx in back_pts:
                color = (0, 0, 0)
            elif idx in knee_pts:
                color = (139, 0, 0)
            elif idx in neck_pts:
                color = (0, 0, 139)
            cv2.circle(image, (cx, cy), 6, color, -1)

    def process_video(self, input_path, output_path, posture_type):
        cap = cv2.VideoCapture(input_path)

        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        analysis_results = []
        frame_count = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.pose.process(rgb_frame)

            if results.pose_landmarks:
                facing = self.detect_facing_direction(results.pose_landmarks.landmark)
                self.draw_custom_landmarks(frame, results.pose_landmarks.landmark, facing)

                if posture_type == 'squat':
                    analysis = self.analyze_squat_posture(results.pose_landmarks.landmark, facing)
                else:
                    analysis = self.analyze_sitting_posture(results.pose_landmarks.landmark, facing)

                analysis['timestamp'] = frame_count / fps
                analysis['postureType'] = posture_type
                analysis_results.append(analysis)

                color = (0, 255, 0) if analysis['isGoodPosture'] else (0, 0, 255)
                cv2.putText(frame, analysis['feedback'], (20, 40),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, color, 3, cv2.LINE_AA)

                y_offset = 80
                for angle_name, angle_value in analysis['angles'].items():
                    text = f"{angle_name.capitalize()}: {angle_value} deg"
                    cv2.putText(frame, text, (20, y_offset),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2, cv2.LINE_AA)
                    y_offset += 35

            out.write(frame)

        cap.release()
        out.release()

        return analysis_results

    def process_image(self, input_path, output_path, posture_type):
        image = cv2.imread(input_path)
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb_image)

        analysis_results = []

        if results.pose_landmarks:
            facing = self.detect_facing_direction(results.pose_landmarks.landmark)
            self.draw_custom_landmarks(image, results.pose_landmarks.landmark, facing)

            if posture_type == 'squat':
                analysis = self.analyze_squat_posture(results.pose_landmarks.landmark, facing)
            else:
                analysis = self.analyze_sitting_posture(results.pose_landmarks.landmark, facing)

            analysis['timestamp'] = 0
            analysis['postureType'] = posture_type
            analysis_results.append(analysis)

            color = (0, 255, 0) if analysis['isGoodPosture'] else (0, 0, 255)
            cv2.putText(image, analysis['feedback'], (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, color, 3, cv2.LINE_AA)

            y_offset = 80
            for angle_name, angle_value in analysis['angles'].items():
                text = f"{angle_name.capitalize()}: {angle_value} deg"
                cv2.putText(image, text, (20, y_offset),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2, cv2.LINE_AA)
                y_offset += 35

        cv2.imwrite(output_path, image)
        return analysis_results

def main():
    if len(sys.argv) != 4:
        print("Usage: python posture_analyzer.py <input_file> <output_file> <posture_type>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    posture_type = sys.argv[3]

    analyzer = PostureAnalyzer()

    try:
        file_extension = Path(input_path).suffix.lower()

        if file_extension in ['.mp4', '.avi', '.mov']:
            results = analyzer.process_video(input_path, output_path, posture_type)
        else:
            results = analyzer.process_image(input_path, output_path, posture_type)

        output_data = {
            'success': True,
            'analysis': results
        }

        print(json.dumps(output_data))

    except Exception as e:
        error_output = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_output))
        sys.exit(1)

if __name__ == "__main__":
    main()
