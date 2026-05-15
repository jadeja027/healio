export type BodyView = 'front' | 'back'

export type BodyRegion = {
  id: string
  label: string
  path: string
}

export const BODY_AREA_LABELS: Record<string, string> = {
  head: 'Head',
  neck: 'Neck',
  chest: 'Chest',
  abdomen: 'Abdomen',
  pelvis: 'Pelvis / Groin',
  left_shoulder: 'Left shoulder',
  right_shoulder: 'Right shoulder',
  left_arm: 'Left arm',
  right_arm: 'Right arm',
  left_hand: 'Left hand',
  right_hand: 'Right hand',
  left_thigh: 'Left thigh',
  right_thigh: 'Right thigh',
  left_knee: 'Left knee',
  right_knee: 'Right knee',
  left_foot: 'Left foot',
  right_foot: 'Right foot',
  upper_back: 'Upper back',
  lower_back: 'Lower back',
  left_leg: 'Left leg',
  right_leg: 'Right leg',
}

export const FRONT_REGIONS: BodyRegion[] = [
  { id: 'head', label: 'Head', path: 'M90 20 h20 a10 10 0 0 1 10 10 v16 a10 10 0 0 1-10 10 h-20 a10 10 0 0 1-10-10 v-16 a10 10 0 0 1 10-10z' },
  { id: 'neck', label: 'Neck', path: 'M92 56 h16 v14 h-16z' },
  { id: 'chest', label: 'Chest', path: 'M70 70 h60 v38 h-60z' },
  { id: 'abdomen', label: 'Abdomen', path: 'M72 108 h56 v38 h-56z' },
  { id: 'pelvis', label: 'Pelvis / Groin', path: 'M78 146 h44 v26 h-44z' },
  { id: 'left_shoulder', label: 'Left shoulder', path: 'M48 72 h22 v24 h-22z' },
  { id: 'right_shoulder', label: 'Right shoulder', path: 'M130 72 h22 v24 h-22z' },
  { id: 'left_arm', label: 'Left arm', path: 'M36 96 h24 v64 h-24z' },
  { id: 'right_arm', label: 'Right arm', path: 'M140 96 h24 v64 h-24z' },
  { id: 'left_hand', label: 'Left hand', path: 'M36 160 h24 v22 h-24z' },
  { id: 'right_hand', label: 'Right hand', path: 'M140 160 h24 v22 h-24z' },
  { id: 'left_thigh', label: 'Left thigh', path: 'M78 172 h20 v54 h-20z' },
  { id: 'right_thigh', label: 'Right thigh', path: 'M102 172 h20 v54 h-20z' },
  { id: 'left_knee', label: 'Left knee', path: 'M78 226 h20 v18 h-20z' },
  { id: 'right_knee', label: 'Right knee', path: 'M102 226 h20 v18 h-20z' },
  { id: 'left_foot', label: 'Left foot', path: 'M78 244 h20 v28 h-20z' },
  { id: 'right_foot', label: 'Right foot', path: 'M102 244 h20 v28 h-20z' },
]

export const BACK_REGIONS: BodyRegion[] = [
  { id: 'head', label: 'Head', path: 'M90 20 h20 a10 10 0 0 1 10 10 v16 a10 10 0 0 1-10 10 h-20 a10 10 0 0 1-10-10 v-16 a10 10 0 0 1 10-10z' },
  { id: 'neck', label: 'Neck', path: 'M92 56 h16 v14 h-16z' },
  { id: 'upper_back', label: 'Upper back', path: 'M70 70 h60 v40 h-60z' },
  { id: 'lower_back', label: 'Lower back', path: 'M72 110 h56 v40 h-56z' },
  { id: 'left_shoulder', label: 'Left shoulder', path: 'M48 72 h22 v24 h-22z' },
  { id: 'right_shoulder', label: 'Right shoulder', path: 'M130 72 h22 v24 h-22z' },
  { id: 'left_arm', label: 'Left arm', path: 'M36 96 h24 v68 h-24z' },
  { id: 'right_arm', label: 'Right arm', path: 'M140 96 h24 v68 h-24z' },
  { id: 'left_leg', label: 'Left leg', path: 'M78 150 h20 v96 h-20z' },
  { id: 'right_leg', label: 'Right leg', path: 'M102 150 h20 v96 h-20z' },
]
