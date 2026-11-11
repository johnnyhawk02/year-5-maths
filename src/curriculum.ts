// The Year 5 content map: 8 units covering the 49 statutory requirements of the
// national curriculum for England. Wording here is our own.

export interface Skill { id: string; name: string }
export interface Unit { id: string; number: number; name: string; skills: Skill[] }

const unit = (number: number, id: string, name: string, skills: string[]): Unit => ({
  id,
  number,
  name,
  skills: skills.map((s, i) => ({ id: `${id}-${i + 1}`, name: s })),
});

export const UNITS: Unit[] = [
  unit(1, 'place-value', 'Number and place value', [
    'Numbers to 1,000,000',
    'Counting in 10s, 100s, 1,000s and beyond',
    'Negative numbers',
    'Rounding large numbers',
    'Roman numerals',
  ]),
  unit(2, 'add-subtract', 'Addition and subtraction', [
    'Column addition',
    'Column subtraction',
    'Adding and subtracting in your head',
    'Estimating to check',
    'Multi-step problems',
  ]),
  unit(3, 'multiply-divide', 'Multiplication and division', [
    'Multiples and factors',
    'Prime numbers',
    'Square and cube numbers',
    'Multiplying and dividing by 10, 100 and 1,000',
    'Multiplying and dividing in your head',
    'Long multiplication',
    'Short division',
    'Mixed problems',
    'Scaling and rates',
  ]),
  unit(4, 'fractions', 'Fractions', [
    'Comparing and ordering fractions',
    'Equivalent fractions',
    'Mixed numbers and improper fractions',
    'Adding and subtracting fractions',
    'Multiplying fractions by whole numbers',
  ]),
  unit(5, 'decimals-percentages', 'Decimals and percentages', [
    'Decimals as fractions',
    'Thousandths',
    'Rounding decimals',
    'Ordering decimals',
    'Decimal problems',
    'Percentages',
    'Fractions, decimals and percentages',
  ]),
  unit(6, 'measurement', 'Measurement', [
    'Metric units',
    'Imperial units',
    'Perimeter',
    'Area',
    'Volume and capacity',
    'Time',
    'Measure and money problems',
  ]),
  unit(7, 'geometry', 'Geometry', [
    '3-D shapes',
    'Types of angle',
    'Measuring and drawing angles',
    'Angles at a point and on a line',
    'Rectangles and missing lengths',
    'Regular and irregular polygons',
    'Reflection and translation',
  ]),
  unit(8, 'statistics', 'Statistics', ['Line graphs', 'Tables and timetables']),
];

export const SKILL_COUNT = UNITS.reduce((n, u) => n + u.skills.length, 0);
