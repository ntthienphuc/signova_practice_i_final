export type LessonType = "practice" | "quiz";

export interface Lesson {
  title: string;
  subtitle: string;
  type: LessonType;
  description: string;
}

export interface Unit {
  unitNumber: number;
  title: string;
  color: string;
  lessonCount: number;
  lessons: Lesson[];
}

export const LEARN_UNITS: Unit[] = [
  {
    unitNumber: 1,
    title: "The Alphabet",
    color: "#22C55E",
    lessonCount: 7,
    lessons: [
      {
        title: "Letters F-J",
        subtitle: "PRACTICE • LESSON 2",
        type: "practice",
        description:
          "Learn the hand shapes for letters F through J. Pay attention to the position of your fingers and thumb for each distinct shape.",
      },
      {
        title: "Letters K-O",
        subtitle: "PRACTICE • LESSON 3",
        type: "practice",
        description:
          "Master the hand configurations for K, L, M, N, and O. These letters introduce new wrist orientations and finger groupings.",
      },
      {
        title: "Letters P-T",
        subtitle: "PRACTICE • LESSON 4",
        type: "practice",
        description:
          "Practice the signs for P through T, including the tricky downward-pointing positions for P and Q.",
      },
      {
        title: "Letters U-Z",
        subtitle: "PRACTICE • LESSON 5",
        type: "practice",
        description:
          "Complete the alphabet with U through Z. This final set includes the more complex shapes for X and the motion letter Z.",
      },
      {
        title: "Practice: Short Words",
        subtitle: "PRACTICE • LESSON 6",
        type: "practice",
        description:
          "Put your letter knowledge to use by spelling out short common words. Speed and fluency are the focus here.",
      },
      {
        title: "Quiz: A-J",
        subtitle: "QUIZ • LESSON 7",
        type: "quiz",
        description:
          "Test your retention of the first half of the alphabet. You will be shown a handshape and asked to identify the correct letter.",
      },
    ],
  },
  {
    unitNumber: 2,
    title: "Numbers",
    color: "#0EA5E9",
    lessonCount: 4,
    lessons: [],
  },
  {
    unitNumber: 3,
    title: "Real World Spelling",
    color: "#F59E0B",
    lessonCount: 4,
    lessons: [],
  },
];
